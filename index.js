const axios = require("axios");
const cheerio = require("cheerio");
const chalk = require("chalk");
const readline = require("readline");
const fs = require("fs");
const { faker } = require("@faker-js/faker");
const UserAgent = require("user-agents");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

function loadProxies() {
  try {
    const proxies = fs
      .readFileSync("proxy.txt", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((proxy) => (!proxy.startsWith("http") ? `http://${proxy}` : proxy));

    if (proxies.length) {
      console.log(chalk.green(`Loaded ${proxies.length} proxies\n`));
    }
    return proxies;
  } catch (err) {
    console.log(chalk.yellow("proxy.txt not found, running without proxies\n"));
    return [];
  }
}

function getRandomProxy(proxies) {
  return proxies.length
    ? proxies[Math.floor(Math.random() * proxies.length)]
    : null;
}

function logMessage(
  accountNum = null,
  total = null,
  message = "",
  messageType = "info"
) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const accountStatus = accountNum && total ? `${accountNum}/${total}` : "";

  const colors = {
    info: chalk.white,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    process: chalk.cyan,
    debug: chalk.magenta,
  };

  const logColor = colors[messageType] || chalk.white;
  console.log(
    `${chalk.white("[")}${chalk.dim(timestamp)}${chalk.white("]")} ` +
      `${chalk.white("[")}${chalk.yellow(accountStatus)}${chalk.white("]")} ` +
      `${logColor(message)}`
  );
}

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

async function main() {
  console.log(
    chalk.cyan(`
░█▀▀░▀█▀░█▀▄░█▀▀░█▀█░█▄█░░░█▀█░▀█▀░░░█▀▄░█▀▀░█▀▀░█▀▀
░▀▀█░░█░░█▀▄░█▀▀░█▀█░█░█░░░█▀█░░█░░░░█▀▄░█▀▀░█▀▀░█▀▀
░▀▀▀░░▀░░▀░▀░▀▀▀░▀░▀░▀░▀░░░▀░▀░▀▀▀░░░▀░▀░▀▀▀░▀░░░▀░░
                By : El Puqus Airdrop
                github.com/ahlulmukh
  `)
  );

  const refCode = await prompt(chalk.yellow("Masukan Referral Code: "));
  const count = parseInt(await prompt(chalk.yellow("Mau berapa banyak?: ")));

  const proxies = loadProxies();
  let successful = 0;

  const accountsStream = fs.createWriteStream("accounts.txt", { flags: "a" });
  const accountsBot = fs.createWriteStream("accountsBot.txt", { flags: "a" });

  for (let i = 0; i < count; i++) {
    console.log(chalk.white("-".repeat(85)));
    logMessage(i + 1, count, "Proses Boskuuu", "debug");

    const currentProxy = getRandomProxy(proxies);
    const generator = new StreamAiAutoReff(refCode, currentProxy);

    try {
      const domain = await generator.getRandomDomain();
      if (!domain) continue;

      const email = generator.generateEmail(domain);
      const password = faker.internet.password(12);

      const emailSent = await generator.sendEmailCode(email);
      if (!emailSent) continue;

      const account = await generator.registerAccount(email, password, domain);

      if (account) {
        accountsStream.write(`Email: ${email}\n`);
        accountsStream.write(`Password: ${password}\n`);
        accountsStream.write(`Reff To: ${refCode}\n`);
        accountsStream.write("-".repeat(85) + "\n");
        accountsBot.write(`${email}:${password}\n`);

        successful++;
        logMessage(i + 1, count, "Akun Berhasil Dibuat!", "success");
        logMessage(i + 1, count, `Email: ${email}`, "success");
        logMessage(i + 1, count, `Password: ${password}`, "success");
        logMessage(i + 1, count, `Reff To: ${refCode}`, "success");
      } else {
        logMessage(i + 1, count, "Gagal Membuat Akun", "error");
        if (generator.proxy) {
          logMessage(i + 1, count, `Failed proxy: ${generator.proxy}`, "error");
        }
      }
    } catch (error) {
      logMessage(i + 1, count, `Error: ${error.message}`, "error");
    }
  }

  accountsStream.end();
  accountsBot.end();

  console.log(chalk.magenta("\n[*] Selesai!"));
  console.log(
    chalk.green(
      `[*] Akun yang berhasil dibuat ${successful} out of ${count} accounts`
    )
  );
  console.log(
    chalk.magenta("[*] Hasil disimpan di accounts.txt dan accountsBot.txt")
  );
  rl.close();
}

main().catch((err) => console.error(err));
