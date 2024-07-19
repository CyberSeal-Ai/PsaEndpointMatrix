const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { DateTime } = require("luxon");
const { get } = require("http");

const dbPath = path.join(__dirname, "system_data.db");
const db = new sqlite3.Database(dbPath);

async function getStaticCPUDetails() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM static_cpu ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const cpuDetails = {
      Model: mostRecentEntry.model,
      ManufacturerCPU: mostRecentEntry.manufacturer,
      Brand: mostRecentEntry.brand,
      CPUModel: mostRecentEntry.model,
      Speed: mostRecentEntry.speed,
      Cores: mostRecentEntry.cores,
      PhysicalCores: mostRecentEntry.physicalCores,
      ProcessorsCount: mostRecentEntry.processors,
    };

    return cpuDetails;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getCurrentLoadData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_cpu ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          AVG(currentLoad) AS currentLoad
        FROM dynamic_cpu
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const currentLoadData = results.map((result) => ({
      CurrentLoad: result.currentLoad.toFixed(2),
      Timestamp: result.bucketKey,
    }));

    return currentLoadData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getMemoryUsageData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_ram ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          AVG(total) AS totalMemory,
          AVG(used) AS usedMemory,
          AVG(free) AS freeMemory
        FROM dynamic_ram
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const memoryUsageData = results.map((result) => ({
      TotalUsed: (result.totalMemory / (1024 * 1024 * 1024)).toFixed(2),
      FreeSpace: (result.freeMemory / (1024 * 1024 * 1024)).toFixed(2),
      UsedSpace: (result.usedMemory / (1024 * 1024 * 1024)).toFixed(2),
      Timestamp: result.bucketKey,
    }));

    return memoryUsageData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getNetworkTrafficData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_network ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          SUM(tx_bytes) AS txBytes,
          SUM(rx_bytes) AS rxBytes
        FROM dynamic_network
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const trafficData = results.map((result) => ({
      TxBytes: result.txBytes,
      RxBytes: result.rxBytes,
      Timestamp: result.bucketKey,
    }));

    return trafficData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getDownloadSpeedData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_network ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:00:00', timestamp) AS hourlyBucket,
          AVG(downloadSpeed) / 12500 AS averageDownloadSpeed
        FROM dynamic_network
        WHERE timestamp >= ?
        GROUP BY hourlyBucket
        ORDER BY hourlyBucket
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const downloadSpeedData = results.map((result) => ({
      AverageDownloadSpeed: result.averageDownloadSpeed.toFixed(2),
      Timestamp: result.hourlyBucket,
    }));

    return downloadSpeedData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getPacketLossPercentageData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_network ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          AVG(packetLossPercentage) AS packetLossPercentage
        FROM dynamic_network
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const packetLossData = results.map((result) => ({
      PacketLossPercentage: result.packetLossPercentage.toFixed(2),
      Timestamp: result.bucketKey,
    }));

    return packetLossData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getJitterData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_network ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          AVG(jitter) AS jitter
        FROM dynamic_network
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const jitterData = results.map((result) => ({
      Jitter: result.jitter.toFixed(2),
      Timestamp: result.bucketKey,
    }));

    return jitterData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getLatencyData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM dynamic_network ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const mostRecentTimestamp = DateTime.fromISO(mostRecentEntry.timestamp);
    const twelveHoursBeforeMostRecent = mostRecentTimestamp.minus({
      hours: 12,
    });

    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          AVG(inetLatency) AS latency
        FROM dynamic_network
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursBeforeMostRecent.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    const latencyData = results.map((result) => ({
      Latency: result.latency.toFixed(2),
      Timestamp: result.bucketKey,
    }));

    return latencyData;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getSystemInfo() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT macs, osInfo, uuid, virtual FROM system_info ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const osInfoParsed = JSON.parse(mostRecentEntry.osInfo);
    const systemInfo = {
      macs: mostRecentEntry.macs,
      platform: osInfoParsed.platform,
      architecture: osInfoParsed.arch,
      hostName: osInfoParsed.hostname,
      release: osInfoParsed.release,
      uuid: mostRecentEntry.uuid,
      virtual: mostRecentEntry.virtual,
    };

    return systemInfo;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function getStaticRAMData() {
  try {
    const mostRecentEntry = await new Promise((resolve, reject) => {
      db.get(
        `SELECT size, type, clockSpeed, manufacturer FROM static_ram ORDER BY timestamp DESC LIMIT 1`,
        [],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    const ramInfo = {
      size: mostRecentEntry.size,
      type: mostRecentEntry.type,
      clockSpeed: mostRecentEntry.clockSpeed,
      manufacturer: mostRecentEntry.manufacturer,
    };

    return ramInfo;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function queryDatabase(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

async function getUniqueInterfacesAndMostRecent() {
  try {
    const results = await queryDatabase(
      `SELECT Interfaces, timestamp FROM dynamic_network`
    );

    const interfacesMap = new Map();

    results.forEach((row) => {
      let interfaces;
      try {
        interfaces = JSON.parse(row.Interfaces);
      } catch (err) {
        console.error(`Failed to parse JSON: ${row.interfaces}`);
        return;
      }

      const ifaceName = interfaces.ifaceName;

      if (!interfacesMap.has(ifaceName)) {
        interfacesMap.set(ifaceName, {
          iface: interfaces.iface,
          ifaceName: interfaces.ifaceName,
          IP4: interfaces.IP4,
          IP6: interfaces.IP6,
          dnsSuffix: interfaces.dnsSuffix,
          MacAddress: interfaces.macAddress,
          mostRecentTimestamp: DateTime.fromISO(row.timestamp),
        });
      } else {
        const existingEntry = interfacesMap.get(ifaceName);
        const currentTimestamp = DateTime.fromISO(row.timestamp);

        if (currentTimestamp > existingEntry.mostRecentTimestamp) {
          existingEntry.mostRecentTimestamp = currentTimestamp;
          existingEntry.IP4 = interfaces.IP4;
          existingEntry.IP6 = interfaces.IP6;
          existingEntry.dnsSuffix = interfaces.dnsSuffix;
          existingEntry.MacAddress = interfaces.macAddress;
        }
      }
    });

    const uniqueInterfaces = Array.from(interfacesMap.values());

    let mostRecentInterface = null;

    if (uniqueInterfaces.length > 0) {
      mostRecentInterface = uniqueInterfaces.reduce((mostRecent, iface) => {
        return iface.mostRecentTimestamp > mostRecent.mostRecentTimestamp
          ? iface
          : mostRecent;
      });
    }

    return { uniqueInterfaces, mostRecentInterface };
  } catch (error) {
    console.error(
      "An error occurred while extracting unique interfaces and the most recent one:",
      error
    );
    return null;
  }
}

(async () => {
  try {
    const { uniqueInterfaces, mostRecentInterface } =
      await getUniqueInterfacesAndMostRecent();
    console.log("Unique Interfaces:", uniqueInterfaces);
    console.log("Most Recent Interface:", mostRecentInterface);
  } catch (error) {
    console.error("An error occurred in the main execution:", error);
  }
})();

(async () => {
  const { uniqueInterfaces, mostRecentInterface } =
    await getUniqueInterfacesAndMostRecent();
  console.log("Unique Interfaces:", uniqueInterfaces);
  console.log("Most Recent Interface:", mostRecentInterface);
})();

async function getAllData() {
  try {
    const [
      staticCPUDetails,
      currentLoadData,
      memoryUsageData,
      networkTrafficData,
      downloadSpeedData,
      packetLossPercentageData,
      jitterData,
      latencyData,
      systemInfo,
      staticRAMData,
      InterfaceData,
    ] = await Promise.all([
      getStaticCPUDetails(),
      getCurrentLoadData(),
      getMemoryUsageData(),
      getNetworkTrafficData(),
      getDownloadSpeedData(),
      getPacketLossPercentageData(),
      getJitterData(),
      getLatencyData(),
      getSystemInfo(),
      getStaticRAMData(),
      getUniqueInterfacesAndMostRecent(),
    ]);

    const accumulatedData = {
      staticCPUDetails,
      currentLoadData,
      memoryUsageData,
      networkTrafficData,
      downloadSpeedData,
      packetLossPercentageData,
      jitterData,
      latencyData,
      systemInfo,
      staticRAMData,
      InterfaceData,
    };

    return accumulatedData;
  } catch (error) {
    console.error("An error occurred while getting all data:", error);
    return null;
  }
}

module.exports = { getAllData };
