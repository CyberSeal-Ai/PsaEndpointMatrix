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

function executeTraceroute(command) {
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

      const destMatch = lines[0].match(/traceroute to\s+(.*)\s+\((.*)\)/);
      if (destMatch) {
        result.target = destMatch[1];
        result.destination = destMatch[2];
      }

      const hopRegex =
        /^(\d+)\s+(\S+)\s+(\d+\.\d+)\s+ms\s+(\d+\.\d+)\s+ms\s+(\d+\.\d+)\s+ms$/;

      for (const line of lines.slice(1)) {
        const hopMatch = line.trim().match(hopRegex);

        result.totalHops++;

        if (hopMatch) {
          const hopDetail = {
            hop: parseInt(hopMatch[1], 10),
            times: [
              parseFloat(hopMatch[3]),
              parseFloat(hopMatch[4]),
              parseFloat(hopMatch[5]),
            ],
            address: hopMatch[2],
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
    let result;
    try {
      console.log("Executing traceroute...");
      result = await executeTraceroute(
        "traceroute -m 30 worldaz.tr.teams.microsoft.com"
      );
    } catch (err) {
      console.error("Traceroute failed:", err);
      return null;
    }

    console.log("Traceroute result:", result);
    return result;
  } catch (ex) {
    console.log("Exception:", ex);
    return null;
  }
}

module.exports = { handleTraceData };
