import chalk from "chalk";
import fs from "fs";
import MinionlabAutoreff from "./main/minionlabAutoreff.js";
import ProxyManager from "./main/proxy.js";
import { logMessage, prompt, rl } from "./utils/logger.js";

async function main() {
  console.log(
    chalk.cyan(`
░█▀█░█▀█░█░█░█▀█░█▀▄░█▀█
░█░█░█░█░▀▄▀░█▀█░█░█░█▀█
░▀░▀░▀▀▀░░▀░░▀░▀░▀▀░░▀░▀
    By : El Puqus Airdrop
    github.com/ahlulmukh
  `)
  );

  const count = parseInt(await prompt(chalk.yellow("How many do you want? ")));
  const refCode = await prompt(chalk.yellow("Enter your referral code? "));

  const proxyManager = new ProxyManager();
  const proxiesLoaded = proxyManager.loadProxies();
  if (!proxiesLoaded) {
    logMessage(null, null, "No Proxy. Using default IP", "warning");
  }

  const apikey = fs.createWriteStream("proxyfile.txt", { flags: "a" });
  let successful = 0;
  let attempt = 1;

  try {
    while (successful < count) {
      console.log(chalk.white("-".repeat(85)));
      const currentProxy = await proxyManager.getRandomProxy(
        successful + 1,
        count
      );
      const scrape = await MinionlabAutoreff.create(
        refCode,
        currentProxy,
        successful + 1,
        count
      );
      try {
        const account = await scrape.singleProses();

        if (account) {
          // apikey.write(
          //   `${account.username}-zone-unblock-region-us:${account.password}@super.novada.pro:7777\n`
          // );
          successful++;
          // logMessage(
          //   successful,
          //   count,
          //   `Apikey : ${account.username}`,
          //   "success"
          // );
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
    apikey.end();
    console.log(chalk.magenta("\n[*] Dono bang!"));
    console.log(
      chalk.green(`[*] Account dono ${successful} dari ${count} akun`)
    );
    console.log(chalk.magenta("[*] Result in proxyfile.txt"));
    rl.close();
  }
}

main();
