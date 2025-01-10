const fs = require("fs");
const readline = require("readline");
const path = require("path");
const express = require("express");
const { google } = require("googleapis");
const credentials = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../json/client_secret.json"))
);
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];
const TOKEN_PATH = path.join(__dirname, "../json/token.json");
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url:", authUrl);

    const app = express();

    app.get("/oauth2callback", (req, res) => {
      const code = req.query.code;
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("Error retrieving access token", err);
          res.status(500).send("Authentication failed");
          return reject(err);
        }
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        res.send("Authentication successful! You can close this window.");
        resolve(oAuth2Client);
        server.close();
      });
    });

    const server = app.listen(3000, () => {
      console.log("Listening on port 3000 for OAuth2 callback");
    });
  });
}

async function authorize() {
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (err) {
    return await getAccessToken();
  }
}

module.exports = { authorize };
