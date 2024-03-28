const { app, BrowserWindow, ipcMain, net } = require("electron");
const querystring = require("querystring");
const Store = require("electron-store");
const store = new Store();
const axios = require("axios");
const path = require("path");

async function fetchTenantId(accessToken) {
  try {
    const response = await axios.get(
      "https://graph.microsoft.com/v1.0/organization?$select=id",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data && response.data.value.length > 0) {
      const tenantId = response.data.value[0].id;
      store.set("tenantId", tenantId); // Store the tenant ID securely
      console.log("Tenant ID:", tenantId);
    }
  } catch (error) {
    console.error("Error fetching tenant ID:", error.message);
  }
}

async function fetchUserDetails(accessToken) {
  try {
    const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data) {
      const { displayName, id: userId, userPrincipalName } = response.data;
      store.set("userDetails", { displayName, userId, userPrincipalName }); // Store user details securely
      console.log("User Details:", { displayName, userId, userPrincipalName });
    }
  } catch (error) {
    console.error("Error fetching user details:", error.message);
  }
}

async function registerApplication(
  userPrincipalName,
  accessToken,
  tenantId,
  webContents
) {
  const apiUrl = new URL(
    "https://20.197.2.222/backend/endpointMetrics/Register"
  );
  apiUrl.searchParams.append("userPrincipalName", userPrincipalName);
  apiUrl.searchParams.append("MStoken", accessToken);
  apiUrl.searchParams.append("tenantid", tenantId);

  try {
    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.Data && data.Data.appId && data.Data.clientSecret) {
      // Store the appId and clientSecret in the Electron store
      store.set("appId", data.Data.appId);
      store.set("clientSecret", data.Data.clientSecret);

      console.log(data.Data.appId, data.Data.clientSecret);

      webContents.send("registration-success", {
        appId: data.Data.appId,
        clientSecret: data.Data.clientSecret,
      });
    }
  } catch (error) {
    console.error("Error registering application:", error);
    webContents.send("registration-error", error.message);
  }
}

async function exchangeCodeForTokens(code, webContents) {
  const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const params = new URLSearchParams();
  params.append("client_id", "d3385247-0b3f-410a-8f8f-2bfdb3b245b9");
  params.append("scope", "openid profile User.Read");
  params.append("code", code);
  params.append("redirect_uri", "myapp://auth");
  params.append("grant_type", "authorization_code");

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.data) {
      const { access_token, refresh_token } = response.data;

      // Fetch tenant ID and user details
      await fetchTenantId(access_token);
      await fetchUserDetails(access_token);

      // Register the application with your local server
      const tenantId = store.get("tenantId");
      const userDetails = store.get("userDetails");
      if (tenantId && userDetails) {
        registerApplication(
          userDetails.userPrincipalName,
          access_token,
          tenantId,
          webContents
        );
      }
    }
  } catch (error) {
    console.error(
      "Token exchange error:",
      error.response ? error.response.data : error.message
    );
    webContents.send(
      "login-error",
      "Failed to exchange authorization code for tokens."
    );
  }
}

module.exports = { exchangeCodeForTokens };
