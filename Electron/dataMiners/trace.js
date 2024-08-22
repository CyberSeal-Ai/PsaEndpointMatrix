const { exec } = require("child_process");

const command = `traceroute -m 30 -n google.com | awk 'BEGIN {print "["}; NR>1 {if ($2 ~ /^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$/) printf "{ \\"hop_number\\": %d, \\"ip\\": \\"%s\\" },\\n", NR-1, $2}; END {print "]"}' | sed '$s/,$//'`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`Output:\n${stdout}`);
});
