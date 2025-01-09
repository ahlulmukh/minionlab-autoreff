const readline = require("readline");
const fs = require("fs");
const chalk = require("chalk");

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

module.exports = {
  prompt,
  loadProxies,
  getRandomProxy,
  logMessage,
};
