
const { spawn } = require("child_process");

const traceroute = spawn("traceroute", ["-m", "30", "-n", "google.com"]);
const awk = spawn("awk", [
  'BEGIN {print "["}; NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "{ \\"hop_number\\": %d, \\"ip\\": \\"%s\\" },\\n", NR-1, $2}; END {print "]"}',
]);
const sed = spawn("sed", ["'$!{H;$!d} ; x ; s/},\\n]$/}\\n]/'"]);

let outputData = "";

traceroute.stdout.pipe(awk.stdin);
awk.stdout.pipe(sed.stdin);

sed.stdout.on("data", (data) => {
  outputData += data.toString();
});

sed.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

sed.on("close", (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    return;
  }

  try {
    // Remove any trailing comma before the closing bracket
    outputData = outputData.replace(/,\s*\]$/, "]");
    const jsonData = JSON.parse(outputData);
    console.log("Parsed JSON Output:", jsonData);
  } catch (error) {
    console.error("Failed to parse JSON data:", error);
    console.log("Raw Output:\n", outputData);
  }
});