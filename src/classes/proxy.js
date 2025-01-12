const { HttpsProxyAgent } = require("https-proxy-agent");
const chalk = require("chalk");
const fs = require("fs");
const axios = require("axios");
let proxyList = [];
let axiosConfig = {};

function getProxyAgent(proxyUrl) {
  try {
    const isSocks = proxyUrl.toLowerCase().startsWith("socks");
    if (isSocks) {
      const { SocksProxyAgent } = require("socks-proxy-agent");
      return new SocksProxyAgent(proxyUrl);
    }
    return new HttpsProxyAgent(
      proxyUrl.startsWith("http") ? proxyUrl : `http://${proxyUrl}`
    );
  } catch (error) {
    console.log(chalk.red(`[!] Error creating proxy agent: ${error.message}`));
    return null;
  }
}

function loadProxies() {
  try {
    const proxyFile = fs.readFileSync("proxy.txt", "utf8");
    proxyList = proxyFile
      .split("\n")
      .filter((line) => line.trim())
      .map((proxy) => {
        proxy = proxy.trim();
        if (!proxy.includes("://")) {
          return `http://${proxy}`;
        }
        return proxy;
      });

    if (proxyList.length === 0) {
      throw new Error("No proxies found in proxies.txt");
    }
    console.log(
      chalk.green(`✓ Loaded ${proxyList.length} proxies from proxies.txt`)
    );
    return true;
  } catch (error) {
    console.error(chalk.red(`[!] Error loading proxies: ${error.message}`));
    return false;
  }
}

async function checkIP() {
  try {
    const response = await axios.get(
      "https://api.ipify.org?format=json",
      axiosConfig
    );
    const ip = response.data.ip;
    console.log(chalk.green(`[+] Ip Using: ${ip}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`[!] Failed to get IP: ${error.message}`));
    return false;
  }
}

async function getRandomProxy() {
  if (proxyList.length === 0) {
    axiosConfig = {};
    await checkIP();
    return null;
  }

  let proxyAttempt = 0;
  while (proxyAttempt < proxyList.length) {
    const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    try {
      const agent = getProxyAgent(proxy);
      if (!agent) continue;

      axiosConfig.httpsAgent = agent;
      await checkIP();
      return proxy;
    } catch (error) {
      proxyAttempt++;
    }
  }

  console.log(chalk.red("[!] Using default IP"));
  axiosConfig = {};
  await checkIP();
  return null;
}

module.exports = {
  getProxyAgent,
  loadProxies,
  getRandomProxy,
};
