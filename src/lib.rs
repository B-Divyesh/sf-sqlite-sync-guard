//! Library surface for SQLite Sync Guard.
//!
//! Most users should use the `sqlite-sync-guard` binary. The small public API
//! exists so build systems can embed the same scan, export, and ignore logic.
//!
//! # Example
//!
//! ```no_run
//! use sqlite_sync_guard::scan_root;
//!
//! let report = scan_root("./Sync")?;
//! if !report.safe {
//!     eprintln!("{} database set(s) are unsafe", report.unsafe_count);
//! }
//! # Ok::<(), anyhow::Error>(())
//! ```

pub mod export;
pub mod ignore;
pub mod lock;
pub mod scan;

pub use export::{ExportOptions, ExportResult, export_database};
pub use ignore::{IgnoreClient, IgnoreOptions, IgnoreResult, write_ignore_rules};
pub use scan::{DatabaseSet, ScanReport, scan_root};
