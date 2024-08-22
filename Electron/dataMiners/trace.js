const { spawn } = require("child_process");
const axios = require("axios");

const target = "worldaz.tr.teams.microsoft.com";
const traceroute = spawn("traceroute", ["-m", "30", "-n", target]);

let outputData = "";
let destinationInfo = {};

// Capture the destination name and IP from the initial traceroute output
traceroute.stdout.on("data", (data) => {
  const lines = data.toString().split("\n");
  lines.forEach((line, index) => {
    if (index === 0 && line.startsWith("traceroute to")) {
      const match = line.match(/traceroute to (.+) \((.+)\)/);
      if (match) {
        destinationInfo.target = match[1];
        destinationInfo.destination = match[2];
      }
    } else {
      outputData += line + "\n";
    }
  });
});

traceroute.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

traceroute.on("close", async (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    return;
  }

  try {
    // Process the output to extract hop information
    const hopArray = outputData
      .trim()
      .split("\n")
      .map((line) => {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const hopNumber = parseInt(parts[0]);
          const ip = parts[1].replace(/[()]/g, "");
          const times = parts
            .slice(2)
            .map((time) => parseFloat(time.replace(" ms", "")));
          return { hop: hopNumber, times, address: ip };
        }
        return null;
      })
      .filter((hop) => hop !== null);

    // Perform analysis on each hop by fetching location data
    for (let hop of hopArray) {
      try {
        hop.vpnInfo = await getPublicIpAndVpnInfo(hop.address);
      } catch (error) {
        console.error(`Error fetching data for IP: ${hop.address}`, error);
        hop.vpnInfo = null; // Assign null if fetching fails
      }
    }

    // Final JSON structure
    const finalResult = {
      ...destinationInfo,
      hops: hopArray,
      totalHops: hopArray.length,
    };

    // Output the final JSON result
    console.log("Final JSON Output:\n", JSON.stringify(finalResult, null, 2));
  } catch (error) {
    console.error("Error processing traceroute data:", error);
    console.log("Raw Output:\n", outputData);
  }
});

// Function to fetch IP location and VPN info
async function getPublicIpAndVpnInfo(ipAddress) {
  try {
    const apiKey = "f7e4f0334814499e958bcf0ea939b2b5";
    const vpnApiUrl = `https://vpnapi.io/api/${ipAddress}?key=${apiKey}`;
    const vpnResponse = await axios.get(vpnApiUrl);
    return vpnResponse.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
