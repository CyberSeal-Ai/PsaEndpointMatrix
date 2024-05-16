const {app, BrowserWindow, ipcMain, net} = require("electron");

const Store = require("electron-store");
const store = new Store();
const querystring = require("querystring");
const axios = require("axios");
const path = require("path");

async function monitorTeleConferenceData(token) {
    try {
        const response = await axios.get("https://graph.microsoft.com/v1.0/communications/callRecords", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.data) {
            console.log("Call Records:", response.data);
        }
    } catch (error) {
        console.error("Error fetching call records:", error.message);
    }
}

const monitorCall = () => {
    ipcMain.on("call-monitor", async (event, arg) => {
        console.log("Call Monitor IPC Received");
        const token = store.get("bearerToken");
        if (token) {
            monitorTeleConferenceData(token);
        } else {
            console.error("No token found.");
        }
    })
}

module.exports = { monitorCall };