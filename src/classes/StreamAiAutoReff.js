const axios = require("axios");
const { logMessage } = require("../utils/logger");
const { authorize } = require("./authGmail");
const { getProxyAgent } = require("./proxy");
const { simpleParser } = require("mailparser");
const { EmailGenerator } = require("../utils/generator");
const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../json/config.json");
const config = JSON.parse(fs.readFileSync(configPath));
const confEmail = config.email;
class StreamAiAutoReff {
  constructor(refCode, proxy = null, currentNum, total) {
    this.currentNum = currentNum;
    this.total = total;
    this.refCode = refCode;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy) }),
      timeout: 60000,
    };
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
      "Waiting for code verification...",
      "process"
    );
    const client = await authorize();
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      logMessage(
        this.currentNum,
        this.total,
        `Attempt ${attempt + 1}`,
        "process"
      );

      logMessage(
        this.currentNum,
        this.total,
        "Waiting for 10sec...",
        "warning"
      );
      await new Promise((resolve) => setTimeout(resolve, 10000));

      try {
        const lock = await client.getMailboxLock("INBOX");
        try {
          const messages = await client.fetch("1:*", {
            envelope: true,
            source: true,
          });

          for await (const message of messages) {
            if (
              message.envelope.to &&
              message.envelope.to.some((to) => to.address === tempEmail)
            ) {
              const emailSource = message.source.toString();
              const parsedEmail = await simpleParser(emailSource);
              const verificationCode = this.extractVerificationCode(
                parsedEmail.text
              );
              if (verificationCode) {
                logMessage(
                  this.currentNum,
                  this.total,
                  `Verification code found: ${verificationCode}`,
                  "success"
                );
                return verificationCode;
              } else {
                logMessage(
                  this.currentNum,
                  this.total,
                  "No verification code found in the email body.",
                  "warning"
                );
              }
            }
          }
        } finally {
          lock.release();
        }
      } catch (error) {
        console.error("Error fetching emails:", error);
      }

      logMessage(
        this.currentNum,
        this.total,
        "Verification code not found. Waiting for 5 sec...",
        "warning"
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    logMessage(
      this.currentNum,
      this.total,
      "Error get code verification.",
      "error"
    );
    return null;
  }

  extractVerificationCode(emailText) {
    if (!emailText) return null;
    const codeMatch = emailText.match(
      /\b[A-Z0-9] [A-Z0-9] [A-Z0-9] [A-Z0-9] [A-Z0-9] [A-Z0-9]\b/
    );
    return codeMatch ? codeMatch[0].replace(/\s/g, "") : null;
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
