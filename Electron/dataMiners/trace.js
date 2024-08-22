const { spawn } = require("child_process");

const traceroute = spawn("traceroute", ["-m", "30", "-n", "google.com"]);
const awk = spawn("awk", [
  'BEGIN {print "["}; NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "{ \\"hop_number\\": %d, \\"ip\\": \\"%s\\" },\\n", NR-1, $2}; END {print "]"}',
]);
const sed = spawn("sed", ["$s/,$//"]);

traceroute.stdout.pipe(awk.stdin);
awk.stdout.pipe(sed.stdin);

sed.stdout.on("data", (data) => {
  console.log(`Output:\n${data}`);
});

sed.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

sed.on("close", (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
});
