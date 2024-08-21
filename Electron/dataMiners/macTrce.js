const { exec } = require("child_process");

// Function to run traceroute and process the result
function traceRoute(domain) {
  return new Promise((resolve, reject) => {
    // Run traceroute command
    exec("traceroute " + domain, (error, stdout, stderr) => {
      if (error) {
        reject("Error: " + error.message);
      } else if (stderr) {
        reject("Stderr: " + stderr);
      } else {
        // Process the traceroute result
        const hops = processTracerouteResult(stdout);
        resolve(hops);
      }
    });
  });
}

// Function to process the traceroute result and analyze the hops
function processTracerouteResult(tracerouteOutput) {
  const lines = tracerouteOutput.split("\n");
  const hops = [];

  // Parse each line to extract hop information
  for (const line of lines) {
    const hopMatch = line.match(/^\s*(\d+)\s+([\d\.]+)\s+\(([\d\.]+)\)/);
    if (hopMatch) {
      const hopNumber = hopMatch[1];
      const hopIP = hopMatch[3];
      hops.push({ hopNumber, hopIP });
    }
  }

  // Post result analysis: e.g., detect any unusual delays or missing hops
  analyzeHops(hops);

  return hops;
}

// Function to perform analysis on the hops
function analyzeHops(hops) {
  let previousHop = null;
  for (const hop of hops) {
    if (previousHop) {
      const hopNumberDiff = hop.hopNumber - previousHop.hopNumber;
      if (hopNumberDiff > 1) {
        console.log(
          "Warning: Missing hops detected between hop " +
            previousHop.hopNumber +
            " and hop " +
            hop.hopNumber
        );
      }
    }
    previousHop = hop;
  }
}

// Run the traceroute to a target domain and log the results
const targetDomain = "google.com"; // Replace with your target domain
traceRoute(targetDomain)
  .then((hops) => {
    console.log("Traceroute to " + targetDomain + " completed. Hops:");
    console.log(hops);
  })
  .catch((error) => {
    console.error("Failed to perform traceroute: " + error);
  });
