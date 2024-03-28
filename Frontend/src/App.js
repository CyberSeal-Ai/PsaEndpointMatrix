import React, { useEffect, useState, useRef } from "react";
import { Button, Typography, Box } from "@mui/material";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [monitoringStatus, setMonitoringStatus] = useState(false);
  const [connectionStatusBoolean, setConnectionStatusBoolean] = useState(false);

  const startMonitoring = async () => {
    window.electron.send("start-monitoring");
    setMonitoringStatus(true);
  };

  const checkConnection = async () => {
    const status = await window.electron.invoke("check-connection");
    if (status === "Connected") {
      console.log(status);
      setConnectionStatusBoolean(true);
      setConnectionStatus("Connected");
    } else {
      setConnectionStatusBoolean(false);
      setConnectionStatus("Failed (trying again in 2 mins)");
    }
    console.log("Connection status:", status);
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkConnection();
    }

    const intervalId = setInterval(checkConnection, 120000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    window.electron.send("check-auth");

    window.electron.receive("auth-status", ({ isAuthenticated }) => {
      console.log("Auth status received !!!");
      setIsAuthenticated(isAuthenticated);
      if (isAuthenticated) {
        checkConnection();
      }
    });

    window.electron.receive("registration-success", (data) => {
      console.log("Registration successful:", data);
      setIsAuthenticated(true);
      checkConnection();
      startMonitoring();
    });

    window.electron.receive("registration-error", (error) => {
      console.error("Registration error:", error);
    });

    // Cleanup
    return () => {
      window.electron.receive("auth-status", () => {});
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && !monitoringStatus) {
      startMonitoring();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    window.electron.send("login");
  };

  const handleStopMonitoring = () => {
    window.electron.send("stop-monitoring");
    setMonitoringStatus(false);
  };

  const handleSignOut = () => {
    window.electron.send("sign-out");
    handleStopMonitoring();
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <Typography variant="h4" gutterBottom>
            Endpoint Metrics
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Connection status with PSA: {connectionStatus}
          </Typography>
          <Box mt={2} display="flex" gap={2}>
            {monitoringStatus ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleStopMonitoring}
              >
                Stop Monitoring
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={startMonitoring}
              >
                Start Monitoring
              </Button>
            )}
            {connectionStatus !== "Connected" && (
              <Button
                variant="contained"
                color="info"
                onClick={checkConnection}
              >
                Force Connect
              </Button>
            )}

            <Button variant="outlined" color="warning" onClick={handleSignOut}>
              Sign Out
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          className="App"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <Typography variant="h4" gutterBottom>
            Endpoint Metrics {/* Replace with your actual app name */}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Please sign in to continue
          </Typography>
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login with Microsoft
          </Button>
        </Box>
      )}
    </div>
  );
}

export default App;
