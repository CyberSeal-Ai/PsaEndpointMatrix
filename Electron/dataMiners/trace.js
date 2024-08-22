const { exec } = require("child_process");

function executeTraceroute(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }

      // Extract the server name and IP address from the first line
      const firstLineMatch = stdout
        .split("\n")[0]
        .match(/traceroute to (.+) \((.+)\)/);
      if (!firstLineMatch) {
        reject(new Error("Failed to parse server information."));
        return;
      }

      const serverName = firstLineMatch[1];
      const serverIp = firstLineMatch[2];

      // Prepare the response object with server info
      const result = {
        server_name: serverName,
        server_ip: serverIp,
        hops: [],
      };

      try {
        const lines = stdout.split("\n").slice(1); // Skip the first line
        lines.forEach((line, index) => {
          const parts = line.trim().split(/\s+/);
          const hopNumber = parseInt(parts[0], 10);
          const ipAddress = parts[1];

          if (
            ipAddress &&
            ipAddress.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)
          ) {
            result.hops.push({ hop_number: hopNumber, ip: ipAddress });
          }
        });
        resolve(result);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

async function handleTraceData() {
  const command = `traceroute -m 30 -n google.com | awk 'BEGIN {print "["}; NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "{ \\"hop_number\\": %d, \\"ip\\": \\"%s\\" },\\n", NR-1, $2}; END {print "]"}' | sed '$s/,$//'`;

  try {
    const result = await executeTraceroute(command);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (ex) {
    console.error("Error:", ex.message);
    return null;
  }
}

handleTraceData();
