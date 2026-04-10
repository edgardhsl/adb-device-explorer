"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { 
  Smartphone, 
  Database, 
  Table2, 
  RefreshCw, 
  Search,
  Moon,
  Sun,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  LayoutGrid,
  FolderOpen,
} from "lucide-react";
import { LanguageDropdown } from "@/components/ui/language-dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listDevices, listPackages, listDatabases, listTables, getTableData, getTableSchema, executeSql } from "@/lib/api";
import type { SortInfo, FilterInfo } from "@/lib/types";
import { cn, getValueLabel } from "@/lib/utils";
import { useI18n, I18nProvider } from "@/lib/I18nContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function AppContent() {
  type PendingRowEdit = {
    pkValue: unknown;
    changes: Record<string, string>;
  };

  const { t, locale, setLocale } = useI18n();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [packageSearch, setPackageSearch] = useState("");
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortInfo, setSortInfo] = useState<SortInfo | null>(null);
  const [filters, setFilters] = useState<FilterInfo[]>([]);
  const [filterInput, setFilterInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [addRowDialog, setAddRowDialog] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [pendingRowEdits, setPendingRowEdits] = useState<Record<string, PendingRowEdit>>({});
  const [savingPendingRows, setSavingPendingRows] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const { data: devices = [], isLoading: loadingDevices, refetch: refetchDevices } = useQuery({
    queryKey: ["devices"],
    queryFn: listDevices,
  });

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const registerListener = async () => {
      try {
        unlisten = await listen("adb-devices-changed", () => {
          void refetchDevices();
        });
      } catch {
        // Running outside Tauri (e.g. browser preview)
      }
    };

    void registerListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [refetchDevices]);

  useEffect(() => {
    if (!selectedDevice) return;
    const stillConnected = devices.some((device) => device.id === selectedDevice);
    if (stillConnected) return;

    setSelectedDevice(null);
    setSelectedPackage(null);
    setSelectedDb(null);
    setSelectedTable(null);
    setEditingCell(null);
    setPendingRowEdits({});
  }, [devices, selectedDevice]);

  const { data: packages = [], isFetching: fetchingPkgs } = useQuery({
    queryKey: ["packages", selectedDevice],
    queryFn: () => selectedDevice ? listPackages(selectedDevice) : Promise.resolve([]),
    enabled: !!selectedDevice,
  });

  const { data: databases = [], isFetching: fetchingDbs } = useQuery({
    queryKey: ["databases", selectedDevice, selectedPackage],
    queryFn: () => selectedDevice && selectedPackage ? listDatabases(selectedDevice, selectedPackage) : Promise.resolve([]),
    enabled: !!selectedDevice && !!selectedPackage,
  });

  const { data: tables = [], isFetching: fetchingTables, isError: tablesError, error: tablesErrorDetails } = useQuery({
    queryKey: ["tables", selectedDevice, selectedPackage, selectedDb],
    queryFn: () => selectedDevice && selectedPackage && selectedDb ? listTables(selectedDevice, selectedPackage, selectedDb) : Promise.resolve([]),
    enabled: !!selectedDevice && !!selectedPackage && !!selectedDb,
    retry: false,
  });

  const { data: tableData, refetch: refetchTableData, isFetching: fetchingTable } = useQuery({
    queryKey: ["tableData", selectedDevice, selectedPackage, selectedDb, selectedTable, page, pageSize, sortInfo, filters],
    queryFn: () => {
      if (!selectedDevice || !selectedPackage || !selectedDb || !selectedTable) return Promise.resolve(null);
      return getTableData(selectedDevice, selectedPackage, selectedDb, selectedTable, page, pageSize, sortInfo || undefined, filters.length ? filters : undefined);
    },
    enabled: !!selectedDevice && !!selectedPackage && !!selectedDb && !!selectedTable,
    placeholderData: (previousData) => previousData,
  });

  const { data: tableSchema } = useQuery({
    queryKey: ["tableSchema", selectedDevice, selectedPackage, selectedDb, selectedTable],
    queryFn: () => {
      if (!selectedDevice || !selectedPackage || !selectedDb || !selectedTable) return Promise.resolve(null);
      return getTableSchema(selectedDevice, selectedPackage, selectedDb, selectedTable);
    },
    enabled: !!selectedDevice && !!selectedPackage && !!selectedDb && !!selectedTable,
  });

  const filteredPackages = packages.filter(p => 
    p.name.toLowerCase().includes(packageSearch.toLowerCase())
  );

  const pkColumn = tableSchema?.columns.find((c) => c.primary_key)?.name;

  const escapeSqlText = (value: unknown) => String(value).replace(/'/g, "''");

  const toSqlValue = (value: string) =>
    value === "NULL" || value === "" ? "NULL" : `'${escapeSqlText(value)}'`;

  const getRowKey = (row: Record<string, unknown>, rowIndex: number) => {
    if (!pkColumn) return `row:${rowIndex}`;
    return `pk:${String(row[pkColumn])}`;
  };

  const getPendingDisplayValue = (row: Record<string, unknown>, rowIndex: number, col: string) => {
    const rowKey = getRowKey(row, rowIndex);
    const pendingValue = pendingRowEdits[rowKey]?.changes[col];
    return pendingValue === undefined ? row[col] : pendingValue;
  };

  const pendingRowsCount = Object.keys(pendingRowEdits).length;
  const showInitialTableLoading = fetchingTable && (!tableData || tableData.rows.length === 0);

  const clearPendingChanges = (showFeedback = false) => {
    if (showFeedback && pendingRowsCount > 0) {
      toast.info("Alteracoes descartadas", {
        description: `${pendingRowsCount} linha(s) pendente(s) removida(s).`,
      });
    }
    setPendingRowEdits({});
    setEditingCell(null);
  };

  const handleSort = (column: string) => {
    setSortInfo(prev => ({
      column,
      direction: prev?.column === column && prev.direction === "ASC" ? "DESC" : "ASC",
    }));
  };

  const handleCellEdit = (row: number, col: string, value: unknown) => {
    const hasPrimaryKey = !!tableSchema?.columns.some((c) => c.primary_key);
    if (!hasPrimaryKey) {
      toast.warning("Tabela sem chave primaria", {
        description: "A edicao inline nao esta disponivel para esta tabela.",
      });
      return;
    }

    setEditingCell({ row, col });
    setEditValue(value === null ? "" : String(value));
  };

  const handleCellSave = () => {
    if (!editingCell || !tableData || !pkColumn) return;

    const rowData = tableData.rows[editingCell.row];
    if (!rowData) return;

    const rowKey = getRowKey(rowData, editingCell.row);
    const pkValue = rowData[pkColumn];

    if (pkValue === null || pkValue === undefined) {
      toast.error("Falha ao preparar alteracao", {
        description: "Chave primaria invalida para esta linha.",
      });
      return;
    }

    setPendingRowEdits((prev) => ({
      ...prev,
      [rowKey]: {
        pkValue,
        changes: {
          ...(prev[rowKey]?.changes || {}),
          [editingCell.col]: editValue,
        },
      },
    }));

    setEditingCell(null);
  };

  const handleCommitPendingChanges = async () => {
    if (!selectedDevice || !selectedPackage || !selectedDb || !selectedTable || !pkColumn) return;

    const entries = Object.entries(pendingRowEdits);
    if (entries.length === 0) {
      toast("Nenhuma alteracao pendente", {
        description: "Edite uma ou mais celulas antes de salvar.",
      });
      return;
    }

    setSavingPendingRows(true);

    const failed: Record<string, PendingRowEdit> = {};

    for (const [rowKey, rowEdit] of entries) {
      const assignments = Object.entries(rowEdit.changes)
        .map(([column, value]) => `"${column}" = ${toSqlValue(value)}`)
        .join(", ");

      if (!assignments) continue;

      const pkWhere = typeof rowEdit.pkValue === "number"
        ? String(rowEdit.pkValue)
        : `'${escapeSqlText(rowEdit.pkValue)}'`;

      const sql = `UPDATE "${selectedTable}" SET ${assignments} WHERE "${pkColumn}" = ${pkWhere}`;

      try {
        const result = await executeSql(selectedDevice, selectedPackage, selectedDb, sql);
        if (!result.success) {
          throw new Error(result.message || "Falha ao executar UPDATE");
        }
      } catch (error) {
        console.error("Commit row error:", error);
        failed[rowKey] = rowEdit;
      }
    }

    setPendingRowEdits(failed);
    setSavingPendingRows(false);

    if (Object.keys(failed).length > 0) {
      toast.error("Commit parcial", {
        description: `Falha ao salvar ${Object.keys(failed).length} linha(s).`,
      });
    } else {
      toast.success("Alteracoes salvas", {
        description: `${entries.length} linha(s) atualizada(s) com sucesso.`,
      });
    }

    void refetchTableData();
  };

  const handleAddRow = async () => {
    if (!selectedDevice || !selectedPackage || !selectedDb || !selectedTable) return;
    const cols = tableSchema?.columns.filter(c => !c.primary_key || c.col_type.toUpperCase() !== "INTEGER") || [];
    const values = cols.map(c => newRowData[c.name] === '' || newRowData[c.name] === undefined ? 'NULL' : `'${newRowData[c.name].replace(/'/g, "''")}'`).join(", ");
    const sql = `INSERT INTO "${selectedTable}" (${cols.map(c => `"${c.name}"`).join(", ")}) VALUES (${values})`;
    try {
      await executeSql(selectedDevice, selectedPackage, selectedDb, sql);
      setAddRowDialog(false);
      setNewRowData({});
      toast.success("Linha adicionada", {
        description: "A nova linha foi salva na tabela.",
      });
      refetchTableData();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao adicionar linha", {
        description: String(e),
      });
    }
  };

  const handleDeleteRow = async (rowIndex: number) => {
    if (!selectedDevice || !selectedPackage || !selectedDb || !selectedTable || !tableData) return;
    const pk = tableSchema?.columns.find(c => c.primary_key)?.name;
    if (!pk) {
      toast.warning("Tabela sem chave primaria", {
        description: "Nao foi possivel excluir: chave primaria nao encontrada.",
      });
      return;
    }
    const rowData = tableData.rows[rowIndex];
    const pkValue = rowData[pk];
    const sql = `DELETE FROM "${selectedTable}" WHERE "${pk}" = ${typeof pkValue === 'number' ? pkValue : `'${pkValue}'`}`;
    try {
      await executeSql(selectedDevice, selectedPackage, selectedDb, sql);
      const rowKey = getRowKey(rowData, rowIndex);
      setPendingRowEdits((prev) => {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });
      toast.success("Linha removida", {
        description: "A linha foi excluida com sucesso.",
      });
      refetchTableData();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao excluir linha", {
        description: String(e),
      });
    }
  };

  const [filterColumn, setFilterColumn] = useState<string>("");

  const applyFilter = () => {
    if (!filterInput.trim()) {
      setFilters([]);
      setPage(1);
      return;
    }
    const col = filterColumn || tableData?.columns[0] || "id";
    console.log("Applying filter:", col, filterInput);
    setFilters([{ column: col, value: filterInput }]);
    setPage(1);
  };

  const clearFilter = () => {
    setFilterInput("");
    setFilters([]);
    setFilterColumn("");
    setPage(1);
  };

  const selectDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    setSelectedPackage(null);
    setSelectedDb(null);
    setSelectedTable(null);
    clearPendingChanges();
    setExpandedDevices(prev => new Set(Array.from(prev).concat(deviceId)));
  };

  const selectPackage = (pkg: string) => {
    setSelectedPackage(pkg);
    setSelectedDb(null);
    setSelectedTable(null);
    clearPendingChanges();
    setExpandedPackages(prev => new Set(Array.from(prev).concat(pkg)));
  };

  const selectDb = (db: string) => {
    setSelectedDb(db);
    setSelectedTable(null);
    clearPendingChanges();
    setExpandedDbs(prev => new Set(Array.from(prev).concat(db)));
  };

  const selectTable = (table: string) => {
    setSelectedTable(table);
    setPage(1);
    setSortInfo(null);
    setFilters([]);
    setFilterInput("");
    clearPendingChanges();
  };

  const currentDevice = devices.find(d => d.id === selectedDevice);

  return (
    <div className="h-screen flex flex-col bg-surface font-body text-on-surface selection:bg-primary/20">
      {/* Sidebar - Tree Navigation */}
      <aside className="h-screen w-64 flex flex-col fixed left-0 top-0 bg-muted border-r border-border font-headline text-sm font-medium tracking-tight z-50 overflow-hidden">
        <div className="flex flex-col h-full py-6">
          {/* Brand */}
          <div className="px-6 mb-10">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="ADB Fly" className="w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tighter text-primary">{t.app.title}</h1>
            </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              {t.app.version} {currentDevice ? t.app.connected : t.app.disconnected}
            </p>
          </div>

          {/* Device List */}
          <div className="flex-1 overflow-y-auto px-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.sidebar.devices}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchDevices()}
                className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loadingDevices && "animate-spin")} />
              </Button>
            </div>

            {devices.length === 0 && !loadingDevices && (
              <p className="text-xs text-muted-foreground px-2 py-3">{t.sidebar.noDevices}</p>
            )}

            {devices.map(device => {
              const isExpanded = expandedDevices.has(device.id);
              const isSelected = selectedDevice === device.id;
              const devicePackages = isSelected ? packages : [];

              return (
                <div key={device.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedDevices(prev => {
                          const next = new Set(prev);
                          next.delete(device.id);
                          return next;
                        });
                      } else {
                        selectDevice(device.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isSelected 
                        ? "bg-primary/10 text-primary font-bold border-r-2 border-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                    <Smartphone className="w-5 h-5 shrink-0" />
                    <span className="truncate">{device.model}</span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 ml-auto",
                      device.status === "device" ? "bg-green-500" : "bg-muted-foreground/40"
                    )} />
                  </button>

                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                      {/* App Search */}
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          className="h-8 w-full pl-7 pr-2 py-1.5 bg-background rounded text-[11px] border border-border"
                          placeholder={t.sidebar.searchApps}
                          value={packageSearch}
                          onChange={(e) => setPackageSearch(e.target.value)}
                        />
                      </div>

                      {devicePackages.length === 0 && isSelected && (
                        <p className="text-[11px] text-muted-foreground py-2">{t.sidebar.loadingApps}</p>
                      )}

                      {filteredPackages.map(pkg => {
                        const isPkgExpanded = expandedPackages.has(pkg.name);
                        const isPkgSelected = selectedPackage === pkg.name;
                        const pkgDbs = isPkgSelected ? databases : [];

                        return (
                          <div key={pkg.name}>
                            <button
                              type="button"
                              onClick={() => {
                                if (isPkgExpanded) {
                                  setExpandedPackages(prev => {
                                    const next = new Set(prev);
                                    next.delete(pkg.name);
                                    return next;
                                  });
                                } else {
                                  selectPackage(pkg.name);
                                }
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                                isPkgSelected 
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              {isPkgExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate font-mono text-[11px]">{pkg.name}</span>
                            </button>

                            {isPkgExpanded && (
                              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                                {fetchingDbs && isPkgSelected && (
                                  <p className="text-[10px] text-muted-foreground py-1 flex items-center gap-1">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    Loading...
                                  </p>
                                )}
                                {!fetchingDbs && pkgDbs.length === 0 && isPkgSelected && (
                                  <p className="text-[10px] text-muted-foreground py-1">{t.sidebar.noDatabases}</p>
                                )}
                                {pkgDbs.map(db => {
                                  const isDbExpanded = expandedDbs.has(db.name);
                                  const isDbSelected = selectedDb === db.name;
                                  const dbTables = isDbSelected ? tables : [];

                                  return (
                                    <div key={db.name}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isDbExpanded) {
                                            setExpandedDbs(prev => {
                                              const next = new Set(prev);
                                              next.delete(db.name);
                                              return next;
                                            });
                                          } else {
                                            selectDb(db.name);
                                          }
                                        }}
                                        className={cn(
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                                          isDbSelected 
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                      >
                                        {isDbExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                                        <FolderOpen className="w-3.5 h-3.5 shrink-0 text-primary" />
                                        <span className="truncate font-mono text-[10px]">{db.name}</span>
                                      </button>

                                        {isDbExpanded && (
                                          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                                            {fetchingTables && isDbSelected && (
                                              <p className="text-[10px] text-muted-foreground py-1 flex items-center gap-1">
                                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                {t.table.loading}
                                              </p>
                                            )}
                                            {tablesError && isDbSelected && (
                                              <p className="text-[10px] text-destructive py-1" title={String(tablesErrorDetails)}>
                                                Falha ao carregar tabelas
                                              </p>
                                            )}
                                            {!fetchingTables && !tablesError && dbTables.length === 0 && isDbSelected && (
                                              <p className="text-[10px] text-muted-foreground py-1">{t.sidebar.noTables}</p>
                                            )}
                                          {dbTables.map(table => (
                                            <button
                                              type="button"
                                              key={table}
                                              onClick={() => selectTable(table)}
                                              className={cn(
                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                                                selectedTable === table
                                                  ? "bg-primary/10 text-primary font-medium"
                                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                              )}
                                            >
                                              <Table2 className="w-3.5 h-3.5 shrink-0" />
                                              <span className="truncate font-mono text-[10px]">{table}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="px-6 mt-auto pt-6 border-t border-border">
            <Button
              onClick={() => refetchDevices()}
              className="w-full py-2 px-4 text-xs font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", loadingDevices && "animate-spin")} />
              {t.sidebar.refreshAdb}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border">
          <div className="flex justify-between items-center w-full px-6 h-12">
            <div className="flex items-center gap-2 text-sm">
              {selectedDevice && (
                <>
                  <span className="text-muted-foreground">{currentDevice?.model}</span>
                  {selectedPackage && (
                    <>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{selectedPackage}</span>
                    </>
                  )}
                  {selectedDb && (
                    <>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">{selectedDb}</span>
                    </>
                  )}
                  {selectedTable && (
                    <>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-primary font-semibold">{selectedTable}</span>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LanguageDropdown
                value={locale}
                onChange={(val) => setLocale(val as "pt-BR" | "en" | "es")}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {!selectedTable && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h2 className="text-xl font-bold font-headline text-foreground mb-1">
                    {!selectedDevice ? t.main.noDevice : !selectedPackage ? t.main.selectApp : !selectedDb ? t.main.selectDatabase : t.main.selectTable}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                  {!selectedDevice ? t.main.connectDevice : t.main.navigateTree}
                </p>
              </div>
            </div>
          )}

          {selectedTable && tableData && (
            <div>
              {/* Toolbar */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-2">
                  <Search className="ml-1 text-muted-foreground w-4 h-4 shrink-0" />
                  <Select value={filterColumn || "__all__"} onValueChange={(value) => setFilterColumn(value === "__all__" ? "" : value)}>
                    <SelectTrigger className="h-8 w-[170px] border-0 bg-transparent text-xs font-mono focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder={t.toolbar.allColumns} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{t.toolbar.allColumns}</SelectItem>
                      {tableData?.columns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 w-[280px] border-0 bg-transparent text-sm font-mono focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    placeholder={t.toolbar.filterPlaceholder}
                    value={filterInput}
                    onChange={(e) => setFilterInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                  />
                  <Button size="sm" variant="secondary" onClick={applyFilter} className="h-8 text-[10px] uppercase tracking-wide">
                    {t.toolbar.apply}
                  </Button>
                  {filters.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setFilters([]); setFilterInput(""); setPage(1); }}
                      className="h-8 text-[10px]"
                    >
                      {t.toolbar.clear}
                    </Button>
                  )}
                </div>
                <Button onClick={() => setAddRowDialog(true)} className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {t.toolbar.addRow}
                </Button>
                {pendingRowsCount > 0 && (
                  <>
                    <Button
                      variant="default"
                      onClick={handleCommitPendingChanges}
                      disabled={savingPendingRows}
                      className="shrink-0 flex items-center gap-1.5"
                    >
                      {savingPendingRows ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Salvar alteracoes ({pendingRowsCount})
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => clearPendingChanges(true)}
                      disabled={savingPendingRows}
                      className="shrink-0 flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Descartar
                    </Button>
                  </>
                )}
                {fetchingTable && !showInitialTableLoading && (
                  <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Atualizando dados...
                  </span>
                )}
              </div>

              {/* Data Table */}
              <div className="bg-card rounded-xl shadow-card overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-accent">
                        {tableData.columns.map(col => (
                          <th 
                            key={col}
                            className="px-4 py-3 cursor-pointer hover:bg-accent/80 border-r border-b border-border"
                            onClick={() => handleSort(col)}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                              {col}
                              {sortInfo?.column === col && (
                                <span className="text-primary">{sortInfo.direction === "ASC" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 w-16 border-b border-border">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-foreground"></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {showInitialTableLoading ? (
                        <tr>
                          <td colSpan={tableData.columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
                            {t.table.loading}
                          </td>
                        </tr>
                      ) : tableData.rows.length > 0 ? (
                        tableData.rows.map((row, rowIdx) => {
                          const rowKey = getRowKey(row, rowIdx);
                          const rowHasPendingChanges = !!pendingRowEdits[rowKey];

                          return (
                          <tr
                            key={rowKey}
                            className={cn(
                              "hover:bg-accent/50 group",
                              rowHasPendingChanges && "bg-amber-50 dark:bg-amber-950/20"
                            )}
                          >
                            {tableData.columns.map((col, colIdx) => (
                              <td 
                                key={col}
                                className={cn(
                                  "px-4 py-2 border-r border-b border-border",
                                  colIdx === 0 && "bg-accent/30 font-semibold text-foreground"
                                )}
                                onDoubleClick={() => handleCellEdit(rowIdx, col, getPendingDisplayValue(row, rowIdx, col))}
                              >
                                {editingCell?.row === rowIdx && editingCell?.col === col ? (
                                  <div className="flex items-center border-2 border-primary rounded-lg bg-surface shadow-lg shadow-primary/10 p-0.5">
                                    <input 
                                      type="text"
                                      className="flex-1 border-none focus:ring-0 focus:outline-none text-sm font-mono py-1 px-2 text-primary font-semibold bg-transparent"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCellSave();
                                        if (e.key === "Escape") setEditingCell(null);
                                      }}
                                      autoFocus
                                    />
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCellSave(); }}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setEditingCell(null); }}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className={cn(
                                    "text-sm font-mono",
                                    getPendingDisplayValue(row, rowIdx, col) === null
                                      ? "text-muted-foreground italic"
                                      : "text-foreground",
                                    pendingRowEdits[rowKey]?.changes[col] !== undefined && "text-amber-600 dark:text-amber-400"
                                  )}>
                                    {getValueLabel(getPendingDisplayValue(row, rowIdx, col))}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-2">
                              <button 
                                type="button"
                                onClick={() => handleDeleteRow(rowIdx)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={tableData.columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                            {t.table.noData}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {tableData && tableData.rows.length > 0 && (
                  <div className="px-4 py-3 bg-accent/30 flex justify-between items-center border-t border-border">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, tableData.total_rows)} {t.table.of} {tableData.total_rows.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
                        <SelectTrigger className="h-8 w-[84px] text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="h-8 px-2 text-xs"
                      >
                        {t.table.prev}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!tableData || page >= Math.ceil(tableData.total_rows / pageSize)}
                        className="h-8 px-2 text-xs"
                      >
                        {t.table.next}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Row Dialog */}
      <Dialog open={addRowDialog} onOpenChange={setAddRowDialog}>
        <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-headline text-on-surface">{t.dialog.addNewRow}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
            {tableSchema?.columns.filter(c => !c.primary_key || c.col_type.toUpperCase() !== "INTEGER").map(col => (
              <div key={col.name} className="grid gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{col.name}</label>
                <Input
                  type={col.col_type.toUpperCase().includes("INT") ? "number" : "text"}
                  className="h-9"
                  placeholder={col.name}
                  value={newRowData[col.name] || ""}
                  onChange={(e) => setNewRowData(d => ({ ...d, [col.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRowDialog(false)}>
              {t.dialog.cancel}
            </Button>
            <Button onClick={handleAddRow}>
              {t.dialog.addRow}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </QueryClientProvider>
  );
}
