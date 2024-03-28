const { app, BrowserWindow, ipcMain, net } = require("electron");
const {
  getStaticCPUData,
  getDynamicCPUData,
  saveStaticCPUData,
  setApp,
} = require("../dataMiners/cpu.js");

const {
  getSystemInfo,
  saveSystemInfoToFile,
} = require("../dataMiners/system.js");

const { getDynamicNetworkData } = require("../dataMiners/network.js");

const {
  getStaticRAMData,
  saveStaticRAMData,
  getDynamicRAMData,
} = require("../dataMiners/ram.js");

const Store = require("electron-store");
const store = new Store();
const querystring = require("querystring");
const axios = require("axios");
const path = require("path");

let dataCache = [];

const handleStaticData = async (clientId, secretKey, Tenant_id) => {
  try {
    const staticData = await getStaticCPUData();
    saveStaticCPUData(staticData);
    const systemInfo = await getSystemInfo();
    saveSystemInfoToFile(systemInfo);
    const staticRAMData = await getStaticRAMData();
    saveStaticRAMData(staticRAMData);

    console.log("client id:", clientId);
    console.log("secret key:", secretKey);
    console.log("tenant id:", Tenant_id);

    dataCache.push({
      CPUstaticData: staticData,
      RAMstaticData: staticRAMData,
      SystemInfo: systemInfo,
      timestamp: new Date(),
    });

    const body = JSON.stringify({
      dataCache,
      clientId: clientId,
      secretKey: secretKey,
      Tenant_id: Tenant_id,
    });

    const isStatic = "1";

    console.log("Static data saved and sent to server.");
    console.log("Data to be sent:", body);

    fetch("https://20.197.2.222/backend/endpointMetrics/GetEndpointMetrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    })
      .then((response) => response.json())
      .then((data) => {
        dataCache = [];
      })
      .catch((error) => console.error("Error:", error));
  } catch (error) {
    console.error("Failed to get or save static CPU data:", error);
  }
};

const handleDynamicData = async (secretKey, clientId, Tenant_id) => {
  try {
    const dynamicRAMData = await getDynamicRAMData();
    const dynamicNetworkData = await getDynamicNetworkData();
    const dynamicCPUData = await getDynamicCPUData();

    dataCache.push({
      CPUdata: dynamicCPUData,
      NetworkData: dynamicNetworkData,
      RAMData: dynamicRAMData,
      timestamp: new Date(),
    });

    if (dataCache.length >= 6) {
      const body = JSON.stringify({
        dataCache,
        secretKey,
        clientId,
        Tenant_id,
      });

      console.log("Dynamic data saved and sent to server.");

      fetch("https://20.197.2.222/backend/endpointMetrics/GetEndpointMetrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      })
        .then((response) => console.log(response))
        .then((data) => {
          dataCache = [];
        })
        .catch((error) => console.error("Error:", error));
    }
  } catch (error) {
    console.error("Failed to get dynamic data:", error);
  }
};

const monitorIPC = (mainWindow) => {
  let dynamicDataInterval;
  let staticDataInterval;

  ipcMain.on("start-monitoring", async (event) => {
    console.log("Start monitoring data:");
    const clientId = await store.get("appId");
    const secretKey = await store.get("clientSecret");
    const Tenant_id = await store.get("tenantId");

    console.log("Client ID:", clientId);
    console.log("Secret Key:", secretKey);
    console.log("Tenant ID:", Tenant_id);

    if (!dynamicDataInterval) {
      dynamicDataInterval = setInterval(async () => {
        handleDynamicData(secretKey, clientId, Tenant_id);
      }, 15000);
    }

    handleStaticData(clientId, secretKey, Tenant_id);

    if (!staticDataInterval) {
      staticDataInterval = setInterval(async () => {
        handleStaticData(clientId, secretKey, Tenant_id);
      }, 3600000);
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
