const si = require("systeminformation");

async function getBatteryPercentage() {
  try {
    const battery = await si.battery();
    return battery.percent; // This gives the battery percentage
  } catch (err) {
    console.error("Error getting battery percentage:", err);
    return null;
  }
}

// Function to monitor battery power status
async function monitorBatteryOnPower() {
  try {
    const battery = await si.battery();
    return battery.isCharging ? "on-ac" : "on-battery";
  } catch (err) {
    console.error("Error getting battery status:", err);
    return "unknown";
  }
}

// Battery class constructor
async function Battery() {
  const data = {
    batteryPercentage: await getBatteryPercentage(),
    batteryStatus: await monitorBatteryOnPower(),
  };

  console.log("Battery Data : ", data);

  return data;
}

module.exports = {
  Battery,
};
