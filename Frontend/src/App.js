import React, { useEffect, useState, useRef } from "react";
import { Typography, Box } from "@mui/material";
import styled from "styled-components";
import Siriwave from "react-siriwave";
import "./App.css";
import "@fontsource/poppins"; // Defaults to weight 400
import "@fontsource/poppins/400.css"; // Specify weight
import "@fontsource/poppins/500.css"; // Specify additional weights if needed
import "@fontsource/poppins/700.css"; // Specify additional weights if needed
import base64Image from "./imageScript";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [monitoringStatus, setMonitoringStatus] = useState(false);

  const [connectionStatusBoolean, setConnectionStatusBoolean] = useState(false);
  const StyledImage = styled.img`
    height: 80px;
  `;

  const startMonitoring = async () => {
    window.electron.send("start-monitoring");
    setMonitoringStatus(true);
  };

  const checkConnection = async () => {
    const status = await window.electron.invoke("check-connection");
    if (status === "Live") {
      console.log(status);
      setConnectionStatusBoolean(true);
      setConnectionStatus("Live");
    } else {
      setConnectionStatusBoolean(false);
      setConnectionStatus("Connecting ...");
    }
    console.log("Connection status:", status);
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkConnection();
    }

    const intervalId = setInterval(checkConnection, 12000);

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
        <>
          <div className="Main-container">
            <div
              className="Constant"
              style={{ margin: "auto", marginLeft: "50px" }}
            >
              <StyledImage src={base64Image} alt="Ezaix Logo" />
              <Typography
                variant="h6"
                gutterBottom
                style={{ fontFamily: "Poppins" }}
                textAlign={"center"}
              >
                Endpoint Agent
              </Typography>
            </div>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height={"100%"}
              style={{ padding: "0 70px", fontFamily: "Poppins" }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                style={{ fontFamily: "Poppins" }}
              >
                {connectionStatus == "Live" ? (
                  <>
                    Connection : {"  "}
                    <span className="status-dot"></span>
                    {"  "}
                    {connectionStatus}
                  </>
                ) : (
                  <>
                    <span className="status-dot-offline"></span>
                    {"  "}
                    {connectionStatus}
                  </>
                )}
              </Typography>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {monitoringStatus ? (
                  <button
                    className="button stop-button"
                    onClick={handleStopMonitoring}
                  >
                    Stop Monitoring
                  </button>
                ) : (
                  <button
                    className="button start-button"
                    onClick={startMonitoring}
                  >
                    Start Monitoring
                  </button>
                )}
                {connectionStatus !== "Live" && (
                  <button
                    className="button force-connect-button"
                    onClick={checkConnection}
                  >
                    Force Connect
                  </button>
                )}

                <button
                  className="button sign-out-button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </Box>
          </div>
          <Siriwave
            height={100}
            width={window.innerWidth}
            theme="ios9"
            speed={0.2}
            amplitude={2.5}
            frequency={4.5}
            color="#fff"
          />
        </>
      ) : (
        <>
          <div
            className="Constant"
            style={{
              margin: "auto",
              textAlign: "center",
              paddingTop: "70px",
              height: "100vh",
            }}
          >
            <div>
              <StyledImage src={base64Image} alt="Ezaix Logo" />
            </div>
            <Typography
              variant="h6"
              gutterBottom
              style={{
                fontFamily: "Poppins",
                color: "grey",
              }}
              textAlign={"center"}
            >
              Endpoint Agent
            </Typography>
            <button className="button login-button" onClick={handleLogin}>
              Sign In
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
