use std::fs;
use std::process::Command;

use rusqlite::Connection;
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
