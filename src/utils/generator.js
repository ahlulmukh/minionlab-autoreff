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
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

module.exports = { EmailGenerator, generateRandomPassword };
