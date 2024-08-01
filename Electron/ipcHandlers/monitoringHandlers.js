const { ipcMain } = require("electron");
const { getStaticCPUData, getDynamicCPUData } = require("../dataMiners/cpu.js");
const { getSystemInfo } = require("../dataMiners/system.js");
const {
  getDynamicNetworkData,
  getISPData,
} = require("../dataMiners/network.js");
const { getStaticRAMData, getDynamicRAMData } = require("../dataMiners/ram.js");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const si = require("systeminformation");
const { powerMonitor } = require("electron");
const { Battery } = require("../dataMiners/battery.js");
const { handleTraceData } = require("../dataMiners/trace.js");

const db = new sqlite3.Database("system_data.db", (err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database");
  }
});

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
  db.run(`
    CREATE TABLE IF NOT EXISTS battery_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batteryPercentage REAL,
      batteryStatus TEXT,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS trace_results (
      sno INTEGER PRIMARY KEY AUTOINCREMENT,
      json_data TEXT,
      timestamp TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS isp_data (
      sno INTEGER PRIMARY KEY AUTOINCREMENT,
      vpn TEXT,
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

const insertTraceData = (jsonData) => {
  const timestamp = new Date().toISOString();

  db.run(
    `INSERT INTO trace_results (json_data, timestamp) VALUES (?, ?)`,
    [jsonData, timestamp],
    function (err) {
      if (err) {
        console.error("Error inserting trace result:", err.message);
      } else {
        console.log("Trace result inserted successfully");
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

const handleIspData = async () => {
  try {
    const vpn = await getISPData();
    insertData("isp_data", vpn);
  } catch (error) {
    console.error("Failed to handle ISP data:", error);
  }
};

const handleBatteryData = async () => {
  try {
    const battery = await Battery();
    insertData("battery_data", battery);
  } catch (error) {
    console.error("Failed to handle battery data:", error);
  }
};

// Schedule the trace data collection every 90 minutes
const handleTraceDataSchedule = async () => {
  console.log("#######################################################");
  const result = await handleTraceData();
  if (result) {
    const jsonData = JSON.stringify(result);
    console.log("Trace data:", jsonData);
    insertTraceData(jsonData);
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
    "battery_data",
    "trace_results",
    "isp_data",
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
  let batteryDataInterval;
  let traceDataInterval;
  let ispDataInterval;

  ipcMain.on("start-monitoring", async () => {
    console.log("Start monitoring data:");

    if (!dynamicDataInterval) {
      dynamicDataInterval = setInterval(async () => {
        await handleDynamicData();
      }, 15000); // 15 seconds
    }

    await handleStaticData();
    await handleIspData();
    await handleTraceDataSchedule();

    if (!staticDataInterval) {
      staticDataInterval = setInterval(async () => {
        await handleStaticData();
      }, 60 * 60 * 1000); // 60 minutes
    }

    if (!batteryDataInterval) {
      batteryDataInterval = setInterval(async () => {
        await handleBatteryData();
      }, 5 * 1000); // 5 seconds
    }

    if (!traceDataInterval) {
      traceDataInterval = setInterval(async () => {
        await handleTraceDataSchedule();
      }, 60 * 1000 * 60); // 1 Hour
    }

    if (!ispDataInterval) {
      ispDataInterval = setInterval(async () => {
        await handleIspData();
      }, 15 * 1000 * 60); // 10 minutes
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

    if (batteryDataInterval) {
      clearInterval(batteryDataInterval);
      batteryDataInterval = null;
    }

    if (traceDataInterval) {
      clearInterval(traceDataInterval);
      traceDataInterval = null;
    }

    if (ispDataInterval) {
      clearInterval(ispDataInterval);
      ispDataInterval = null;
    }
  });
};

module.exports = { monitorIPC };
