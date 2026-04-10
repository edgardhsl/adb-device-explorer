use crate::application::use_cases::{DatabaseUseCases, DeviceUseCases};
use crate::domain::entities::{FilterInfo, SortInfo};
use std::sync::Mutex;

pub struct AppState {
    pub device_use_cases: DeviceUseCases,
    pub database_use_cases: DatabaseUseCases,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            device_use_cases: DeviceUseCases::new(),
            database_use_cases: DatabaseUseCases::new(),
        }
    }
}

lazy_static::lazy_static! {
    static ref APP_STATE: Mutex<AppState> = Mutex::new(AppState::new());
}

#[tauri::command]
pub async fn list_devices() -> Result<Vec<crate::domain::entities::Device>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state.device_use_cases.list_devices()
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_packages(
    device_id: String,
) -> Result<Vec<crate::domain::entities::Package>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state.device_use_cases.list_packages(&device_id)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_databases(
    device_id: String,
    package_name: String,
) -> Result<Vec<crate::domain::entities::DatabaseInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state
            .database_use_cases
            .list_databases(&device_id, &package_name)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_tables(
    device_id: String,
    package_name: String,
    db_name: String,
) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state
            .database_use_cases
            .list_tables(&device_id, &package_name, &db_name)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_table_schema(
    device_id: String,
    package_name: String,
    db_name: String,
    table: String,
) -> Result<crate::domain::entities::TableSchema, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state
            .database_use_cases
            .get_table_schema(&device_id, &package_name, &db_name, &table)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_table_data(
    device_id: String,
    package_name: String,
    db_name: String,
    table: String,
    page: u32,
    page_size: u32,
    sort: Option<SortInfo>,
    filters: Option<Vec<FilterInfo>>,
) -> Result<crate::domain::entities::TableData, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state.database_use_cases.get_table_data(
            &device_id,
            &package_name,
            &db_name,
            &table,
            page,
            page_size,
            sort,
            filters,
        )
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn execute_sql(
    device_id: String,
    package_name: String,
    db_name: String,
    sql: String,
) -> Result<crate::domain::entities::SqlResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = APP_STATE.lock().map_err(|e| e.to_string())?;
        state
            .database_use_cases
            .execute_sql(&device_id, &package_name, &db_name, &sql)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn sync_changes(
    _device_id: String,
    _package_name: String,
    _db_name: String,
) -> Result<(), String> {
    Err("Sync not implemented in this version. Changes are temporary.".to_string())
}
