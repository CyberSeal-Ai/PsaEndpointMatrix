const { spawn } = require("child_process");
const axios = require("axios");

const traceroute = spawn("traceroute", ["-m", "30", "-n", "google.com"]);
const awk = spawn("awk", [
  'NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "%d|%s\\n", NR-1, $2}',
]);

let outputData = "";

traceroute.stdout.pipe(awk.stdin);

awk.stdout.on("data", (data) => {
  outputData += data.toString();
});

awk.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

awk.on("close", async (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    return;
  }

  try {
    // Convert the outputData string to an array of objects
    const hopArray = outputData
      .trim()
      .split("\n")
      .map((line) => {
        const [hopNumber, ip] = line.split("|");
        return { hop_number: parseInt(hopNumber, 10), ip };
      });

    console.log("Parsed Hops:\n", hopArray);

    // Perform analysis on each hop by fetching location data
    for (let hop of hopArray) {
      try {
        hop.location = await getPublicIpAndVpnInfo(hop.ip);
      } catch (error) {
        console.error(`Error fetching data for IP: ${hop.ip}`, error);
        hop.location = null; // Assign null if fetching fails
      }
    }

    // Output the final JSON result
    console.log("Final JSON Output:\n", JSON.stringify(hopArray, null, 2));
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
