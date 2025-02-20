const { prompt, logMessage, rl } = require("./utils/logger");
const StreamAiAutoReff = require("./classes/StreamAiAutoReff");
const { generateRandomPassword } = require("./utils/generator");
const { getRandomProxy, loadProxies } = require("./classes/proxy");
const chalk = require("chalk");
const fs = require("fs");

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

  const refCode = await prompt(chalk.yellow("Enter Referral Code: "));
  const count = parseInt(await prompt(chalk.yellow("How many do you want?")));

  const proxiesLoaded = loadProxies();
  if (!proxiesLoaded) {
    logMessage(null, null, "No Proxy. Using default IP", "warning");
  }
  let successful = 0;
  let attempt = 1;

  const accountsStream = fs.createWriteStream("accounts.txt", { flags: "a" });
  const accountsBot = fs.createWriteStream("accountsBot.txt", { flags: "a" });

  try {
    while (successful < count) {
      console.log(chalk.white("-".repeat(85)));
      const currentProxy = await getRandomProxy(successful + 1, count);
      const generator = new StreamAiAutoReff(
        refCode,
        currentProxy,
        successful + 1,
        count
      );
      try {
        const email = generator.generateTempEmail();
        const password = generateRandomPassword();
        const emailSent = await generator.sendEmailCode(email);
        if (!emailSent) continue;

        const account = await generator.registerAccount(email, password);

        if (account) {
          accountsStream.write(`Email: ${email}\n`);
          accountsStream.write(`Password: ${password}\n`);
          accountsStream.write(`Reff To: ${refCode}\n`);
          accountsStream.write("-".repeat(85) + "\n");
          accountsBot.write(`${email}:${password}\n`);
          successful++;
          logMessage(successful, count, "Akun Berhasil Dibuat!", "success");
          logMessage(successful, count, `Email: ${email}`, "success");
          logMessage(successful, count, `Password: ${password}`, "success");
          logMessage(successful, count, `Reff To: ${refCode}`, "success");
          attempt = 1;
        } else {
          logMessage(
            successful + 1,
            count,
            "Register Account Failed, retrying...",
            "error"
          );
          attempt++;
        }
      } catch (error) {
        logMessage(
          successful + 1,
          count,
          `Error: ${error.message}, retrying...`,
          "error"
        );
        attempt++;
      }
    }
  } finally {
    accountsStream.end();
    accountsBot.end();
    console.log(chalk.magenta("\n[*] Dono bang!"));
    console.log(
      chalk.green(`[*] Account dono ${successful} dari ${count} akun`)
    );
    console.log(chalk.magenta("[*] Result in accounts.txt"));
    rl.close();
  }
}

main();
