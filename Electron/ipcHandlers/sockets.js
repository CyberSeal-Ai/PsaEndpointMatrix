const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { DateTime } = require("luxon");
const { get } = require("http");
const fs = require("fs");

const db = new sqlite3.Database("system_data.db", (err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database");
  }
});

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

async function getBatteryData() {
  try {
    // Get the current time and the time 12 hours ago
    const now = DateTime.now();
    const twelveHoursAgo = now.minus({ hours: 12 });

    // Fetch data from the past 12 hours
    const results = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%dT%H:%M:00', timestamp) AS bucketKey,
          AVG(batteryPercentage) AS averageBatteryPercentage,
          MAX(batteryStatus) AS batteryStatus
        FROM battery_data
        WHERE timestamp >= ?
        GROUP BY strftime('%Y-%m-%dT%H', timestamp), (strftime('%M', timestamp) / 10)
        ORDER BY bucketKey
      `;
      db.all(query, [twelveHoursAgo.toISO()], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });

    // Map the results to the desired output format
    const batteryData = results.map((result) => ({
      AverageBatteryPercentage: parseFloat(
        result.averageBatteryPercentage
      ).toFixed(2),
      Timestamp: result.bucketKey,
      BatteryStatus: result.batteryStatus,
    }));

    console.log(batteryData);
    console.log("Battery Data");
    return batteryData;
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
        console.error(`Failed to parse JSON: ${row.Interfaces}`);
        return;
      }

      const ifaceName = interfaces.ifaceName;

      if (!interfacesMap.has(ifaceName)) {
        interfacesMap.set(ifaceName, {
          iface: interfaces.iface,
          ifaceName: interfaces.ifaceName,
          default: interfaces.default,
          ip4: interfaces.ip4,
          ip4subnet: interfaces.ip4subnet,
          ip6: interfaces.ip6,
          ip6subnet: interfaces.ip6subnet,
          mac: interfaces.mac,
          internal: interfaces.internal,
          virtual: interfaces.virtual,
          operstate: interfaces.operstate,
          type: interfaces.type,
          duplex: interfaces.duplex,
          mtu: interfaces.mtu,
          speed: interfaces.speed,
          dhcp: interfaces.dhcp,
          dnsSuffix: interfaces.dnsSuffix,
          ieee8021xAuth: interfaces.ieee8021xAuth,
          ieee8021xState: interfaces.ieee8021xState,
          carrierChanges: interfaces.carrierChanges,
          mostRecentTimestamp: DateTime.fromISO(row.timestamp),
        });
      } else {
        const existingEntry = interfacesMap.get(ifaceName);
        const currentTimestamp = DateTime.fromISO(row.timestamp);

        if (currentTimestamp > existingEntry.mostRecentTimestamp) {
          existingEntry.mostRecentTimestamp = currentTimestamp;
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

async function getUniqueNetworkInfoAndMostRecent() {
  try {
    const results = await queryDatabase(`SELECT vpn, timestamp FROM isp_data`);

    const networkInfoMap = new Map();

    results.forEach((row) => {
      let networkInfo;
      try {
        networkInfo = JSON.parse(row.vpn);
      } catch (err) {
        console.error(`Failed to parse JSON: ${row.vpn}`);
        return;
      }

      const ip = networkInfo.ip;

      if (!networkInfoMap.has(ip)) {
        networkInfoMap.set(ip, {
          ip: networkInfo.ip,
          security: {
            vpn: networkInfo.security.vpn,
            proxy: networkInfo.security.proxy,
            tor: networkInfo.security.tor,
            relay: networkInfo.security.relay,
          },
          location: {
            city: networkInfo.location.city,
            region: networkInfo.location.region,
            country: networkInfo.location.country,
            continent: networkInfo.location.continent,
            region_code: networkInfo.location.region_code,
            country_code: networkInfo.location.country_code,
            continent_code: networkInfo.location.continent_code,
            latitude: networkInfo.location.latitude,
            longitude: networkInfo.location.longitude,
            time_zone: networkInfo.location.time_zone,
            locale_code: networkInfo.location.locale_code,
            metro_code: networkInfo.location.metro_code,
            is_in_european_union: networkInfo.location.is_in_european_union,
          },
          network: {
            network: networkInfo.network.network,
            autonomous_system_number:
              networkInfo.network.autonomous_system_number,
            autonomous_system_organization:
              networkInfo.network.autonomous_system_organization,
          },
          mostRecentTimestamp: DateTime.fromISO(row.timestamp),
        });
      } else {
        const existingEntry = networkInfoMap.get(ip);
        const currentTimestamp = DateTime.fromISO(row.timestamp);

        if (currentTimestamp > existingEntry.mostRecentTimestamp) {
          existingEntry.mostRecentTimestamp = currentTimestamp;
        }
      }
    });

    const uniqueNetworkInfo = Array.from(networkInfoMap.values());

    let mostRecentNetworkInfo = null;

    if (uniqueNetworkInfo.length > 0) {
      mostRecentNetworkInfo = uniqueNetworkInfo.reduce((mostRecent, info) => {
        return info.mostRecentTimestamp > mostRecent.mostRecentTimestamp
          ? info
          : mostRecent;
      });
    }

    return { uniqueNetworkInfo, mostRecentNetworkInfo };
  } catch (error) {
    console.error(
      "An error occurred while extracting unique network info and the most recent one:",
      error
    );
    return null;
  }
}

async function getMostRecentTraceData() {
  try {
    const results = await queryDatabase(
      `SELECT json_data, timestamp FROM trace_results ORDER BY timestamp DESC LIMIT 1`
    );

    if (results.length === 0) {
      return null;
    }

    let traceData;
    try {
      traceData = JSON.parse(results[0].json_data);
    } catch (err) {
      console.error(`Failed to parse JSON: ${results[0].json_data}`);
      return null;
    }

    return traceData;
  } catch (error) {
    console.error(
      "An error occurred while extracting the most recent trace data:",
      error
    );
    return null;
  }
}

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
      ISPData,
      BatteryData,
      TraceData,
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
      getUniqueNetworkInfoAndMostRecent(),
      getBatteryData(),
      getMostRecentTraceData(),
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
      ISPData,
      BatteryData,
      TraceData,
    };

    return accumulatedData;
  } catch (error) {
    console.error("An error occurred while getting all data:", error);
    return null;
  }
}

getAllData().then((data) => {
  //store it in a output.json file

  fs.writeFileSync("output.json", JSON.stringify(data, null, 2));
  console.log("Data stored in output.json");
});

module.exports = { getAllData };
