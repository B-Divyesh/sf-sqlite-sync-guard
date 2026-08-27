use std::path::PathBuf;
use std::process::ExitCode;

use anyhow::Result;
use clap::{Parser, Subcommand};
use serde::Serialize;
use sqlite_sync_guard::{
    ExportOptions, IgnoreClient, IgnoreOptions, export_database, scan_root, write_ignore_rules,
};

#[derive(Debug, Parser)]
#[command(
    name = "sqlite-sync-guard",
    version,
    about = "Preflight live SQLite files before folder sync",
    long_about = "Find unsafe SQLite/WAL sets, create a consistent handoff backup, and keep live databases out of file-sync clients. This tool prevents unsafe copying; it does not enable concurrent SQLite writers.",
    after_help = "EXIT CODES:\n  0  Safe / command completed\n  1  Operational error or incomplete scan\n  2  Unsafe database set found by scan"
)]
struct Cli {
    /// Emit stable machine-readable JSON to stdout
    #[arg(long, global = true)]
    json: bool,

    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Find SQLite databases, sidecars, and active lock bytes without opening SQLite
    Scan {
        /// Folder that is copied by a sync client
        #[arg(value_name = "ROOT")]
        root: PathBuf,
    },
    /// Create a consistent SQLite backup and integrity manifest
    Export {
        /// Source SQLite database (live WAL mode is supported)
        #[arg(value_name = "DATABASE")]
        database: PathBuf,

        /// Directory for <name>.backup.sqlite3 and its manifest
        #[arg(short, long, value_name = "DIR")]
        output: PathBuf,

        /// Replace an existing backup and manifest
        #[arg(long)]
        force: bool,
    },
    /// Add idempotent exclusions for every discovered SQLite database
    Ignore {
        /// Sync root containing the databases
        #[arg(value_name = "ROOT")]
        root: PathBuf,

        /// Ignore file format to update
        #[arg(long, value_enum)]
        client: IgnoreClient,

        /// Print the managed block without modifying a file
        #[arg(long)]
        dry_run: bool,
    },
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    match run(&cli) {
        Ok(code) => code,
        Err(error) => {
            if cli.json {
                println!(
                    "{}",
                    serde_json::json!({ "ok": false, "error": format!("{error:#}") })
                );
            } else {
                eprintln!("error: {error:#}");
            }
            ExitCode::from(1)
        }
    }
}

fn run(cli: &Cli) -> Result<ExitCode> {
    match &cli.command {
        Command::Scan { root } => {
            let report = scan_root(root)?;
            if cli.json {
                print_json(&report)?;
            } else {
                print_scan(&report);
            }
            if !report.errors.is_empty() {
                Ok(ExitCode::from(1))
            } else if report.unsafe_count > 0 {
                Ok(ExitCode::from(2))
            } else {
                Ok(ExitCode::SUCCESS)
            }
        }
        Command::Export {
            database,
            output,
            force,
        } => {
            let result = export_database(&ExportOptions {
                database: database.clone(),
                output: output.clone(),
                force: *force,
            })?;
            if cli.json {
                print_json(&result)?;
            } else {
                println!("SAFE EXPORT\n  backup:   {}", result.backup);
                println!("  manifest: {}", result.manifest);
                println!("  sha256:   {}", result.sha256);
                println!("  integrity_check: {}", result.integrity_check);
                println!("\nSync the backup and manifest, not the live database.");
            }
            Ok(ExitCode::SUCCESS)
        }
        Command::Ignore {
            root,
            client,
            dry_run,
        } => {
            let result = write_ignore_rules(&IgnoreOptions {
                root: root.clone(),
                client: *client,
                dry_run: *dry_run,
            })?;
            if cli.json {
                print_json(&result)?;
            } else if result.database_count == 0 {
                println!("EMPTY — no SQLite databases found; no ignore file changed.");
            } else if result.dry_run {
                println!(
                    "DRY RUN — {} rules for {}\n",
                    result.rule_count, result.file
                );
                print!("{}", result.preview);
            } else if result.changed {
                println!(
                    "UPDATED {} with {} managed rules.",
                    result.file, result.rule_count
                );
            } else {
                println!("UNCHANGED — {} already has the current rules.", result.file);
            }
            Ok(ExitCode::SUCCESS)
        }
    }
}

fn print_json(value: &impl Serialize) -> Result<()> {
    println!("{}", serde_json::to_string_pretty(value)?);
    Ok(())
}

fn print_scan(report: &sqlite_sync_guard::ScanReport) {
    if report.database_count == 0 && report.errors.is_empty() {
        println!(
            "SAFE — no SQLite databases or sidecars found in {}",
            report.root
        );
        return;
    }

    for set in &report.database_sets {
        let state = if set.unsafe_to_copy { "UNSAFE" } else { "SAFE" };
        println!("{state}  {}", set.database);
        for reason in &set.reasons {
            println!("        - {reason}");
        }
    }
    for error in &report.errors {
        println!("ERROR   {} — {}", error.path, error.message);
    }
    println!();
    if report.errors.is_empty() && report.unsafe_count == 0 {
        println!(
            "SAFE — {} database set(s) have no sidecars or active locks.",
            report.database_count
        );
    } else if !report.errors.is_empty() {
        println!(
            "INCOMPLETE — {} path(s) could not be inspected.",
            report.errors.len()
        );
    } else {
        println!(
            "DO NOT SYNC — {} of {} database set(s) are unsafe to copy live.",
            report.unsafe_count, report.database_count
        );
        println!("Close writers or run `sqlite-sync-guard export <db> --output <dir>`. ");
    }
}
