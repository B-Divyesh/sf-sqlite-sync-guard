//! Library surface for SQLite Sync Guard.
//!
//! Most users should use the `sqlite-sync-guard` binary. The small public API
//! exists so build systems can embed the same scan, export, and ignore logic.

pub mod export;
pub mod ignore;
pub mod lock;
pub mod scan;

pub use export::{ExportOptions, ExportResult, export_database};
pub use ignore::{IgnoreClient, IgnoreOptions, IgnoreResult, write_ignore_rules};
pub use scan::{DatabaseSet, ScanReport, scan_root};
