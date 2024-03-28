process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow } = require("electron");
const path = require("path");
const Store = require("electron-store");
const store = new Store();
// const isDev = require("electron-is-dev");

const { loginIPC } = require("./ipcHandlers/loginHandlers.js");
const { monitorIPC } = require("./ipcHandlers/monitoringHandlers.js");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Note: __dirname will point to the Electron folder in development
      // and to the resources path in production.
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Determine the correct start URL based on development or production mode.
  // const startURL = isDev
  //   ? "http://localhost:3000" // Dev mode URL
  //   : `file://${path.join(__dirname, "../Frontend/build/index.html")}`; // Prod mode URL

  mainWindow.loadURL(`file://${path.join(__dirname, "./build/index.html")}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  loginIPC(mainWindow);
  monitorIPC(mainWindow);
});

app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});
