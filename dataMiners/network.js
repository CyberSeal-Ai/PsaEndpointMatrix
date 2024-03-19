// const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const si = require("systeminformation");
const ping = require("ping");

// require("dotenv").config({ path: "../.env" });

// const token =
//   "6KozKP130beZY366OUum4YM7Hxm4HTQ2lvZHEsHHND3foo84PG8zTmlniqgzaezMyufT6RGTtPcRBpaA9OIiOQ==";
// const url = "http://localhost:8086";
// const org = "CYBERSEAL";
// const bucket = "NETWORK_LOGS";

// const influx = new InfluxDB({
//   url,
//   token,
// });

// const writeClient = influx.getWriteApi(org, bucket, "ns");


async function calculatePacketLoss() {
  const host = "8.8.8.8";
  const numPings = 10;
  let lostPackets = 0;

  for (let i = 0; i < numPings; i++) {
    const res = await ping.promise.probe(host, { timeout: 2 });
    if (!res.alive) lostPackets++;
  }

  const packetLossPercent = (lostPackets / numPings) * 100;
  return packetLossPercent;
}

async function calculateJitterAndLatency() {
  let previousPing = 0;
  let jitterValues = [];
  let latencyValues = [];
  const host = "8.8.8.8"; // Example host for ping
  const numPings = 10;

  for (let i = 0; i < numPings; i++) {
    const res = await ping.promise.probe(host);
    const currentPing = res.time;
    latencyValues.push(currentPing);

    if (previousPing !== 0) {
      const jitter = Math.abs(currentPing - previousPing);
      jitterValues.push(jitter);
    }
    previousPing = currentPing;
  }

  const jitterSum = jitterValues.reduce((a, b) => a + b, 0);
  const jitterAverage =
    jitterValues.length > 0 ? jitterSum / jitterValues.length : 0;

  const latencySum = latencyValues.reduce((a, b) => a + b, 0);
  const latencyAverage =
    latencyValues.length > 0 ? latencySum / latencyValues.length : 0;

  // console.log("Jitter:", jitterAverage);
  // console.log("Latency:", latencyAverage);

  return { jitter: jitterAverage || 0, latency: latencyAverage || 0 };
}

async function getDynamicNetworkData() {
  try {
    const inetLatency = await si.inetLatency();
    const Interfaces = await si.networkInterfaces("default");
    const systemInfo = await si.system();
    const uuid = systemInfo.uuid;
    // si.networkInterfaces("default").then((data) => console.log(data));
    const networkStats = await si.networkStats();
    const pingResult = await ping.promise.probe("8.8.8.8"); // Replace with your target IP address or hostname
    // const downloadSpeed = await speedTest.();
    const jitterAndLatency = await calculateJitterAndLatency();
    const packetLoss = (pingResult.packetLoss * 100) / pingResult.sent;
    const packetLossPercentage = await calculatePacketLoss();

    return {
      Interfaces: Interfaces,
      inetLatency: inetLatency,
      uuid: uuid,
      iface: networkStats[0].iface,
      rx_bytes: networkStats[0].rx_bytes || 0,
      rx_dropped: networkStats[0].rx_dropped || 0,
      rx_errors: networkStats[0].rx_errors || 0,
      tx_bytes: networkStats[0].tx_bytes || 0,
      tx_dropped: networkStats[0].tx_dropped || 0,
      tx_errors: networkStats[0].tx_errors || 0,
      jitter: jitterAndLatency.jitter,
      downloadSpeed: networkStats[0].rx_sec || 0,
      packetLossPercentage: packetLossPercentage || 0,
    };
  } catch (error) {
    console.error("Error collecting dynamic network data:", error);
    return null;
  }
}

// function logDynamicNetworkData(dynamicData) {
//   if (dynamicData === null) {
//     console.error("Dynamic network data is null");
//     return;
//   }

//   const networkDataPoint = new Point("network_data")
//     .tag("iface", dynamicData.iface || "unknown")
//     .floatField("rx_bytes", dynamicData.rx_bytes || 0)
//     .floatField("rx_dropped", dynamicData.rx_dropped || 0)
//     .floatField("rx_errors", dynamicData.rx_errors || 0)
//     .floatField("tx_bytes", dynamicData.tx_bytes || 0)
//     .floatField("tx_dropped", dynamicData.tx_dropped || 0)
//     .floatField("tx_errors", dynamicData.tx_errors || 0)
//     .floatField("inetLatency", dynamicData.inetLatency || 0)
//     .floatField("jitter", dynamicData.jitter || 0)
//     .floatField("downloadSpeed", dynamicData.downloadSpeed || 0)
//     .floatField("packetLossPercentage", dynamicData.packetLossPercentage || 0);

//   writeClient.writePoint(networkDataPoint);
//   writeClient.flush();
// }

module.exports = {
  getDynamicNetworkData,
  //   logDynamicNetworkData,
};
