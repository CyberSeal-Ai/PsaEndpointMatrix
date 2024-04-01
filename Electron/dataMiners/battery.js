// battery.js

const { app, powerMonitor } = require("electron");

// Battery Percentage
const si = require("systeminformation");

// Function to get battery percentage
async function getBatteryPercentage() {
  try {
    const battery = await si.battery();
    console.log("Battery percentage:", battery.percent);
    console.log("Battery is charging:", battery.isCharging);
    console.log("AC connected : ", battery.acConnected);
    return battery;
  } catch (err) {
    console.error("Error getting battery percentage:", err);
    return null;
  }
}

// Export functions
module.exports = {
  getBatteryPercentage,
  //   monitorBatteryOnPower,
};
