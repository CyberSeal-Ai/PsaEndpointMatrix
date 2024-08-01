const si = require("systeminformation");
const ping = require("ping");
const https = require("https");

const axios = require("axios");

async function getPublicIpAndVpnInfo() {
  try {
    const ipResponse = await axios.get("https://api.ipify.org?format=json");
    const ipAddress = ipResponse.data.ip;
    console.log(`Public IP Address: ${ipAddress}`);

    const apiKey = "f7e4f0334814499e958bcf0ea939b2b5";
    const vpnApiUrl = `https://vpnapi.io/api/${ipAddress}?key=${apiKey}`;
    const vpnResponse = await axios.get(vpnApiUrl);
    const vpnData = vpnResponse.data;
    console.log("VPN API Data:", vpnData);

    // Return the output of the vpnapi.io API
    return vpnData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function getNetworkInfo() {
  return new Promise((resolve, reject) => {
    const ipToken = "2d39a2ec2fdbb4";
    https
      .get(`https://ipinfo.io?token=${ipToken}`, (resp) => {
        let data = "";

        resp.on("data", (chunk) => {
          data += chunk;
        });

        resp.on("end", () => {
          resolve(JSON.parse(data));
        });
      })
      .on("error", (err) => {
        reject("Error: " + err.message);
      });
  });
}

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

  return { jitter: jitterAverage || 0, latency: latencyAverage || 0 };
}

async function getISPData() {
  try {
    const ipResponse = await axios.get("https://api.ipify.org?format=json");
    const ipAddress = ipResponse.data.ip;
    console.log(`Public IP Address: ${ipAddress}`);

    const apiKey = "f7e4f0334814499e958bcf0ea939b2b5";
    const vpnApiUrl = `https://vpnapi.io/api/${ipAddress}?key=${apiKey}`;
    const vpnResponse = await axios.get(vpnApiUrl);
    const vpnData = {};
    vpnData.vpn = vpnResponse.data;
    console.log("VPN API Data:", vpnData);

    // Return the output of the vpnapi.io API
    return vpnData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function getDynamicNetworkData() {
  try {
    const inetLatency = await si.inetLatency();
    const Interfaces = await si.networkInterfaces("default");
    const systemInfo = await si.system();
    const uuid = systemInfo.uuid;
    const networkStats = await si.networkStats();
    const pingResult = await ping.promise.probe("8.8.8.8");
    const jitterAndLatency = await calculateJitterAndLatency();
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

module.exports = {
  getDynamicNetworkData,
  getISPData,
};
