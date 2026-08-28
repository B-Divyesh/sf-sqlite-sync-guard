use std::fs;
use std::process::Command;

use rusqlite::Connection;
use sha2::{Digest, Sha256};
use tempfile::tempdir;

fn binary() -> Command {
    Command::new(env!("CARGO_BIN_EXE_sqlite-sync-guard"))
}

#[test]
fn documented_scan_json_contract_and_exit_codes() {
    let dir = tempdir().unwrap();
    let database = dir.path().join("app.db");
    let connection = Connection::open(&database).unwrap();
    connection
        .execute("CREATE TABLE events (id INTEGER)", [])
        .unwrap();
    drop(connection);

    let safe = binary()
        .args(["--json", "scan"])
        .arg(dir.path())
        .output()
        .unwrap();
    assert!(safe.status.success());
    let value: serde_json::Value = serde_json::from_slice(&safe.stdout).unwrap();
    assert_eq!(value["safe"], true);

    fs::write(dir.path().join("app.db-wal"), b"live pages").unwrap();
    let unsafe_scan = binary()
        .args(["scan"])
        .arg(dir.path())
        .arg("--json")
        .output()
        .unwrap();
    assert_eq!(unsafe_scan.status.code(), Some(2));
    let value: serde_json::Value = serde_json::from_slice(&unsafe_scan.stdout).unwrap();
    assert_eq!(value["unsafe_count"], 1);
    assert_eq!(value["database_sets"][0]["sidecars"][0]["kind"], "wal");
}

#[test]
fn documented_export_command_creates_transfer_pair() {
    let dir = tempdir().unwrap();
    let database = dir.path().join("app.db");
    let connection = Connection::open(&database).unwrap();
    connection
        .execute("CREATE TABLE events (id INTEGER)", [])
        .unwrap();
    connection
        .execute("INSERT INTO events VALUES (42)", [])
        .unwrap();
    drop(connection);
    let output_dir = dir.path().join("transfer");

    let output = binary()
        .arg("export")
        .arg(&database)
        .arg("--output")
        .arg(&output_dir)
        .arg("--json")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(output_dir.join("app.backup.sqlite3").is_file());
    assert!(output_dir.join("app.backup.manifest.json").is_file());
}

#[test]
fn claim_demo_isolated_and_real() {
    let first = binary().args(["--json", "demo"]).output().unwrap();
    let second = binary().args(["demo", "--json"]).output().unwrap();
    assert!(first.status.success());
    assert!(second.status.success());
    let a: serde_json::Value = serde_json::from_slice(&first.stdout).unwrap();
    let b: serde_json::Value = serde_json::from_slice(&second.stdout).unwrap();
    assert_eq!(a["demo"], true);
    assert_ne!(a["workspace"], b["workspace"]);
    assert_eq!(a["scan"]["unsafe_count"], 1);
    assert!(std::path::Path::new(a["transfer_backup"].as_str().unwrap()).is_file());
    assert!(std::path::Path::new(a["manifest"].as_str().unwrap()).is_file());
}

#[test]
fn claim_verified_transfer_and_overwrite() {
    let dir = tempdir().unwrap();
    let database = dir.path().join("data.db");
    let connection = Connection::open(&database).unwrap();
    connection
        .execute("CREATE TABLE records(value TEXT)", [])
        .unwrap();
    connection
        .execute("INSERT INTO records VALUES ('committed')", [])
        .unwrap();
    drop(connection);
    let output_dir = dir.path().join("out");
    let first = binary()
        .args(["export"])
        .arg(&database)
        .arg("--output")
        .arg(&output_dir)
        .arg("--json")
        .output()
        .unwrap();
    assert!(first.status.success());
    let result: serde_json::Value = serde_json::from_slice(&first.stdout).unwrap();
    let backup = std::path::Path::new(result["backup"].as_str().unwrap());
    let manifest_path = std::path::Path::new(result["manifest"].as_str().unwrap());
    assert_eq!(
        Connection::open(backup)
            .unwrap()
            .query_row::<String, _, _>("PRAGMA integrity_check", [], |row| row.get(0))
            .unwrap(),
        "ok"
    );
    let digest = format!("{:x}", Sha256::digest(fs::read(backup).unwrap()));
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(manifest_path).unwrap()).unwrap();
    assert_eq!(manifest["sha256"], digest);
    assert!(manifest["bytes"].as_u64().unwrap() > 0);
    let refused = binary()
        .arg("export")
        .arg(&database)
        .arg("--output")
        .arg(&output_dir)
        .output()
        .unwrap();
    assert_eq!(refused.status.code(), Some(1));
    let forced = binary()
        .arg("export")
        .arg(&database)
        .arg("--output")
        .arg(&output_dir)
        .arg("--force")
        .output()
        .unwrap();
    assert!(forced.status.success());
}

#[test]
fn claim_scan_is_read_only_and_all_sidecars_are_unsafe() {
    for suffix in ["-wal", "-shm", "-journal"] {
        let dir = tempdir().unwrap();
        let database = dir.path().join("data.db");
        let connection = Connection::open(&database).unwrap();
        connection.execute("CREATE TABLE t(x)", []).unwrap();
        drop(connection);
        let before = fs::read(&database).unwrap();
        fs::write(
            dir.path().join(format!("data.db{suffix}")),
            b"sample journal",
        )
        .unwrap();
        let scan = binary()
            .arg("scan")
            .arg(dir.path())
            .arg("--json")
            .output()
            .unwrap();
        assert_eq!(scan.status.code(), Some(2));
        assert_eq!(fs::read(&database).unwrap(), before);
    }
}

#[test]
fn claim_ignore_rules_preserve_content_and_repeat_cleanly() {
    let dir = tempdir().unwrap();
    let database = dir.path().join("data.db");
    let connection = Connection::open(&database).unwrap();
    connection.execute("CREATE TABLE t(x)", []).unwrap();
    drop(connection);
    fs::write(dir.path().join(".stignore"), "keep-this-rule\n").unwrap();
    let run = || {
        binary()
            .arg("ignore")
            .arg(dir.path())
            .args(["--client", "syncthing"])
            .output()
            .unwrap()
    };
    assert!(run().status.success());
    let first = fs::read(dir.path().join(".stignore")).unwrap();
    assert!(String::from_utf8_lossy(&first).contains("keep-this-rule"));
    assert!(run().status.success());
    assert_eq!(fs::read(dir.path().join(".stignore")).unwrap(), first);
    let dry = binary()
        .arg("ignore")
        .arg(dir.path())
        .args(["--client", "resilio", "--dry-run"])
        .output()
        .unwrap();
    assert!(dry.status.success());
    assert!(!dir.path().join(".sync/IgnoreList").exists());
}
