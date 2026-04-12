const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function parseIni(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

function findConfigFile() {
  const candidates = [];

  if (process.env.ADBFLY_CONFIG_PATH) {
    candidates.push(process.env.ADBFLY_CONFIG_PATH);
  }

  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, "com.adbfly.app", "adbfly.ini"));
  }

  candidates.push(path.join(process.cwd(), "adbfly.ini"));

  return candidates.find((file) => fs.existsSync(file));
}

function loadOpenSslFromIni() {
  const configFile = findConfigFile();
  if (!configFile) return { configFile: null, values: {} };

  const content = fs.readFileSync(configFile, "utf8");
  const values = parseIni(content);
  return { configFile, values };
}

function run() {
  const commandArgs = process.argv.slice(2);
  const tauriArgs = commandArgs.length > 0 ? commandArgs : ["dev"];

  const env = { ...process.env };
  const { configFile, values } = loadOpenSslFromIni();

  if (!env.OPENSSL_DIR && values.openssl_dir) env.OPENSSL_DIR = values.openssl_dir;
  if (!env.OPENSSL_LIB_DIR && values.openssl_lib_dir) env.OPENSSL_LIB_DIR = values.openssl_lib_dir;
  if (!env.OPENSSL_INCLUDE_DIR && values.openssl_include_dir) env.OPENSSL_INCLUDE_DIR = values.openssl_include_dir;

  const shouldEnableSqlcipher = Boolean(env.OPENSSL_DIR);
  if (shouldEnableSqlcipher) {
    if (configFile) {
      console.log(`Using OpenSSL config from: ${configFile}`);
    } else {
      console.log("Using OpenSSL config from environment variables.");
    }
  } else {
    console.log("OPENSSL_DIR not configured. Starting without SQLCipher support (SQLite fallback).");
    console.log("To enable SQLCipher, configure OpenSSL in app settings or adbfly.ini.");
  }

  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const fullArgs = ["tauri", ...tauriArgs];
  if (shouldEnableSqlcipher) {
    fullArgs.push("--features", "sqlcipher");
  }

  const child = spawn(npxCmd, fullArgs, {
    stdio: "inherit",
    env,
    cwd: process.cwd(),
  });

  child.on("exit", (code) => process.exit(code ?? 1));
}

run();
