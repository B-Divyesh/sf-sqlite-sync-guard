use std::collections::BTreeMap;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, bail};
use serde::Serialize;
use walkdir::WalkDir;

use crate::lock::{LockState, probe_database, probe_wal_index};

const SQLITE_HEADER: &[u8; 16] = b"SQLite format 3\0";

#[derive(Debug, Clone, Serialize)]
pub struct ScanReport {
    pub root: String,
    pub safe: bool,
    pub database_count: usize,
    pub unsafe_count: usize,
    pub database_sets: Vec<DatabaseSet>,
    pub errors: Vec<ScanError>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DatabaseSet {
    pub database: String,
    pub database_present: bool,
    pub sqlite_header: bool,
    pub sidecars: Vec<Sidecar>,
    pub lock_state: LockState,
    pub unsafe_to_copy: bool,
    pub reasons: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Sidecar {
    pub kind: SidecarKind,
    pub path: String,
    pub bytes: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum SidecarKind {
    Wal,
    Shm,
    Journal,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScanError {
    pub path: String,
    pub message: String,
}

#[derive(Default)]
struct SetBuilder {
    header: bool,
    present: bool,
    sidecars: BTreeMap<SidecarKind, (PathBuf, u64)>,
}

pub fn scan_root(root: impl AsRef<Path>) -> Result<ScanReport> {
    let root = root.as_ref();
    if !root.exists() {
        bail!("scan root does not exist: {}", root.display());
    }
    if !root.is_dir() {
        bail!("scan root is not a directory: {}", root.display());
    }

    let mut sets: BTreeMap<PathBuf, SetBuilder> = BTreeMap::new();
    let mut errors = Vec::new();

    for entry in WalkDir::new(root).follow_links(false).into_iter() {
        let entry = match entry {
            Ok(entry) => entry,
            Err(error) => {
                errors.push(ScanError {
                    path: error
                        .path()
                        .map(|p| display_relative(root, p))
                        .unwrap_or_else(|| display_relative(root, root)),
                    message: error.to_string(),
                });
                continue;
            }
        };
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        if let Some((database, kind)) = sidecar_base(path) {
            let bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
            sets.entry(database)
                .or_default()
                .sidecars
                .insert(kind, (path.to_path_buf(), bytes));
            continue;
        }

        match has_sqlite_header(path) {
            Ok(true) => {
                let builder = sets.entry(path.to_path_buf()).or_default();
                builder.header = true;
                builder.present = true;
            }
            Ok(false) => {}
            Err(error) => errors.push(ScanError {
                path: display_relative(root, path),
                message: error.to_string(),
            }),
        }
    }

    let mut database_sets = Vec::with_capacity(sets.len());
    for (database, mut builder) in sets {
        if !builder.present {
            builder.present = database.is_file();
            if builder.present {
                builder.header = has_sqlite_header(&database).unwrap_or(false);
            }
        }

        let db_lock = if builder.present {
            probe_database(&database)
        } else {
            LockState::Available
        };
        let shm_lock = builder
            .sidecars
            .get(&SidecarKind::Shm)
            .map(|(path, _)| probe_wal_index(path));
        let lock_state = combine_locks(db_lock, shm_lock);

        let mut reasons = Vec::new();
        for kind in builder.sidecars.keys() {
            reasons.push(format!(
                "{} sidecar present",
                match kind {
                    SidecarKind::Wal => "WAL",
                    SidecarKind::Shm => "shared-memory",
                    SidecarKind::Journal => "rollback-journal",
                }
            ));
        }
        match lock_state {
            LockState::Active => reasons.push("active SQLite lock detected".into()),
            LockState::Unknown => reasons.push("lock state could not be verified".into()),
            LockState::Available => {}
        }
        if !builder.present {
            reasons
                .push("database file is missing; orphan sidecar may contain unsynced data".into());
        } else if !builder.header {
            reasons.push("database header is missing or unreadable".into());
        }
        let unsafe_to_copy = !reasons.is_empty();

        database_sets.push(DatabaseSet {
            database: display_relative(root, &database),
            database_present: builder.present,
            sqlite_header: builder.header,
            sidecars: builder
                .sidecars
                .into_iter()
                .map(|(kind, (path, bytes))| Sidecar {
                    kind,
                    path: display_relative(root, &path),
                    bytes,
                })
                .collect(),
            lock_state,
            unsafe_to_copy,
            reasons,
        });
    }

    let unsafe_count = database_sets
        .iter()
        .filter(|set| set.unsafe_to_copy)
        .count();
    Ok(ScanReport {
        root: root
            .canonicalize()
            .unwrap_or_else(|_| root.to_path_buf())
            .display()
            .to_string(),
        safe: unsafe_count == 0 && errors.is_empty(),
        database_count: database_sets.len(),
        unsafe_count,
        database_sets,
        errors,
    })
}

fn combine_locks(database: LockState, shm: Option<LockState>) -> LockState {
    match (database, shm) {
        (LockState::Active, _) | (_, Some(LockState::Active)) => LockState::Active,
        (LockState::Unknown, _) | (_, Some(LockState::Unknown)) => LockState::Unknown,
        _ => LockState::Available,
    }
}

fn has_sqlite_header(path: &Path) -> Result<bool> {
    let mut file = File::open(path).with_context(|| format!("cannot read {}", path.display()))?;
    let mut header = [0_u8; 16];
    match file.read_exact(&mut header) {
        Ok(()) => Ok(&header == SQLITE_HEADER),
        Err(error) if error.kind() == std::io::ErrorKind::UnexpectedEof => Ok(false),
        Err(error) => Err(error).with_context(|| format!("cannot read {}", path.display())),
    }
}

fn sidecar_base(path: &Path) -> Option<(PathBuf, SidecarKind)> {
    let name = path.file_name()?.to_str()?;
    let (base, kind) = if let Some(base) = name.strip_suffix("-wal") {
        (base, SidecarKind::Wal)
    } else if let Some(base) = name.strip_suffix("-shm") {
        (base, SidecarKind::Shm)
    } else {
        (name.strip_suffix("-journal")?, SidecarKind::Journal)
    };
    Some((path.with_file_name(base), kind))
}

fn display_relative(root: &Path, path: &Path) -> String {
    let relative = path.strip_prefix(root).unwrap_or(path);
    let value = relative.to_string_lossy().replace('\\', "/");
    if value.is_empty() { ".".into() } else { value }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn finds_headers_and_all_sidecar_types() {
        let dir = tempdir().unwrap();
        fs::write(dir.path().join("safe.db"), SQLITE_HEADER).unwrap();
        fs::write(dir.path().join("live.db"), SQLITE_HEADER).unwrap();
        fs::write(dir.path().join("live.db-wal"), b"wal").unwrap();
        fs::write(dir.path().join("live.db-shm"), vec![0; 128]).unwrap();
        fs::write(dir.path().join("old.db-journal"), b"journal").unwrap();

        let report = scan_root(dir.path()).unwrap();
        assert_eq!(report.database_count, 3);
        assert_eq!(report.unsafe_count, 2);
        assert!(!report.safe);
        let live = report
            .database_sets
            .iter()
            .find(|set| set.database == "live.db")
            .unwrap();
        assert_eq!(live.sidecars.len(), 2);
        assert!(live.unsafe_to_copy);
    }

    #[test]
    fn empty_root_is_safe() {
        let dir = tempdir().unwrap();
        let report = scan_root(dir.path()).unwrap();
        assert!(report.safe);
        assert_eq!(report.database_count, 0);
    }

    #[test]
    fn detects_real_wal_and_rollback_journal_fixtures() {
        let dir = tempdir().unwrap();
        let wal_path = dir.path().join("wal.db");
        let wal = Connection::open(&wal_path).unwrap();
        wal.query_row("PRAGMA journal_mode=WAL", [], |_| Ok(()))
            .unwrap();
        wal.execute("CREATE TABLE wal_data (id INTEGER)", [])
            .unwrap();
        wal.execute("INSERT INTO wal_data VALUES (1)", []).unwrap();

        let rollback_path = dir.path().join("rollback.db");
        let rollback = Connection::open(&rollback_path).unwrap();
        rollback
            .execute("CREATE TABLE rollback_data (id INTEGER)", [])
            .unwrap();
        rollback
            .execute_batch("BEGIN IMMEDIATE; INSERT INTO rollback_data VALUES (1);")
            .unwrap();

        assert!(dir.path().join("wal.db-wal").exists());
        assert!(dir.path().join("wal.db-shm").exists());
        assert!(dir.path().join("rollback.db-journal").exists());
        let report = scan_root(dir.path()).unwrap();
        assert_eq!(report.database_count, 2);
        assert_eq!(report.unsafe_count, 2);
        assert!(report.database_sets.iter().all(|set| set.unsafe_to_copy));

        rollback.execute_batch("ROLLBACK").unwrap();
        drop(rollback);
        drop(wal);
    }
}
