use std::collections::BTreeSet;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, bail};
use clap::ValueEnum;
use serde::Serialize;

use crate::scan::scan_root;

const START: &str = "# BEGIN sqlite-sync-guard";
const END: &str = "# END sqlite-sync-guard";

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum IgnoreClient {
    Syncthing,
    Resilio,
}

#[derive(Debug, Clone)]
pub struct IgnoreOptions {
    pub root: PathBuf,
    pub client: IgnoreClient,
    pub dry_run: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct IgnoreResult {
    pub ok: bool,
    pub client: String,
    pub file: String,
    pub database_count: usize,
    pub rule_count: usize,
    pub changed: bool,
    pub dry_run: bool,
    pub preview: String,
}

pub fn write_ignore_rules(options: &IgnoreOptions) -> Result<IgnoreResult> {
    let report = scan_root(&options.root)?;
    if !report.errors.is_empty() {
        bail!(
            "scan was incomplete ({} path error(s)); fix access errors before writing ignore rules",
            report.errors.len()
        );
    }

    let file = match options.client {
        IgnoreClient::Syncthing => options.root.join(".stignore"),
        IgnoreClient::Resilio => options.root.join(".sync").join("IgnoreList"),
    };
    let mut rules = BTreeSet::new();
    for database in &report.database_sets {
        let escaped = escape_rule(&database.database);
        rules.insert(format!("/{escaped}"));
        rules.insert(format!("/{escaped}-journal"));
        rules.insert(format!("/{escaped}-shm"));
        rules.insert(format!("/{escaped}-wal"));
    }

    let block = render_block(&rules);
    let existing = match fs::read_to_string(&file) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => String::new(),
        Err(error) => return Err(error).with_context(|| format!("cannot read {}", file.display())),
    };
    let updated = replace_managed_block(&existing, &block)?;
    let changed = existing != updated && !rules.is_empty();

    if changed && !options.dry_run {
        if let Some(parent) = file.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut writer = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&file)
            .with_context(|| format!("cannot write {}", file.display()))?;
        writer.write_all(updated.as_bytes())?;
        writer.sync_all()?;
    }

    Ok(IgnoreResult {
        ok: true,
        client: match options.client {
            IgnoreClient::Syncthing => "syncthing",
            IgnoreClient::Resilio => "resilio",
        }
        .into(),
        file: display_path(&file),
        database_count: report.database_count,
        rule_count: rules.len(),
        changed,
        dry_run: options.dry_run,
        preview: if rules.is_empty() {
            String::new()
        } else {
            block
        },
    })
}

fn render_block(rules: &BTreeSet<String>) -> String {
    let mut block = String::from(START);
    block.push_str("\n# Live SQLite files: sync an exported backup instead.\n");
    for rule in rules {
        block.push_str(rule);
        block.push('\n');
    }
    block.push_str(END);
    block.push('\n');
    block
}

fn replace_managed_block(existing: &str, block: &str) -> Result<String> {
    match (existing.find(START), existing.find(END)) {
        (Some(start), Some(end)) if end >= start => {
            let after = end + END.len();
            let after = if existing[after..].starts_with('\n') {
                after + 1
            } else {
                after
            };
            let mut value = String::with_capacity(existing.len() + block.len());
            value.push_str(&existing[..start]);
            value.push_str(block);
            value.push_str(&existing[after..]);
            Ok(value)
        }
        (None, None) => {
            let mut value = existing.to_owned();
            if !value.is_empty() && !value.ends_with('\n') {
                value.push('\n');
            }
            if !value.is_empty() {
                value.push('\n');
            }
            value.push_str(block);
            Ok(value)
        }
        _ => bail!("ignore file contains an incomplete sqlite-sync-guard managed block"),
    }
}

fn escape_rule(path: &str) -> String {
    path.replace('\\', "/")
}

fn display_path(path: &Path) -> String {
    path.display().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use tempfile::tempdir;

    #[test]
    fn preserves_rules_and_is_idempotent() {
        let dir = tempdir().unwrap();
        let database = Connection::open(dir.path().join("state.db")).unwrap();
        database
            .execute("CREATE TABLE state (id INTEGER)", [])
            .unwrap();
        drop(database);
        fs::write(dir.path().join(".stignore"), "keep-this-rule\n").unwrap();
        let options = IgnoreOptions {
            root: dir.path().to_path_buf(),
            client: IgnoreClient::Syncthing,
            dry_run: false,
        };
        let first = write_ignore_rules(&options).unwrap();
        let second = write_ignore_rules(&options).unwrap();
        let contents = fs::read_to_string(dir.path().join(".stignore")).unwrap();
        assert!(first.changed);
        assert!(!second.changed);
        assert!(contents.starts_with("keep-this-rule"));
        assert!(contents.contains("/state.db-wal"));
        assert_eq!(contents.matches(START).count(), 1);
    }

    #[test]
    fn dry_run_does_not_write() {
        let dir = tempdir().unwrap();
        let database = Connection::open(dir.path().join("state.db")).unwrap();
        database
            .execute("CREATE TABLE state (id INTEGER)", [])
            .unwrap();
        drop(database);
        let result = write_ignore_rules(&IgnoreOptions {
            root: dir.path().to_path_buf(),
            client: IgnoreClient::Resilio,
            dry_run: true,
        })
        .unwrap();
        assert!(result.changed);
        assert!(!dir.path().join(".sync/IgnoreList").exists());
    }
}
