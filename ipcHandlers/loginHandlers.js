const { app, BrowserWindow, ipcMain, net } = require("electron");
const querystring = require("querystring");
const Store = require("electron-store");
const store = new Store();
const axios = require("axios");
const path = require("path");
const { exchangeCodeForTokens } = require("./authHelpers");

const loginIPC = (mainWindow) => {
  // The below ipc is to continously ping the PSA for connection status.
  // The timing of the same is controlled by the React application that sends the ipc

  ipcMain.handle("check-connection", async () => {
    const clientId = store.get("appId");
    const secretKey = store.get("clientSecret");
    const tenantId = store.get("tenantId");

    return new Promise((resolve) => {
      const queryParams = new URLSearchParams({
        appId: clientId,
        clientSecret: secretKey,
        tenantId: tenantId,
      }).toString();

      const requestUrl = `http://localhost:5000/endpointMetrics/status?${queryParams}`;

      const request = net.request(requestUrl);
      request.on("response", (response) => {
        resolve(response.statusCode === 200 ? "Connected" : "Failed");
      });
      request.on("error", (error) => {
        console.error("Connection check error:", error);
        resolve("Failed (trying again in 2 mins)");
      });
      request.end();
    });
  });

  // This ipc checks if the User is already authenticated or not

  ipcMain.on("check-auth", (event) => {
    const clientId = store.get("appId");
    const secretKey = store.get("clientSecret");

    if (clientId && secretKey) {
      event.reply("auth-status", {
        isAuthenticated: true,
        clientId,
        secretKey,
      });
    } else {
      event.reply("auth-status", { isAuthenticated: false });
    }
  });

  // This ipc is to sign out the user

  ipcMain.on("sign-out", (event) => {
    store.delete("appId");
    store.delete("clientSecret");
    store.delete("tenantId");
    store.delete("userDetails");
    event.reply("auth-status", { isAuthenticated: false });
  });

  // IPC to handle the login process

  ipcMain.on("login", async (event) => {
    console.log("Login requested !!!");

    const authWindow = new BrowserWindow({
      width: 500,
      height: 500,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true, // Ensure security
      },
    });

    // Microsoft OAuth 2.0 endpoints and parameters
    const authUrl =
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" +
      querystring.stringify({
        client_id: "d3385247-0b3f-410a-8f8f-2bfdb3b245b9",
        response_type: "code",
        redirect_uri: "myapp://auth",
        scope: "openid profile User.Read", // Add other scopes as needed
        response_mode: "query",
      });

    authWindow.loadURL(authUrl);

    const handleCallback = (url) => {
      const raw_code = /code=([^&]*)/.exec(url) || null;
      const code = raw_code && raw_code.length > 1 ? raw_code[1] : null;
      const error = /\?error=(.+)$/.exec(url);

      if (code || error) {
        authWindow.destroy();
      }
      if (code) {
        exchangeCodeForTokens(code, event.sender);
      } else if (error) {
        console.error("OAuth callback error:", error);
        event.sender.send("login-error", error);
      }
    };

    authWindow.webContents.on("will-navigate", (event, url) => {
      handleCallback(url);
    });

    authWindow.webContents.on("will-redirect", (event, url) => {
      handleCallback(url);
    });

    authWindow.on(
      "close",
      () => {
        authWindow = null;
      },
      false
    );

    authWindow.webContents.on("new-window", (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });
  });
};

module.exports = { loginIPC };
