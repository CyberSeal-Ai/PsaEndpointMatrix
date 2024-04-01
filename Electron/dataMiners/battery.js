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
    return battery.percent;
  } catch (err) {
    console.error("Error getting battery percentage:", err);
    return null;
  }
}

// Function to monitor battery on power status
// function monitorBatteryOnPower() {
//   powerMonitor.on("on-ac", () => {
//     console.log("The system is on AC power");
//     [1];
//     return false;
//   });

//   powerMonitor.on("on-battery", () => {
//     console.log("The system is on battery power");
//     [1];
//     return true;
//   });
// }

// Export functions
module.exports = {
  getBatteryPercentage,
  //   monitorBatteryOnPower,
};
