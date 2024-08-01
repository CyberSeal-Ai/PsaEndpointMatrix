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

function executeTracert(command, protocol) {
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

      const destMatch = lines[0].match(/Tracing route to\s+(.*)\s+\[(.*)\]/);
      if (destMatch) {
        result.target = destMatch[1];
        result.destination = destMatch[2];
      }

      const hopRegex =
        protocol === "ipv6"
          ? /^(\d+)\s+([\d*]+)\s+ms\s+([\d*]+)\s+ms\s+([\d*]+)\s+ms\s+([a-fA-F0-9:]+.*)$/
          : /^(\d+)\s+([\d*]+)\s+ms\s+([\d*]+)\s+ms\s+([\d*]+)\s+ms\s+(.*)$/;

      for (const line of lines.slice(2)) {
        const hopMatch = line.trim().match(hopRegex);

        result.totalHops++;

        if (hopMatch) {
          const hopDetail = {
            hop: parseInt(hopMatch[1], 10),
            times: [
              hopMatch[2] === "*" ? null : parseInt(hopMatch[2], 10),
              hopMatch[3] === "*" ? null : parseInt(hopMatch[3], 10),
              hopMatch[4] === "*" ? null : parseInt(hopMatch[4], 10),
            ],
            address: hopMatch[5],
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
      result = await executeTracert(
        "tracert -6 worldaz.tr.teams.microsoft.com",
        "ipv6"
      );
    } catch (err) {
      console.error("IPv6 tracert failed, falling back to IPv4:", err);
      result = await executeTracert(
        "tracert -4 worldaz.tr.teams.microsoft.com",
        "ipv4"
      );
    }
    return result;
  } catch (ex) {
    console.log("Exception:", ex);
    return null;
  }
}

module.exports = { handleTraceData };
