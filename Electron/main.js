process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("./ipcHandlers/sockets.js");

const { app, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const Store = require("electron-store");
const store = new Store();

// const isDev = require("electron-is-dev");

const { loginIPC } = require("./ipcHandlers/loginHandlers.js");
const { monitorIPC } = require("./ipcHandlers/monitoringHandlers.js");

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 650,
    height: 500,
    autoHideMenuBar: true,
    maximizable: false,
    icon: path.join(__dirname, "./Icons/ss.ico"),
    webPreferences: {
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
  // mainWindow.loadURL("http://localhost:3001");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, "./Icons/ss.ico"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Application",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Exit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Endpoint Metrics Agent");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.show();
  });
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();
  createTray();

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
  if (process.platform !== "darwin") {
    app.quit();
  }
});
