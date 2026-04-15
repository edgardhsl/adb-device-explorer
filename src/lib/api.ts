import { invoke } from '@tauri-apps/api/core';
import type {
  AppConfig,
  DatabaseInfo,
  Device,
  DeviceOverview,
  FilterInfo,
  Package,
  SortInfo,
  SqlResult,
  TableData,
  TableSchema,
} from './types';
import {
  executeMockSql,
  getMockTableData,
  getMockTableSchema,
  listMockDatabases,
  listMockDevices,
  listMockPackages,
  listMockTables,
  syncMockChanges,
} from "./mock-adb";

const shouldUseMockAdb =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_E2E_MOCK_ADB === "true";

export async function listDevices(): Promise<Device[]> {
  if (shouldUseMockAdb) return listMockDevices();
  return invoke('list_devices');
}

export async function listPackages(deviceId: string): Promise<Package[]> {
  if (shouldUseMockAdb) return listMockPackages(deviceId);
  return invoke('list_packages', { deviceId });
}

export async function getDeviceOverview(deviceId: string): Promise<DeviceOverview> {
  return invoke('get_device_overview', { deviceId });
}

export async function listDatabases(deviceId: string, packageName: string): Promise<DatabaseInfo[]> {
  if (shouldUseMockAdb) return listMockDatabases(deviceId, packageName);
  return invoke('list_databases', { deviceId, packageName });
}

export async function listTables(
  deviceId: string,
  packageName: string,
  dbName: string,
  dbKey?: string
): Promise<string[]> {
  if (shouldUseMockAdb) return listMockTables(deviceId, packageName, dbName);
  return invoke('list_tables', { deviceId, packageName, dbName, dbKey });
}

export async function getTableSchema(
  deviceId: string,
  packageName: string,
  dbName: string,
  table: string,
  dbKey?: string
): Promise<TableSchema> {
  if (shouldUseMockAdb) return getMockTableSchema(deviceId, packageName, dbName, table);
  return invoke('get_table_schema', {
    deviceId,
    packageName,
    dbName,
    table,
    dbKey,
  });
}

export async function getTableData(
  deviceId: string,
  packageName: string,
  dbName: string,
  table: string,
  page: number,
  pageSize: number,
  sort?: SortInfo,
  filters?: FilterInfo[],
  dbKey?: string
): Promise<TableData> {
  if (shouldUseMockAdb) {
    return getMockTableData(deviceId, packageName, dbName, table, page, pageSize, sort, filters);
  }
  return invoke('get_table_data', {
    deviceId,
    packageName,
    dbName,
    table,
    page,
    pageSize,
    sort,
    filters,
    dbKey,
  });
}

export async function executeSql(
  deviceId: string,
  packageName: string,
  dbName: string,
  sql: string,
  dbKey?: string
): Promise<SqlResult> {
  if (shouldUseMockAdb) return executeMockSql();
  return invoke('execute_sql', {
    deviceId,
    packageName,
    dbName,
    sql,
    dbKey,
  });
}

export async function syncChanges(
  deviceId: string,
  packageName: string,
  dbName: string
): Promise<void> {
  if (shouldUseMockAdb) return syncMockChanges();
  return invoke('sync_changes', {
    deviceId,
    packageName,
    dbName,
  });
}

export async function getAppConfig(): Promise<AppConfig> {
  return invoke('get_app_config');
}

export async function saveAppConfig(
  opensslDir: string,
  opensslLibDir: string,
  opensslIncludeDir: string,
  preferredLocale?: string
): Promise<AppConfig> {
  return invoke('save_app_config', {
    opensslDir,
    opensslLibDir,
    opensslIncludeDir,
    preferredLocale,
  });
}
