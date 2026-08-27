use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{Context, Result, bail};
use rusqlite::{Connection, OpenFlags, backup::Backup};
use serde::Serialize;
use sha2::{Digest, Sha256};
use time::{OffsetDateTime, format_description::well_known::Rfc3339};

use crate::scan::{DatabaseSet, scan_root};

#[derive(Debug, Clone)]
pub struct ExportOptions {
    pub database: PathBuf,
    pub output: PathBuf,
    pub force: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExportResult {
    pub ok: bool,
    pub backup: String,
    pub manifest: String,
    pub bytes: u64,
    pub sha256: String,
    pub integrity_check: String,
}

#[derive(Debug, Serialize)]
struct Manifest<'a> {
    manifest_version: u8,
    tool: &'static str,
    tool_version: &'static str,
    created_utc: String,
    source: String,
    backup_file: String,
    bytes: u64,
    sha256: &'a str,
    sqlite_version: &'a str,
    integrity_check: &'a str,
    source_observations: Option<&'a DatabaseSet>,
    warning: &'static str,
}

pub fn export_database(options: &ExportOptions) -> Result<ExportResult> {
    let source = &options.database;
    if !source.is_file() {
        bail!(
            "database does not exist or is not a file: {}",
            source.display()
        );
    }
    fs::create_dir_all(&options.output).with_context(|| {
        format!(
            "cannot create output directory {}",
            options.output.display()
        )
    })?;

    let stem = source
        .file_stem()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .unwrap_or("database");
    let backup_path = options.output.join(format!("{stem}.backup.sqlite3"));
    let manifest_path = options.output.join(format!("{stem}.backup.manifest.json"));
    if !options.force && (backup_path.exists() || manifest_path.exists()) {
        bail!(
            "export already exists at {}; pass --force to replace the backup and manifest",
            options.output.display()
        );
    }

    let nonce = format!("{}.{}", std::process::id(), unix_nanos());
    let staged_backup = options.output.join(format!(".{stem}.backup.{nonce}.part"));
    let staged_manifest = options
        .output
        .join(format!(".{stem}.manifest.{nonce}.part"));

    let outcome = stage_export(source, &staged_backup, &staged_manifest, &backup_path);
    let (bytes, sha256, integrity) = match outcome {
        Ok(value) => value,
        Err(error) => {
            let _ = fs::remove_file(&staged_backup);
            let _ = fs::remove_file(&staged_manifest);
            return Err(error);
        }
    };

    if options.force {
        remove_if_present(&backup_path)?;
        remove_if_present(&manifest_path)?;
    }
    fs::rename(&staged_backup, &backup_path)
        .with_context(|| format!("cannot publish staged backup to {}", backup_path.display()))?;
    if let Err(error) = fs::rename(&staged_manifest, &manifest_path) {
        let _ = fs::remove_file(&backup_path);
        return Err(error).with_context(|| {
            format!(
                "cannot publish staged manifest to {} (backup was removed)",
                manifest_path.display()
            )
        });
    }

    Ok(ExportResult {
        ok: true,
        backup: backup_path.display().to_string(),
        manifest: manifest_path.display().to_string(),
        bytes,
        sha256,
        integrity_check: integrity,
    })
}

