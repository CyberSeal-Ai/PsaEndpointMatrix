const { ipcMain } = require("electron");
const { getStaticCPUData, getDynamicCPUData } = require("../dataMiners/cpu.js");
const { getSystemInfo } = require("../dataMiners/system.js");
const { getDynamicNetworkData } = require("../dataMiners/network.js");
const { getStaticRAMData, getDynamicRAMData } = require("../dataMiners/ram.js");
const WebSocket = require("ws");

const Store = require("electron-store");
const store = new Store();

const appID = store.get("appId");
const secret = store.get("clientSecret");

const PouchDB = require("pouchdb");
const db = new PouchDB("system_data");

const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: (info, done) => {
    const origin = info.origin;
    console.log(`Origin: ${origin}`);
    // Allow all origins for now, or you can implement your own logic to restrict origins
    done(true);
  },
});

wss.on("listening", () => {
  console.log(`WebSocket server is listening on port ${wss.options.port}`);
});

wss.on("connection", function connection(ws) {
  console.log("WebSocket connection established");
  ws.on("message", async function incoming(message) {
    console.log("received: %s", message);
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (e) {
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
      console.error("Invalid JSON received: " + message);
      return;
    }

    // Check for appID and secret
    if (parsedMessage.appID === appID && parsedMessage.secret === secret) {
      // Handle different data requests
      switch (parsedMessage.type) {
        case "requestData":
          try {
            // Fetch data from local DB and send
            const data = await fetchDataFromDB(); // Implement your actual data fetching logic here
            ws.send(JSON.stringify({ status: "success", data: data }));
            console.log("Data sent successfully");
          } catch (error) {
            ws.send(
              JSON.stringify({
                error: "Failed to fetch data: " + error.message,
              })
            );
            console.error("Failed to fetch data: " + error.message);
          }
          break;
        default:
          ws.send(JSON.stringify({ error: "Unknown request type" }));
          console.error("Unknown request type: " + parsedMessage.type);
      }
    } else {
      ws.send(JSON.stringify({ error: "Authentication failed" }));
      console.error("Authentication failed for appID: " + parsedMessage.appID);
    }
  });
});

const handleStaticData = async () => {
  try {
    const staticCPUData = await getStaticCPUData();
    const staticCPUDataDoc = {
      _id: `static_cpu_${Date.now()}`,
      type: "static_cpu",
      data: staticCPUData,
      timestamp: new Date().toISOString(),
    };
    await db.put(staticCPUDataDoc);

    const systemInfo = await getSystemInfo();
    const systemInfoDoc = {
      _id: `system_info_${Date.now()}`,
      type: "system_info",
      data: systemInfo,
      timestamp: new Date().toISOString(),
    };
    await db.put(systemInfoDoc);

    const staticRAMData = await getStaticRAMData();
    const staticRAMDataDoc = {
      _id: `static_ram_${Date.now()}`,
      type: "static_ram",
      data: staticRAMData,
      timestamp: new Date().toISOString(),
    };
    await db.put(staticRAMDataDoc);

    console.log("Static data saved successfully.");
  } catch (error) {
    console.error("Failed to handle static data:", error);
  }
};

const handleDynamicData = async () => {
  try {
    const dynamicCPUData = await getDynamicCPUData();
    const dynamicCPUDataDoc = {
      _id: `dynamic_cpu_${Date.now()}`,
      type: "dynamic_cpu",
      data: dynamicCPUData,
      timestamp: new Date().toISOString(),
    };
    await db.put(dynamicCPUDataDoc);

    const dynamicRAMData = await getDynamicRAMData();
    const dynamicRAMDataDoc = {
      _id: `dynamic_ram_${Date.now()}`,
      type: "dynamic_ram",
      data: dynamicRAMData,
      timestamp: new Date().toISOString(),
    };
    await db.put(dynamicRAMDataDoc);

    const dynamicNetworkData = await getDynamicNetworkData();
    const dynamicNetworkDataDoc = {
      _id: `dynamic_network_${Date.now()}`,
      type: "dynamic_network",
      data: dynamicNetworkData,
      timestamp: new Date().toISOString(),
    };
    await db.put(dynamicNetworkDataDoc);

    console.log("Dynamic data saved successfully.");
  } catch (error) {
    console.error("Failed to handle dynamic data:", error);
  }
};

const displayCollections = async () => {
  try {
    const result = await db.allDocs({ include_docs: true });

    console.log("All documents in the database:");
    result.rows.forEach((row) => {
      console.log(row.doc);
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
  }
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
