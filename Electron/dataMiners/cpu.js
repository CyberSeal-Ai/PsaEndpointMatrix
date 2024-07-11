const si = require("systeminformation");
const fs = require("fs");
const path = require("path");

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

module.exports = {
  getStaticCPUData,
  getDynamicCPUData,
};
