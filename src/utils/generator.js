class EmailGenerator {
  constructor(baseEmail) {
    this.baseEmail = baseEmail;
  }

  generatePlusVariations() {
    const [username, domain] = this.baseEmail.split("@");
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${username}+${randomString}@${domain}`;
  }

  generateRandomVariation() {
    return this.generatePlusVariations();
  }
}

function generateRandomPassword(length = 12) {
  const firstLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  const otherLetters = Array.from({ length: 4 }, () =>
    String.fromCharCode(Math.floor(Math.random() * 26) + 97)
  ).join("");
  const numbers = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `${firstLetter}${otherLetters}@${numbers}!`;
}

module.exports = { EmailGenerator, generateRandomPassword };
