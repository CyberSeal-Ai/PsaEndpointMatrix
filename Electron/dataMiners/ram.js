// const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const { app, ipcMain } = require("electron");
const si = require("systeminformation");
const fs = require("fs");
const path = require("path");

// let app;
// require("dotenv").config({ path: "../.env" });

// const token =
//   "6KozKP130beZY366OUum4YM7Hxm4HTQ2lvZHEsHHND3foo84PG8zTmlniqgzaezMyufT6RGTtPcRBpaA9OIiOQ==";
// const url = "http://localhost:8086";
// const org = "CYBERSEAL";
// const bucket = `RAM_LOGS`;

// const client = new InfluxDB({ url, token });
// const writeClient = client.getWriteApi(org, bucket, "ns");

function setApp(electronApp) {
  app = electronApp;
}

//Get Static RAM Data
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

//Get Dynamic RAM Data
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

function saveStaticRAMData(staticData) {
  const appPath = app.getAppPath();
  const dataPath = path.join(appPath, "staticData", "ram.json");
  const selectedFields = {
    bank: staticData.bank,
    type: staticData.type,
    clockSpeed: staticData.clockSpeed,
    formFactor: staticData.formFactor,
    manufacturer: staticData.manufacturer,
    partNum: staticData.partNum,
    serialNum: staticData.serialNum,
    voltageConfigured: staticData.voltageConfigured,
    voltageMin: staticData.voltageMin,
    voltageMax: staticData.voltageMax,
    size: staticData.size,
    total: staticData.total,
    slots: staticData.slots,
  };
  // console.log("Saving static RAM data to:", dataPath);

  fs.writeFileSync(dataPath, JSON.stringify(selectedFields, null, 2), "utf-8");
}

// function logDynamicRAMData(dynamicData) {
//   const point = new Point("ram_data")
//     .intField("total", dynamicData.total)
//     .intField("free", dynamicData.free)
//     .intField("used", dynamicData.used)
//     .intField("active", dynamicData.active)
//     .intField("available", dynamicData.available)
//     .intField("buffers", dynamicData.buffers)
//     .intField("cached", dynamicData.cached)
//     .intField("slab", dynamicData.slab)
//     .intField("buffcache", dynamicData.buffcache)
//     .intField("swaptotal", dynamicData.swaptotal)
//     .intField("swapused", dynamicData.swapused)
//     .intField("swapfree", dynamicData.swapfree)
//     .intField(
//       "writeback",
//       dynamicData.writeback === null ? 0 : dynamicData.writeback
//     )
//     .tag("ramzTotal", dynamicData.total === null ? "null" : dynamicData.total);

//   writeClient.writePoint(point);
//   writeClient.flush();
// }

module.exports = {
  getStaticRAMData,
  saveStaticRAMData,
  getDynamicRAMData,
  //   logDynamicRAMData,
  setApp,
};
