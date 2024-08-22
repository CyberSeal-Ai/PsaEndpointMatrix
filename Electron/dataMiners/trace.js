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
    outputData = JSON.stringify(outputData);
    outputData = outputData.slice(0,-3) + "]"; // Remove the trailing comma and newline
    console.log("Raw JSON Output:", outputData); // Log the raw output

    // Parse the cleaned JSON string
    const jsonData = JSON.parse(outputData);
    console.log("Parsed JSON Output:", JSON.stringify(jsonData, null, 2)); // Log formatted JSON

    // Access and log the 'ip' of each element
    jsonData.forEach((element) => {
      console.log(`IP: ${element.ip}`);
    });
  } catch (error) {
    console.error("Failed to parse JSON data:", error);
    console.log("Raw Output:\n", outputData);
  }
});
