import axios from "axios";
import UserAgent from "user-agents";
import Generator from "../utils/generator.js";
import { logMessage } from "../utils/logger.js";
import MailTempManager from "./mailtemp.js";
import ProxyManager from "./proxy.js";

export default class MinionlabAutoreff {
  constructor(reffCode, proxy = null, currentNum, total) {
    this.proxy = proxy;
    this.currentNum = currentNum;
    this.total = total;
    this.refCode = reffCode;
    this.userAgent = new UserAgent().toString();
    this.proxyManager = new ProxyManager();
    this.generator = new Generator();
  }
  static async create(reffCode, proxy = null, currentNum, total) {
    const instance = new MinionlabAutoreff(reffCode, proxy, currentNum, total);
    await instance.init();
    return instance;
  }

  async init() {
    await this.initAxios();
    this.mailTempManager = new MailTempManager(
      this.makeRequest.bind(this),
      this.currentNum,
      this.total
    );
  }

  async initAxios() {
    this.axios = axios.create({
      httpsAgent: this.proxy
        ? await this.proxyManager.getProxyAgent(
            this.proxy,
            this.currentNum,
            this.total
          )
        : undefined,
      timeout: 120000,
      headers: {
        "User-Agent": new UserAgent().toString(),
        accept: "application/json",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        "content-type": "application/json; charset=UTF-8",
        expires: "0",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Referer: "https://app.minionlab.ai/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  }

  async makeRequest(method, url, config = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.axios({ method, url, ...config });
      } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        logMessage(
          this.currentNum,
          this.total,
          `Request failed: ${error.message}`,
          "error"
        );
        logMessage(
          this.currentNum,
          this.total,
          `Error response data: ${JSON.stringify(errorData, null, 2)}`,
          "error"
        );

        logMessage(
          this.currentNum,
          this.total,
          `Retrying... (${i + 1}/${retries})`,
          "process"
        );
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }
    return null;
  }

  async getRandomDomain() {
    return await this.mailTempManager.getRandomDomain();
  }

  async generateEmail(domain) {
    return await this.mailTempManager.generateEmail(domain);
  }

  async getCodeVerification(email, domain) {
    return await this.mailTempManager.getCodeVerification(email, domain);
  }

  async sendEmailCode(email) {
    logMessage(
      this.currentNum,
      this.total,
      "Sending verification code to email...",
      "process"
    );

    const payload = {
      email: email,
    };

    try {
      const response = await this.makeRequest(
        "POST",
        "https://api.minionlab.ai/web/v1/auth/getEmailCode",
        {
          data: payload,
        }
      );

      if (response.data) {
        logMessage(
          this.currentNum,
          this.total,
          "Email code sent successfully",
          "success"
        );
        return true;
      }
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Error sending email code, message: ${error.message}`,
        "error"
      );
      return null;
    }
  }
  async registerAccount(email, password, code) {
    logMessage(
      this.currentNum,
      this.total,
      "Trying to register account...",
      "process"
    );

    const payload = {
      email: email,
      code: code,
      password: password,
      referralCode: this.refCode,
    };

    try {
      const response = await this.makeRequest(
        "POST",
        "https://api.minionlab.ai/web/v1/auth/emailLogin",
        {
          data: payload,
        }
      );
      if (response.data) {
        logMessage(
          this.currentNum,
          this.total,
          "Account registered",
          "success"
        );
        return response.data;
      } else {
        logMessage(
          this.currentNum,
          this.total,
          "Account not registered",
          "error"
        );
        return null;
      }
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Error register account, message: ${error.message}`,
        "error"
      );
      return null;
    }
  }
  async singleProses() {
    logMessage(
      this.currentNum,
      this.total,
      "Proccesing register account",
      "debug"
    );
    try {
      const domain = await this.getRandomDomain();
      if (!domain) return;
      const email = await this.generateEmail(domain);
      if (!email) return;
      const password = await this.generator.Password();
      const registerResponse = await this.sendEmailCode(email);
      if (!registerResponse) return;
      const code = await this.getCodeVerification(email, domain);
      console.log(code);
      if (!code) return;
      const token = await this.registerAccount(email, password, code);
      if (!token) return;
      return token;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Error proses register, message : ${error.message}`,
        "error"
      );
      return null;
    }
  }
}
