const si = require("systeminformation");
const fs = require("fs");
const os = require("os");
const path = require("path");

async function getSystemInfo() {
  try {
    const systemInfo = await si.system();
    const uuidInfo = await si.uuid();

    systemInfo.os = uuidInfo.os;
    systemInfo.hardware = uuidInfo.hardware;
    systemInfo.macs = uuidInfo.macs;
    systemInfo.osInfo = {
      platform: os.platform(),
      type: os.type(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
    };

    return systemInfo;
  } catch (error) {
    console.error("Error collecting system information:", error);
    return null;
  }
}

module.exports = {
  getSystemInfo,
};
