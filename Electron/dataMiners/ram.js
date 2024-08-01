const { app } = require("electron");
const si = require("systeminformation");

function setApp(electronApp) {
  app = electronApp;
}

// Get Static RAM Data
async function getStaticRAMData() {
  const data = await si.memLayout();
  return {
    size: data[0].size,
    bank: data[0].bank,
    type: data[0].type,
    ecc: data[0].ecc,
    clockSpeed: data[0].clockSpeed,
    formFactor: data[0].formFactor,
    manufacturer: data[0].manufacturer,
    partNum: data[0].partNum,
    serialNum: data[0].serialNum,
    voltageConfigured: data[0].voltageConfigured,
    voltageMin: data[0].voltageMin,
    voltageMax: data[0].voltageMax,
  };
}

// Get Dynamic RAM Data
async function getDynamicRAMData() {
  const data = await si.mem();
  const systemInfo = await si.system();
  const uuid = systemInfo.uuid;
  return {
    total: data.total,
    free: data.free,
    used: data.used,
    active: data.active,
    uuid: uuid,
    available: data.available,
    buffers: data.buffers,
    cached: data.cached,
    slab: data.slab,
    buffcache: data.buffcache,
    swaptotal: data.swaptotal,
    swapused: data.swapused,
    swapfree: data.swapfree,
    writeback: data.writeback,
  };
}

module.exports = {
  getStaticRAMData,
  getDynamicRAMData,
  setApp,
};
