import chalk from "chalk";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

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
    info: chalk.blueBright,
    success: chalk.greenBright,
    error: chalk.redBright,
    warning: chalk.yellowBright,
    process: chalk.cyanBright,
    debug: chalk.blue,
  };

  const emojis = {
    info: "[i]",
    success: "[✓]",
    error: "[-]",
    warning: "[!]",
    process: "[>]",
    debug: "[*]",
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

export { logMessage, prompt, rl };
