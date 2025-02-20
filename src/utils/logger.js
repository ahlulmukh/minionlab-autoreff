const readline = require("readline");
const chalk = require("chalk");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

function logMessage(
  currentNum = null,
  total = null,
  message = "",
  messageType = "info"
) {
  const now = new Date();
  const timestamp = now
    .toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\./g, ":")
    .replace(/, /g, " ");
  const accountStatus = currentNum && total ? `[${currentNum}/${total}] ` : "";

  const colors = {
    info: chalk.white,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    process: chalk.cyan,
    debug: chalk.blue,
  };

  const emojis = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warning: "⚠️",
    process: "🔄",
    debug: "🐞",
  };

  const logColor = colors[messageType] || chalk.white;
  const emoji = emojis[messageType] || "❓";

  let logText = logColor(`${emoji} ${message}`);

  console.log(
    `${chalk.white("[")}${chalk.dim(timestamp)}${chalk.white(
      "]"
    )} ${accountStatus}${logText}`
  );
}

module.exports = {
  prompt,
  logMessage,
  rl,
};
