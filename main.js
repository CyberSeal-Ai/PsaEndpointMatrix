const { app, BrowserWindow, ipcMain, net } = require("electron");
const querystring = require("querystring");
const Store = require("electron-store");
const store = new Store();
const axios = require("axios");
const path = require("path");
const { loginIPC } = require("./ipcHandlers/loginHandlers.js");
const { monitorIPC } = require("./ipcHandlers/monitoringHandlers.js");

let mainWindow;

// Main function to create the Electron window

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:3000/");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.disableHardwareAcceleration();

app.on("ready", () => {
  createWindow();
  loginIPC(mainWindow);
  monitorIPC(mainWindow);
});