fn stage_export(
    source_path: &Path,
    staged_backup: &Path,
    staged_manifest: &Path,
    final_backup: &Path,
) -> Result<(u64, String, String)> {
    let source = Connection::open_with_flags(
        source_path,
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_URI,
    )
    .with_context(|| format!("cannot open SQLite database {}", source_path.display()))?;
    source.busy_timeout(Duration::from_secs(5))?;
    let mut destination = Connection::open(staged_backup)
        .with_context(|| format!("cannot stage backup at {}", staged_backup.display()))?;

    {
        let backup = Backup::new(&source, &mut destination)?;
        backup
            .run_to_completion(256, Duration::from_millis(50), None)
            .context("SQLite online backup did not complete")?;
    }
    let integrity: String = destination
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .context("cannot run integrity_check on the staged backup")?;
    if integrity != "ok" {
        bail!("staged backup failed integrity_check: {integrity}");
    }
    let sqlite_version: String = destination
        .query_row("SELECT sqlite_version()", [], |row| row.get(0))
        .context("cannot read SQLite version")?;
    drop(destination);
    drop(source);

    let bytes = fs::metadata(staged_backup)?.len();
    let sha256 = sha256_file(staged_backup)?;
    let observations = source_observations(source_path);
    let created_utc = OffsetDateTime::now_utc().format(&Rfc3339)?;
    let manifest = Manifest {
        manifest_version: 1,
        tool: "sqlite-sync-guard",
        tool_version: env!("CARGO_PKG_VERSION"),
        created_utc,
        source: source_path
            .canonicalize()
            .unwrap_or_else(|_| source_path.to_path_buf())
            .display()
            .to_string(),
        backup_file: final_backup
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned(),
        bytes,
        sha256: &sha256,
        sqlite_version: &sqlite_version,
        integrity_check: &integrity,
        source_observations: observations.as_ref(),
        warning: "Consistent snapshot only; do not use file sync for concurrent SQLite writers.",
    };
    let encoded = serde_json::to_vec_pretty(&manifest)?;
    let mut file = File::create(staged_manifest)
        .with_context(|| format!("cannot stage manifest at {}", staged_manifest.display()))?;
    file.write_all(&encoded)?;
    file.write_all(b"\n")?;
    file.sync_all()?;

    Ok((bytes, sha256, integrity))
}

fn source_observations(source: &Path) -> Option<DatabaseSet> {
    let parent = source.parent()?;
    let name = source.file_name()?.to_string_lossy().replace('\\', "/");
    scan_root(parent)
        .ok()?
        .database_sets
        .into_iter()
        .find(|set| set.database == name)
}

fn sha256_file(path: &Path) -> Result<String> {
    let mut file = File::open(path)?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        digest.update(&buffer[..read]);
    }
    Ok(format!("{:x}", digest.finalize()))
}

fn remove_if_present(path: &Path) -> Result<()> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error).with_context(|| format!("cannot replace {}", path.display())),
    }
}

fn unix_nanos() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos()
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use tempfile::tempdir;

    #[test]
    fn export_is_consistent_and_manifest_matches() {
        let dir = tempdir().unwrap();
        let source_path = dir.path().join("notes.db");
        let source = Connection::open(&source_path).unwrap();
        source
            .execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT)", [])
            .unwrap();
        source
            .execute(
                "INSERT INTO notes(body) VALUES (?1)",
                params!["safe handoff"],
            )
            .unwrap();
        drop(source);

        let output = dir.path().join("out");
        let result = export_database(&ExportOptions {
            database: source_path,
            output,
            force: false,
        })
        .unwrap();
        assert_eq!(result.integrity_check, "ok");
        assert_eq!(result.sha256.len(), 64);
        let backup = Connection::open(&result.backup).unwrap();
        let body: String = backup
            .query_row("SELECT body FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(body, "safe handoff");
        let manifest: serde_json::Value =
            serde_json::from_slice(&fs::read(&result.manifest).unwrap()).unwrap();
        assert_eq!(manifest["sha256"], result.sha256);
        assert_eq!(manifest["integrity_check"], "ok");
    }

    #[test]
    fn refuses_to_overwrite_by_default() {
        let dir = tempdir().unwrap();
        let source_path = dir.path().join("app.db");
        Connection::open(&source_path).unwrap();
        let output = dir.path().join("out");
        let options = ExportOptions {
            database: source_path,
            output,
            force: false,
        };
        export_database(&options).unwrap();
        assert!(
            export_database(&options)
                .unwrap_err()
                .to_string()
                .contains("--force")
        );
    }
}
