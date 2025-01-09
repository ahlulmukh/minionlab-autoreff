const axios = require("axios");
const cheerio = require("cheerio");
const { faker } = require("@faker-js/faker");
const UserAgent = require("user-agents");
const { logMessage } = require("../utils");

class StreamAiAutoReff {
  constructor(refCode, proxy = null) {
    this.refCode = refCode;
    this.proxy = proxy;
    this.ua = new UserAgent();
    this.axiosConfig = {
      ...(proxy && {
        proxy: {
          host: new URL(proxy).hostname,
          port: new URL(proxy).port,
          protocol: new URL(proxy).protocol,
        },
      }),
      timeout: 60000,
    };
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

  async getRandomDomain() {
    logMessage(
      this.currentNum,
      this.total,
      "Mencari domain yang tersedia...",
      "process"
    );
    const vowels = "aeiou";
    const consonants = "bcdfghjklmnpqrstvwxyz";
    const keyword =
      consonants[Math.floor(Math.random() * consonants.length)] +
      vowels[Math.floor(Math.random() * vowels.length)];

    const response = await this.makeRequest(
      "GET",
      `https://generator.email/search.php?key=${keyword}`
    );

    if (!response || !response.data) {
      logMessage(
        this.currentNum,
        this.total,
        "Tidak dapat menemukan list domain.",
        "error"
      );
      return null;
    }

    const domains = response.data.filter((d) => /^[\x00-\x7F]*$/.test(d));

    if (domains.length) {
      const selectedDomain =
        domains[Math.floor(Math.random() * domains.length)];
      logMessage(
        this.currentNum,
        this.total,
        `Memilih domain: ${selectedDomain}`,
        "success"
      );
      return selectedDomain;
    }

    logMessage(
      this.currentNum,
      this.total,
      "Tidak dapat mencari domain yang valid",
      "error"
    );
    return null;
  }

  generateEmail(domain) {
    logMessage(
      this.currentNum,
      this.total,
      "Membuat email address...",
      "process"
    );
    const firstName = faker.person.firstName().toLowerCase();
    const lastName = faker.person.lastName().toLowerCase();
    const randomNums = Math.floor(Math.random() * 900 + 100).toString();

    const separator = Math.random() > 0.5 ? "" : ".";
    const email = `${firstName}${separator}${lastName}${randomNums}@${domain}`;
    logMessage(
      this.currentNum,
      this.total,
      `Email dibuat: ${email}`,
      "success"
    );
    return email;
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
      "user-agent": this.ua.toString(),
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

  async getCodeVerification(email, domain) {
    logMessage(this.currentNum, this.total, "Verifikasi Akun...", "process");

    const cookies = {
      embx: `%22${email}%22`,
      surl: `${domain}/${email.split("@")[0]}`,
    };

    const headers = {
      "User-Agent": this.ua.toString(),
      Cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    };

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      logMessage(
        this.currentNum,
        this.total,
        `Mencoba mengambil kode verifikasi... Percobaan ${attempt + 1}`,
        "process"
      );

      const response = await this.makeRequest(
        "GET",
        "https://generator.email/inbox/",
        { headers }
      );

      if (!response || !response.data) {
        logMessage(
          this.currentNum,
          this.total,
          "Gagal mendapatkan respons dari server email generator.",
          "error"
        );
        continue;
      }

      const $ = cheerio.load(response.data);

      const spans = $("div[style='margin: 20px 0'] span");
      const verifyCode = spans
        .map((_, el) => $(el).text().trim())
        .get()
        .join("");

      if (verifyCode) {
        logMessage(
          this.currentNum,
          this.total,
          `Kode Verifikasi ditemukan: ${verifyCode}`,
          "success"
        );
        return verifyCode;
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

  async registerAccount(email, password, domain) {
    logMessage(this.currentNum, this.total, "Mendaftar Akun...", "process");

    const verifyCode = await this.getCodeVerification(email, domain);
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
      "user-agent": this.ua.toString(),
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
