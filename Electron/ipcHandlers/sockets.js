const WebSocket = require("ws");
const querystring = require("querystring");
const Store = require("electron-store");
const store = new Store();
const axios = require("axios");
const path = require("path");

async function connectWebSocket() {
  // Retrieve stored appId and clientSecret
  const appId = store.get("appId");
  const clientSecret = store.get("clientSecret");

  if (!appId || !clientSecret) {
    console.error(
      "Missing appId or clientSecret. Please register the application first."
    );
    return;
  }

  const wsUrl = `ws://localhost:5000/ws/endpoint_metrics`;

  const ws = new WebSocket(wsUrl);

  ws.on("open", function open() {
    console.log("WebSocket connection established");
    // Send appId and clientSecret as the first message
    ws.send(JSON.stringify({ app_id: appId, app_secret: clientSecret }));
  });

  ws.on("message", function incoming(data) {
    console.log("Received:", data);
    // Handle incoming messages
  });

  ws.on("error", function error(err) {
    console.error("WebSocket error:", err);
  });
}

ipcRenderer.on("registration-success", (event) => {
  connectWebSocket();
});
