const { spawn } = require("child_process");

const traceroute = spawn("traceroute", ["-m", "30", "-n", "google.com"]);
const awk = spawn("awk", [
  'BEGIN {print "["}; NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "{ \\"hop_number\\": %d, \\"ip\\": \\"%s\\" },\\n", NR-1, $2}; END {print "]"}',
]);

let outputData = "";

traceroute.stdout.pipe(awk.stdin);
awk.stdout.on("data", (data) => {
  outputData += data.toString();
});

awk.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

awk.on("close", (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    return;
  }

  try {
    // Clean the output string
    outputData = outputData.replace(/,\s*\]$/, "]"); // Remove the trailing comma
    console.log("Raw JSON Output:", outputData); // Log the raw output
    
    // const jsonData = JSON.parse(outputData); // Parse the cleaned JSON string
    console.log("Parsed JSON Output:", JSON.stringify(outputData, null, 2)); // Log formatted JSON
    jsonData = JSON.stringify(outputData, null, 2);
    for (const hop of jsonData) {
      console.log(`Hop ${hop.hop_number}: ${hop.ip}`);
    }

  } catch (error) {
    console.error("Failed to parse JSON data:", error);
    console.log("Raw Output:\n", outputData);
  }
});
