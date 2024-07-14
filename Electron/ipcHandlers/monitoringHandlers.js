const { ipcMain } = require("electron");
const { getStaticCPUData, getDynamicCPUData } = require("../dataMiners/cpu.js");
const { getSystemInfo } = require("../dataMiners/system.js");
const { getDynamicNetworkData } = require("../dataMiners/network.js");
const { getStaticRAMData, getDynamicRAMData } = require("../dataMiners/ram.js");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Initialize SQLite database
const dbPath = path.join(__dirname, "system_data.db");
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS static_cpu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manufacturer TEXT,
      brand TEXT,
      vendor TEXT,
      family TEXT,
      model TEXT,
      speed TEXT,
      speedMin TEXT,
      speedMax TEXT,
      cores INTEGER,
      physicalCores INTEGER,
      processors INTEGER,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS dynamic_cpu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      avgLoad REAL,
      uuid TEXT,
      currentLoad REAL,
      currentLoadUser REAL,
      currentLoadSystem REAL,
      currentLoadNice REAL,
      currentLoadIdle REAL,
      currentLoadIrq REAL,
      totalProcesses INTEGER,
      cpuTemperature REAL,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS system_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manufacturer TEXT,
      model TEXT,
      version TEXT,
      serial TEXT,
      uuid TEXT,
      sku TEXT,
      virtual TEXT,
      os TEXT,
      hardware TEXT,
      macs TEXT,
      osInfo TEXT,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS static_ram (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      size INTEGER,
      bank TEXT,
      type TEXT,
      ecc TEXT,
      clockSpeed INTEGER,
      formFactor TEXT,
      manufacturer TEXT,
      partNum TEXT,
      serialNum TEXT,
      voltageConfigured REAL,
      voltageMin REAL,
      voltageMax REAL,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS dynamic_ram (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total INTEGER,
      free INTEGER,
      used INTEGER,
      active INTEGER,
      uuid TEXT,
      available INTEGER,
      buffers INTEGER,
      cached INTEGER,
      slab INTEGER,
      buffcache INTEGER,
      swaptotal INTEGER,
      swapused INTEGER,
      swapfree INTEGER,
      writeback INTEGER,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS dynamic_network (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Interfaces TEXT,
      inetLatency REAL,
      uuid TEXT,
      iface TEXT,
      rx_bytes INTEGER,
      rx_dropped INTEGER,
      rx_errors INTEGER,
      tx_bytes INTEGER,
      tx_dropped INTEGER,
      tx_errors INTEGER,
      jitter REAL,
      downloadSpeed REAL,
      packetLossPercentage REAL,
      timestamp TEXT
    )
  `);
});

const insertData = (table, data) => {
  const timestamp = new Date().toISOString();
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = Object.values(data).map((value) =>
    typeof value === "object" ? JSON.stringify(value) : value
  );

  db.run(
    `INSERT INTO ${table} (${columns}, timestamp) VALUES (${placeholders}, ?)`,
    [...values, timestamp],
    function (err) {
      if (err) {
        return console.error(
          `Error inserting data into ${table}:`,
          err.message
        );
      }
    }
  );
};

const handleStaticData = async () => {
  try {
    const staticCPUData = await getStaticCPUData();
    insertData("static_cpu", staticCPUData);

    const systemInfo = await getSystemInfo();
    insertData("system_info", systemInfo);

    const staticRAMData = await getStaticRAMData();
    insertData("static_ram", staticRAMData);

    // console.log("Static data saved successfully.");
  } catch (error) {
    console.error("Failed to handle static data:", error);
  }
};

const handleDynamicData = async () => {
  try {
    const dynamicCPUData = await getDynamicCPUData();
    insertData("dynamic_cpu", dynamicCPUData);

    const dynamicRAMData = await getDynamicRAMData();
    insertData("dynamic_ram", dynamicRAMData);

    const dynamicNetworkData = await getDynamicNetworkData();
    insertData("dynamic_network", dynamicNetworkData);
  } catch (error) {
    console.error("Failed to handle dynamic data:", error);
  }
};

const displayCollections = () => {
  const tables = [
    "static_cpu",
    "dynamic_cpu",
    "system_info",
    "static_ram",
    "dynamic_ram",
    "dynamic_network",
  ];

  tables.forEach((table) => {
    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
      if (err) {
        throw err;
      }
      console.log(`Data from ${table}:`);
      rows.forEach((row) => {
        console.log(row);
      });
    });
  });
};

const monitorIPC = () => {
  let dynamicDataInterval;
  let staticDataInterval;

  ipcMain.on("start-monitoring", async () => {
    console.log("Start monitoring data:");

    if (!dynamicDataInterval) {
      dynamicDataInterval = setInterval(async () => {
        await handleDynamicData();
      }, 15000);
    }

    await handleStaticData();

    if (!staticDataInterval) {
      staticDataInterval = setInterval(async () => {
        await handleStaticData();
      }, 10 * 60 * 1000);
    }
  });

  ipcMain.on("stop-monitoring", () => {
    if (dynamicDataInterval) {
      clearInterval(dynamicDataInterval);
      dynamicDataInterval = null;
    }

    if (staticDataInterval) {
      clearInterval(staticDataInterval);
      staticDataInterval = null;
    }
  });
};

module.exports = { monitorIPC };
