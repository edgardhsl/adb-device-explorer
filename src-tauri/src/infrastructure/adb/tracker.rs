use std::io::{BufReader, Read};
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const DEVICES_CHANGED_EVENT: &str = "adb-devices-changed";

pub fn start_device_tracker(app: AppHandle) {
    thread::spawn(move || loop {
        if let Err(error) = run_tracker_session(&app) {
            log::warn!("ADB track-devices stopped: {}", error);
        }

        thread::sleep(Duration::from_secs(2));
    });
}

fn run_tracker_session(app: &AppHandle) -> Result<(), String> {
    let mut cmd = Command::new("adb");
    cmd.args(["track-devices"])
        .stdout(Stdio::piped())
        .stderr(Stdio::null());

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start 'adb track-devices': {}", e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to read ADB tracker stdout".to_string())?;

    let mut reader = BufReader::new(stdout);

    loop {
        let mut len_buf = [0_u8; 4];
        match reader.read_exact(&mut len_buf) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::UnexpectedEof => break,
            Err(error) => return Err(format!("Error reading ADB tracker header: {}", error)),
        }

        let len_hex = std::str::from_utf8(&len_buf)
            .map_err(|e| format!("Invalid ADB tracker header: {}", e))?;
        let payload_len = usize::from_str_radix(len_hex, 16)
            .map_err(|e| format!("Invalid ADB tracker length '{}': {}", len_hex, e))?;

        if payload_len > 0 {
            let mut payload = vec![0_u8; payload_len];
            reader
                .read_exact(&mut payload)
                .map_err(|e| format!("Error reading ADB tracker payload: {}", e))?;
        }

        if let Err(error) = app.emit(DEVICES_CHANGED_EVENT, ()) {
            log::debug!("Failed to emit device event: {}", error);
        }
    }

    let status = child
        .wait()
        .map_err(|e| format!("Failed waiting for ADB tracker process: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("ADB tracker exited with status: {}", status))
    }
}
