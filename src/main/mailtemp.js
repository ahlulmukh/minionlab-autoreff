import { faker } from "@faker-js/faker";
import { logMessage } from "../utils/logger.js";

export default class MailTempManager {
  constructor(makeRequestFunction, currentNum, total) {
    this.makeRequest = makeRequestFunction;
    this.currentNum = currentNum;
    this.total = total;
  }

  async getRandomDomain() {
    logMessage(
      this.currentNum,
      this.total,
      "Trying to get a random domain...",
      "process"
    );
    const vowels = "aeiou";
    const consonants = "bcdfghjklmnpqrstvwxyz";
    const keyword =
      consonants[Math.floor(Math.random() * consonants.length)] +
      vowels[Math.floor(Math.random() * vowels.length)];
    try {
      const response = await this.makeRequest(
        "GET",
        `https://generator.email/search.php?key=${keyword}`
      );

      if (!response) {
        logMessage(
          this.currentNum,
          this.total,
          "No response from API",
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
          `Selected domain: ${selectedDomain}`,
          "success"
        );
        return selectedDomain;
      }

      logMessage(
        this.currentNum,
        this.total,
        "Could not find valid domain",
        "error"
      );
      return null;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `Error getting random domain: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async generateEmail(domain) {
    logMessage(
      this.currentNum,
      this.total,
      "Trying to generate email...",
      "process"
    );

    const firstname = faker.person.firstName().toLowerCase();
    const lastname = faker.person.lastName().toLowerCase();
    const randomNums = Math.floor(Math.random() * 900 + 100).toString();

    const separator = Math.random() > 0.5 ? "" : ".";
    const email = `${firstname}${separator}${lastname}${randomNums}@${domain}`;

    logMessage(
      this.currentNum,
      this.total,
      `Generated email: ${email}`,
      "success"
    );
    return email;
  }

  async getCodeVerification(email, domain) {
    logMessage(
      this.currentNum,
      this.total,
      "Trying to get verification code...",
      "process"
    );

    const cookies = {
      embx: `%22${email}%22`,
      surl: `${domain}/${email.split("@")[0]}`,
    };

    const headers = {
      Cookie: Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; "),
    };

    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logMessage(
        this.currentNum,
        this.total,
        `Attempt ${attempt} Checking for verification code...`,
        "process"
      );

      try {
        const response = await this.makeRequest(
          "GET",
          "https://generator.email/inbox1/",
          { headers: headers }
        );

        if (!response || !response.data) {
          logMessage(
            this.currentNum,
            this.total,
            "No response from email server",
            "warning"
          );
          continue;
        }

        const emailText = response.data;

        const matches = [
          ...emailText.matchAll(
            /<span[^>]*background-color:\s*#007BFF[^>]*>([A-Z0-9])<\/span>/g
          ),
        ];

        if (matches.length >= 6) {
          const code = matches
            .slice(0, 6)
            .map((m) => m[1])
            .join("");
          logMessage(
            this.currentNum,
            this.total,
            `Verification Code Found : ${code}`,
            "success"
          );
          return code;
        }

        logMessage(
          this.currentNum,
          this.total,
          "Verification code not found, retrying...",
          "warning"
        );
      } catch (error) {
        logMessage(
          this.currentNum,
          this.total,
          `Error getting verification code: ${error.message}`,
          "error"
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    logMessage(
      this.currentNum,
      this.total,
      "Failed to retrieve active code after maximum attempts",
      "error"
    );
    return null;
  }
}
