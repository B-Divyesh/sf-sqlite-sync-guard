use std::fs::{File, OpenOptions};
use std::io;
use std::path::Path;

use serde::Serialize;

const PENDING_BYTE: u64 = 0x4000_0000;
const DB_LOCK_BYTES: u64 = 512;
const WAL_LOCK_START: u64 = 120;
const WAL_LOCK_BYTES: u64 = 8;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum LockState {
    Available,
    Active,
    Unknown,
}

pub fn probe_database(path: &Path) -> LockState {
    probe(path, PENDING_BYTE, DB_LOCK_BYTES)
}

pub fn probe_wal_index(path: &Path) -> LockState {
    probe(path, WAL_LOCK_START, WAL_LOCK_BYTES)
}

fn probe(path: &Path, offset: u64, length: u64) -> LockState {
    let file = match OpenOptions::new().read(true).write(true).open(path) {
        Ok(file) => file,
        Err(_) => return LockState::Unknown,
    };

    match try_exclusive_range(&file, offset, length) {
        Ok(true) => LockState::Available,
        Ok(false) => LockState::Active,
        Err(_) => LockState::Unknown,
    }
}

#[cfg(unix)]
fn try_exclusive_range(file: &File, offset: u64, length: u64) -> io::Result<bool> {
    use std::os::fd::AsRawFd;

    let mut lock = libc::flock {
        l_type: libc::F_WRLCK as i16,
        l_whence: libc::SEEK_SET as i16,
        l_start: offset as libc::off_t,
        l_len: length as libc::off_t,
        l_pid: 0,
    };
    // SAFETY: `lock` is initialized for F_SETLK and the file descriptor stays
    // valid for this call.
    let result = unsafe { libc::fcntl(file.as_raw_fd(), libc::F_SETLK, &lock) };
    if result == -1 {
        let error = io::Error::last_os_error();
        return match error.raw_os_error() {
            Some(libc::EACCES | libc::EAGAIN) => Ok(false),
            _ => Err(error),
        };
    }

    lock.l_type = libc::F_UNLCK as i16;
    // SAFETY: same initialized structure and live descriptor as above.
    let unlock = unsafe { libc::fcntl(file.as_raw_fd(), libc::F_SETLK, &lock) };
    if unlock == -1 {
        return Err(io::Error::last_os_error());
    }
    Ok(true)
}

#[cfg(windows)]
fn try_exclusive_range(file: &File, offset: u64, length: u64) -> io::Result<bool> {
    use std::mem::zeroed;
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Foundation::{ERROR_LOCK_VIOLATION, GetLastError};
    use windows_sys::Win32::Storage::FileSystem::{
        LOCKFILE_EXCLUSIVE_LOCK, LOCKFILE_FAIL_IMMEDIATELY, LockFileEx, UnlockFileEx,
    };
    use windows_sys::Win32::System::IO::OVERLAPPED;

    // SAFETY: OVERLAPPED is a plain Windows API struct; zero is the documented
    // initialization and the file handle remains valid throughout both calls.
    let mut overlapped: OVERLAPPED = unsafe { zeroed() };
    overlapped.Anonymous.Anonymous.Offset = offset as u32;
    overlapped.Anonymous.Anonymous.OffsetHigh = (offset >> 32) as u32;
    let handle = file.as_raw_handle() as isize;
    let result = unsafe {
        LockFileEx(
            handle,
            LOCKFILE_EXCLUSIVE_LOCK | LOCKFILE_FAIL_IMMEDIATELY,
            0,
            length as u32,
            (length >> 32) as u32,
            &mut overlapped,
        )
    };
    if result == 0 {
        let code = unsafe { GetLastError() };
        return if code == ERROR_LOCK_VIOLATION {
            Ok(false)
        } else {
            Err(io::Error::from_raw_os_error(code as i32))
        };
    }
    let unlocked = unsafe {
        UnlockFileEx(
            handle,
            0,
            length as u32,
            (length >> 32) as u32,
            &mut overlapped,
        )
    };
    if unlocked == 0 {
        return Err(io::Error::last_os_error());
    }
    Ok(true)
}

#[cfg(not(any(unix, windows)))]
fn try_exclusive_range(_file: &File, _offset: u64, _length: u64) -> io::Result<bool> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "lock probing is not supported on this platform",
    ))
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::fs;
    use std::process::Command;
    use std::thread;
    use std::time::{Duration, Instant};
    use tempfile::tempdir;

    #[test]
    fn detects_lock_held_by_another_process() {
        let dir = tempdir().unwrap();
        let database = dir.path().join("locked.db");
        let ready = dir.path().join("ready");
        fs::write(&database, b"SQLite format 3\0").unwrap();
        let mut child = Command::new(std::env::current_exe().unwrap())
            .args([
                "--ignored",
                "--exact",
                "lock::tests::lock_holder_child",
                "--nocapture",
            ])
            .env("SQLITE_SYNC_GUARD_LOCK_FILE", &database)
            .env("SQLITE_SYNC_GUARD_READY_FILE", &ready)
            .spawn()
            .unwrap();

        let deadline = Instant::now() + Duration::from_secs(3);
        while !ready.exists() && Instant::now() < deadline {
            thread::sleep(Duration::from_millis(20));
        }
        assert!(ready.exists(), "lock helper did not become ready");
        assert_eq!(probe_database(&database), LockState::Active);
        child.kill().unwrap();
        let _ = child.wait();
    }

    #[test]
    #[ignore]
    fn lock_holder_child() {
        use std::os::fd::AsRawFd;

        let Ok(database) = std::env::var("SQLITE_SYNC_GUARD_LOCK_FILE") else {
            return;
        };
        let ready = std::env::var("SQLITE_SYNC_GUARD_READY_FILE").unwrap();
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(database)
            .unwrap();
        let lock = libc::flock {
            l_type: libc::F_WRLCK as i16,
            l_whence: libc::SEEK_SET as i16,
            l_start: PENDING_BYTE as libc::off_t,
            l_len: DB_LOCK_BYTES as libc::off_t,
            l_pid: 0,
        };
        // SAFETY: initialized flock and live file descriptor.
        assert_ne!(
            unsafe { libc::fcntl(file.as_raw_fd(), libc::F_SETLK, &lock) },
            -1
        );
        fs::write(ready, b"ready").unwrap();
        thread::sleep(Duration::from_secs(30));
    }
}
