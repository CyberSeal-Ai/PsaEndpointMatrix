const { spawn } = require("child_process");

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

awk.on("close", (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    return;
  }

  // Output the string result
  console.log("Traceroute Data:\n", outputData);
});
