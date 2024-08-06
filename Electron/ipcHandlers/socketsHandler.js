const WebSocket = require("ws");
const Store = require("electron-store");
const { getAllData } = require("./sockets"); // Update with the correct path to your module

class WebSocketManager {
  static instance = null;

  constructor(url, appId, secretKey, tenantId, retryInterval = 10000) {
    this.url = url;
    this.appId = appId;
    this.secretKey = secretKey;
    this.tenantId = tenantId;
    this.retryInterval = retryInterval;
    this.socket = null;
    this.store = new Store(); // Initialize the Electron store
    this.connect();

    // Assign the instance to the static property
    WebSocketManager.instance = this;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.on("open", () => {
      console.log("WebSocket connection opened.");
      this.authenticate();
    });

    this.socket.on("message", (message) => {
      this.handleMessage(message);
    });

    this.socket.on("close", (code, reason) => {
      console.log(`WebSocket connection closed: ${code} - ${reason}`);
      this.retryConnection();
    });

    this.socket.on("error", (error) => {
      console.error(`WebSocket error: ${error.message}`);
    });
  }

  authenticate() {
    const authPayload = JSON.stringify({
      appid: this.appId,
      secret_key: this.secretKey,
      tenant_id: this.tenantId,
    });

    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%");
    console.log(authPayload);
    this.socket.send(authPayload);
    console.log("Authentication details sent.");
  }

  handleMessage(message) {
    try {
      const data = JSON.parse(message);
      console.log("Received message:", data);

      // Handle authentication responses
      if (data.status === "success") {
        console.log("Authentication successful");
      } else if (data.status === "failure") {
        console.error("Authentication failed:", data.message);
      }

      // Check for specific messages
      if (data.message === "API has been triggered") {
        this.handleGetEndpointMetrics(data);
      } else if (data.message === "GetEndpointMetrics") {
        this.handleGetEndpointMetrics(data);
      }

      // Compare incoming data fields with Electron store values
      const storedAppId = this.store.get("appId");
      const storedClientSecret = this.store.get("clientSecret");

      if (data.appId && data.clientSecret) {
        if (
          data.appId === storedAppId &&
          data.clientSecret === storedClientSecret
        ) {
          console.log("App ID and Client Secret match the stored values.");
          // Handle matched case
        } else {
          console.log(
            "App ID or Client Secret do not match the stored values."
          );
          // Handle mismatch case
        }
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }

  async handleGetEndpointMetrics(data) {
    const upn = this.store.get("userPrincipalName"); // Assuming upn is stored
    if (data.data === upn) {
      console.log("Request for metrics received for current user.");
      const metricsData = await getAllData();
      console.log("Metrics data sent:", metricsData);
      this.send({ type: "DatatoRender", data: metricsData, upn: upn });
    }
  }

  send(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  retryConnection() {
    console.log(
      `Retrying connection in ${this.retryInterval / 1000} seconds...`
    );
    setTimeout(() => {
      this.connect();
    }, this.retryInterval);
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  static getInstance() {
    return WebSocketManager.instance;
  }
}

module.exports = WebSocketManager;
