const axios = require("axios");
const { google } = require("googleapis");
const { logMessage } = require("../utils/logger");
const { getProxyAgent } = require("./proxy");
const { EmailGenerator } = require("../utils/generator");
const fs = require("fs");
const path = require("path");
const TOKEN_PATH = path.join(__dirname, "../json/token.json");
const confEmail = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../json/client_secret.json"))
).email;

function loadOAuth2Client() {
  const credentials = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../json/client_secret.json"))
  );
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

class StreamAiAutoReff {
  constructor(refCode, proxy = null) {
    this.refCode = refCode;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy) }),
      timeout: 60000,
    };
    this.gmailClient = google.gmail({
      version: "v1",
      auth: loadOAuth2Client(),
    });
    this.baseEmail = confEmail;
  }

  async makeRequest(method, url, config = {}) {
    try {
      const response = await axios({
        method,
        url,
        ...this.axiosConfig,
        ...config,
      });
      return response;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Request failed: ${error.message}`,
        "error"
      );
      if (this.proxy) {
        logMessage(
          this.currentNum,
          this.total,
          `Failed proxy: ${this.proxy}`,
          "error"
        );
      }
      return null;
    }
  }

  generateTempEmail() {
    const emailGenerator = new EmailGenerator(this.baseEmail);
    const tempEmail = emailGenerator.generateRandomVariation();
    logMessage(
      this.currentNum,
      this.total,
      `Email dibuat: ${tempEmail}`,
      "success"
    );
    return tempEmail;
  }

  async sendEmailCode(email) {
    logMessage(
      this.currentNum,
      this.total,
      "mengirim code ke email...",
      "process"
    );
    const headers = {
      accept: "*/*",
      "content-type": "application/json;charset=UTF-8",
      Origin: "https://app.allstream.ai",
      Referer: "https://app.allstream.ai",
    };
    const response = await this.makeRequest(
      "POST",
      "https://api.allstream.ai/web/v1/auth/getEmailCode",
      { headers, data: { email } }
    );
    if (!response) return false;
    logMessage(this.currentNum, this.total, "Email tersedia", "success");
    return true;
  }

  async getCodeVerification(tempEmail) {
    logMessage(
      this.currentNum,
      this.total,
      "Menunggu kode verifikasi...",
      "process"
    );

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      logMessage(
        this.currentNum,
        this.total,
        `Percobaan ${attempt + 1}`,
        "process"
      );
      const messages = await this.gmailClient.users.messages.list({
        userId: "me",
        q: `to:${tempEmail}`,
      });

      if (messages.data.messages && messages.data.messages.length > 0) {
        const messageId = messages.data.messages[0].id;
        const message = await this.gmailClient.users.messages.get({
          userId: "me",
          id: messageId,
        });

        const snippet = message.data.snippet;
        const codeMatch = snippet.match(
          /Your verification code is: (\d\s\d\s\d\s\d)/
        );
        if (codeMatch) {
          const verificationCode = codeMatch[1].replace(/\s/g, "");
          logMessage(
            this.currentNum,
            this.total,
            `Kode Verifikasi ditemukan: ${verificationCode}`,
            "success"
          );
          return verificationCode;
        }
      }

      logMessage(
        this.currentNum,
        this.total,
        "Kode belum tersedia. Menunggu 5 detik sebelum mencoba lagi...",
        "warning"
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    logMessage(
      this.currentNum,
      this.total,
      "Gagal mendapatkan kode verifikasi setelah beberapa percobaan.",
      "error"
    );
    return null;
  }

  async registerAccount(email, password) {
    logMessage(this.currentNum, this.total, "Mendaftar Akun...", "process");

    const verifyCode = await this.getCodeVerification(email);
    if (!verifyCode) {
      logMessage(
        this.currentNum,
        this.total,
        "Gagal mendapatkan kode verifikasi. Registrasi dibatalkan.",
        "error"
      );
      return null;
    }

    const headers = {
      accept: "*/*",
      "content-type": "application/json;charset=UTF-8",
      Origin: "https://app.allstream.ai",
      Referer: "https://app.allstream.ai",
    };

    const registerData = {
      email: email,
      code: verifyCode,
      password: password,
      referralCode: this.refCode,
    };

    const response = await this.makeRequest(
      "POST",
      "https://api.allstream.ai/web/v1/auth/emailLogin",
      {
        headers,
        data: registerData,
      }
    );

    if (!response) {
      logMessage(this.currentNum, this.total, "Gagal Daftar", "error");
      return null;
    }

    logMessage(this.currentNum, this.total, "Daftar akun berhasil", "success");

    return response.data;
  }
}

module.exports = StreamAiAutoReff;
