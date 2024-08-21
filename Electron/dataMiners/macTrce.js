const { exec } = require("child_process");
const axios = require("axios");

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

function extractIpAddress(address) {
  console.log("Address:", address);
  const ipRegex = /(\d{1,3}\.){3}\d{1,3}/;
  const match = address.match(ipRegex);
  console.log("Match:", match);
  return match ? match[0] : null;
}

function executeTraceroute(domain) {
  const command = `traceroute -m 30 ${domain}`;
  return new Promise((resolve, reject) => {
    exec(command, async (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = stdout.split("\n").filter((line) => line.trim() !== "");
      const result = {
        destination: "",
        target: "",
        hops: [],
        totalHops: 0,
      };

      const destRegex = /traceroute to\s+(.*)\s+\((.*)\)/;
      const hopRegex =
        /^(\d+)\s+([\d.]+)\s+\(([\d.]+)\)\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms$/;

      const destMatch = lines[1].match(destRegex);
      if (destMatch) {
        result.target = destMatch[1];
        result.destination = destMatch[2];
      }

      for (const line of lines.slice(2)) {
        const hopMatch = line.trim().match(hopRegex);

        if (hopMatch) {
          result.totalHops++;

          const hopDetail = {
            hop: parseInt(hopMatch[1], 10),
            times: [
              hopMatch[4] === "*" ? null : parseFloat(hopMatch[4]),
              hopMatch[5] === "*" ? null : parseFloat(hopMatch[5]),
              hopMatch[6] === "*" ? null : parseFloat(hopMatch[6]),
            ],
            address: hopMatch[3],
          };

          const ipAddress = extractIpAddress(hopDetail.address);
          console.log("IP Address:", ipAddress);

          if (ipAddress) {
            try {
              const vpnInfo = await getPublicIpAndVpnInfo(ipAddress);
              console.log("VPN Info:", vpnInfo);

              if (vpnInfo && vpnInfo.location) {
                hopDetail.vpnInfo = vpnInfo;
              }
            } catch (error) {
              hopDetail.vpnInfo = { error: "Failed to fetch VPN info" };
            }
          }

          result.hops.push(hopDetail);
        }
      }

      resolve(result);
    });
  });
}

async function handleTraceData() {
  try {
    const domain = "worldaz.tr.teams.microsoft.com"; // Replace with your desired domain
    let result;
    try {
      result = await executeTraceroute(domain);
    } catch (err) {
      console.error("Traceroute failed:", err);
      result = null;
    }
    return result;
  } catch (ex) {
    console.log("Exception:", ex);
    return null;
  }
}

module.exports = { handleTraceData };
