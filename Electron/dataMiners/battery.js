const { app, powerMonitor } = require("electron");

const si = require("systeminformation");

async function getBatteryPercentage() {
  try {
    const battery = await si.battery();
    return battery.percent;
  } catch (err) {
    console.error("Error getting battery percentage:", err);
    return null;
  }
}

function monitorBatteryOnPower() {
  const powerStatus = powerMonitor.isOnBatteryPower() ? "on-battery" : "on-ac";
  return powerStatus;
}

module.exports = {
  getBatteryPercentage,
  monitorBatteryOnPower,
};
