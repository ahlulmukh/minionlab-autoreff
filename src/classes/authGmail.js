const { ImapFlow } = require("imapflow");
const path = require("path");
const fs = require("fs");
const configPath = path.resolve(__dirname, "../json/config.json");
const config = JSON.parse(fs.readFileSync(configPath));
const confEmail = config.email;
const pass = config.password;

async function authorize() {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: confEmail,
      pass: pass,
    },
    logger: false,
  });

  try {
    await client.connect();
    return client;
  } catch (err) {
    console.error("Error connecting to IMAP server", err);
    throw err;
  }
}

module.exports = { authorize };
