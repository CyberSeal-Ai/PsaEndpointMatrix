// windows.js
const { app } = require("electron");
const os = require("os");
const child_process = require("child_process");

function getWindowsVersion() {
  return os.release();
}

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    const updateCheckProcess = child_process.spawn("powershell.exe", [
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "& {(Get-HotFix | Sort-Object -Property InstalledOn -Descending | Select-Object -First 1).Description}",
    ]);

    let output = "";
    updateCheckProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    updateCheckProcess.stderr.on("data", (data) => {
      reject(data.toString());
    });

    updateCheckProcess.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(`Process exited with code ${code}`);
      }
    });
  });
}

async function checkWindowsVersion() {
  try {
    const currentVersion = getWindowsVersion();
    const latestUpdate = await checkForUpdates();

    console.log("Current Windows version:", currentVersion);
    console.log("Latest installed update:", latestUpdate);

    return {
      currentVersion: currentVersion,
      latestUpdate: latestUpdate,
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
  }
}

checkWindowsVersion();

module.exports = {
  checkWindowsVersion,
};
