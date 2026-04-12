use crate::application::use_cases::{DatabaseUseCases, DeviceUseCases};
use crate::domain::entities::{FilterInfo, SortInfo};
use std::sync::{Arc, Mutex};
use tauri::State;

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

pub type SharedAppState = Arc<Mutex<AppState>>;

async fn run_with_state<T, F>(state: State<'_, SharedAppState>, task: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce(&AppState) -> Result<T, String> + Send + 'static,
{
    let state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let guard = state.lock().map_err(|e| e.to_string())?;
        task(&guard)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_devices(
    state: State<'_, SharedAppState>,
) -> Result<Vec<crate::domain::entities::Device>, String> {
    run_with_state(state, |app_state| app_state.device_use_cases.list_devices()).await
}

#[tauri::command]
pub async fn list_packages(
    state: State<'_, SharedAppState>,
    device_id: String,
) -> Result<Vec<crate::domain::entities::Package>, String> {
    run_with_state(state, move |app_state| {
        app_state.device_use_cases.list_packages(&device_id)
    })
    .await
}

#[tauri::command]
pub async fn get_device_overview(
    state: State<'_, SharedAppState>,
    device_id: String,
) -> Result<crate::domain::entities::DeviceOverview, String> {
    run_with_state(state, move |app_state| {
        app_state.device_use_cases.get_device_overview(&device_id)
    })
    .await
}

#[tauri::command]
pub async fn list_databases(
    state: State<'_, SharedAppState>,
    device_id: String,
    package_name: String,
) -> Result<Vec<crate::domain::entities::DatabaseInfo>, String> {
    run_with_state(state, move |app_state| {
        app_state
            .database_use_cases
            .list_databases(&device_id, &package_name)
    })
    .await
}

#[tauri::command]
pub async fn list_tables(
    state: State<'_, SharedAppState>,
    device_id: String,
    package_name: String,
    db_name: String,
    db_key: Option<String>,
) -> Result<Vec<String>, String> {
    run_with_state(state, move |app_state| {
        app_state
            .database_use_cases
            .list_tables(&device_id, &package_name, &db_name, db_key.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn get_table_schema(
    state: State<'_, SharedAppState>,
    device_id: String,
    package_name: String,
    db_name: String,
    table: String,
    db_key: Option<String>,
) -> Result<crate::domain::entities::TableSchema, String> {
    run_with_state(state, move |app_state| {
        app_state
            .database_use_cases
            .get_table_schema(&device_id, &package_name, &db_name, &table, db_key.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn get_table_data(
    state: State<'_, SharedAppState>,
    device_id: String,
    package_name: String,
    db_name: String,
    table: String,
    page: u32,
    page_size: u32,
    sort: Option<SortInfo>,
    filters: Option<Vec<FilterInfo>>,
    db_key: Option<String>,
) -> Result<crate::domain::entities::TableData, String> {
    run_with_state(state, move |app_state| {
        app_state.database_use_cases.get_table_data(
            &device_id,
            &package_name,
            &db_name,
            &table,
            page,
            page_size,
            sort,
            filters,
            db_key.as_deref(),
        )
    })
    .await
}

#[tauri::command]
pub async fn execute_sql(
    state: State<'_, SharedAppState>,
    device_id: String,
    package_name: String,
    db_name: String,
    sql: String,
    db_key: Option<String>,
) -> Result<crate::domain::entities::SqlResult, String> {
    run_with_state(state, move |app_state| {
        app_state
            .database_use_cases
            .execute_sql(&device_id, &package_name, &db_name, &sql, db_key.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn sync_changes(
    _device_id: String,
    _package_name: String,
    _db_name: String,
) -> Result<(), String> {
    Err("Sync not implemented in this version. Changes are temporary.".to_string())
}
