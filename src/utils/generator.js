export default class Generator {
  Password() {
    const firstLetter = String.fromCharCode(
      Math.floor(Math.random() * 26) + 65
    );
    const otherLetters = Array.from({ length: 4 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 97)
    ).join("");
    const numbers = Array.from({ length: 3 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    return `${firstLetter}${otherLetters}@${numbers}!`;
  }
}
