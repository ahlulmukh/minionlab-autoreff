const readline = require("readline");
const chalk = require("chalk");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

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
  logMessage,
  rl,
};
