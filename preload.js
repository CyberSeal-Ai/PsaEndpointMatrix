// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, data) => {
    let validChannels = [
      "login",
      "check-auth",
      "sign-out",
      "start-monitoring",
      "stop-monitoring",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      "auth-status",
      "login-success",
      "login-error",
      "registration-success",
      "registration-error",
      "check-connection",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
