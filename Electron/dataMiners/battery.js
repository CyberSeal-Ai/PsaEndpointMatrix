const { powerMonitor } = require("electron");
const batteryLevel = require("battery-level");

async function getBatteryPercentage() {
  try {
    const batteryPercentage = (await batteryLevel()) * 100;
    return batteryPercentage;
  } catch (err) {
    console.error("Error getting battery percentage:", err);
    return null;
  }
}

// Function to monitor battery power status
async function monitorBatteryOnPower() {
  return powerMonitor.isOnBatteryPower() ? "on-battery" : "on-ac";
}

// Battery class constructor
async function Battery() {
  data = {
    batteryPercentage: await getBatteryPercentage(),
    batteryStatus: await monitorBatteryOnPower(),
  };

  console.log("Battery Data : ", data);

  return data;
}

module.exports = {
  Battery,
};
