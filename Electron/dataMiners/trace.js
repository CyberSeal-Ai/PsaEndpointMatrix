const { spawn } = require("child_process");
const axios = require("axios");

const traceroute = spawn("traceroute", ["-m", "30", "-n", "google.com"]);
const awk = spawn("awk", [
  'BEGIN {print "["}; NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "{ \\"hop_number\\": %d, \\"ip\\": \\"%s\\" },\\n", NR-1, $2}; END {print "]"}',
]);
const sed = spawn("sed", ["$s/,$//"]);

traceroute.stdout.pipe(awk.stdin);
awk.stdout.pipe(sed.stdin);

sed.stdout.on("data", async (data) => {
  console.log("Raw JSON Output:\n", data.toString());
  console.log(data)
  const jsonData = data

  // Iterate through each IP and fetch location details
  for (const item of jsonData) {
    try {
      const locationData = await getPublicIpAndVpnInfo(item.ip);
      item.location = locationData;
      console.log(`IP: ${item.ip}, Location: ${JSON.stringify(locationData)}`);
      
    } catch (error) {
      console.error(`Error fetching data for IP: ${item.ip}`, error);
    }
  }


  console.log("Enriched JSON Output:\n", JSON.stringify(jsonData, null, 2));
});

sed.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

sed.on("close", (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
});

async function getPublicIpAndVpnInfo(ipAddress) {
  try {
    const apiKey = "f7e4f0334814499e958bcf0ea939b2b5";
    const vpnApiUrl = `https://vpnapi.io/api/${ipAddress}?key=${apiKey}`;
    const vpnResponse = await axios.get(vpnApiUrl);
    const vpnData = vpnResponse.data;
    return vpnData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
