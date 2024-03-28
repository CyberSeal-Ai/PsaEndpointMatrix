const si = require("systeminformation");
const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function setApp(electronApp) {
  app = electronApp;
}

async function getStaticCPUData() {
  const data = await si.cpu();

  return {
    manufacturer: data.manufacturer,
    brand: data.brand,
    vendor: data.vendor,
    family: data.family,
    model: data.model,
    speed: data.speed,
    speedMin: data.speedMin,
    speedMax: data.speedMax,
    cores: data.cores,
    physicalCores: data.physicalCores,
    processors: data.processors,
  };
}

async function getDynamicCPUData() {
  const currentLoad = await si.currentLoad();
  const processes = await si.processes();
  const cpuTemperature = await si.cpuTemperature();
  const systemInfo = await si.system();
  const uuid = systemInfo.uuid;

  return {
    avgLoad: currentLoad.avgLoad,
    uuid: uuid,
    currentLoad: currentLoad.currentLoad,
    currentLoadUser: currentLoad.currentLoadUser,
    currentLoadSystem: currentLoad.currentLoadSystem,
    currentLoadNice: currentLoad.currentLoadNice,
    currentLoadIdle: currentLoad.currentLoadIdle,
    currentLoadIrq: currentLoad.currentLoadIrq,
    totalProcesses: processes.all,
    cpuTemperature: cpuTemperature.main,
  };
}

// function logDynamicCPUData(dynamicData) {
//   const point = new Point("cpu_data")
//     // .floatField("avgLoad", dynamicData.avgLoad)
//     .floatField("currentLoad", dynamicData.currentLoad)
//     .floatField("currentLoadUser", dynamicData.currentLoadUser)
//     .floatField("currentLoadSystem", dynamicData.currentLoadSystem)
//     .floatField("currentLoadNice", dynamicData.currentLoadNice)
//     .floatField("currentLoadIdle", dynamicData.currentLoadIdle)
//     .floatField("currentLoadIrq", dynamicData.currentLoadIrq)
//     .intField("totalProcesses", dynamicData.totalProcesses)
//     .tag(
//       "cpuTemperature",
//       dynamicData.cpuTemperature === null ? "null" : "value"
//     )
//     .floatField(
//       "cpuTemperature",
//       dynamicData.cpuTemperature === null ? 0.0 : dynamicData.cpuTemperature
//     );

//   writeClient.writePoint(point);
//   writeClient.flush();
// }

function saveStaticCPUData(staticData) {
  const appPath = app.getAppPath();
  const dataPath = path.join(appPath, "staticData", "cpu.json");
  console.log("Saving static CPU data to:", dataPath);
  const selectedFields = {
    manufacturer: staticData.manufacturer,
    brand: staticData.brand,
    vendor: staticData.vendor,
    family: staticData.family,
    model: staticData.model,
    speed: staticData.speed,
    speedMin: staticData.speedMin,
    speedMax: staticData.speedMax,
    cores: staticData.cores,
    physicalCores: staticData.physicalCores,
    processors: staticData.processors,
  };

  fs.writeFileSync(dataPath, JSON.stringify(selectedFields, null, 2), "utf-8");
}

module.exports = {
  getStaticCPUData,
  getDynamicCPUData,
  //   logDynamicCPUData,
  saveStaticCPUData,
  setApp,
};
