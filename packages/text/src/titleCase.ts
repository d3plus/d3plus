import textSplit from "./textSplit.js";

const lowercase: string[] = [
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "if",
  "in",
  "into",
  "near",
  "nor",
  "of",
  "on",
  "onto",
  "or",
  "per",
  "that",
  "the",
  "to",
  "with",
  "via",
  "vs",
  "vs.",
];
const acronyms: string[] = [
  "CEO",
  "CFO",
  "CNC",
  "COO",
  "CPU",
  "GDP",
  "HVAC",
  "ID",
  "IT",
  "R&D",
  "TV",
  "UI",
];
const uppercase: string[] = acronyms.reduce(
  (arr: string[], d: string) => (arr.push(`${d}s`), arr),
  acronyms.map(d => d.toLowerCase()),
);

/**
    @function titleCase
    @desc Capitalizes the first letter of each word in a phrase/sentence, accounting for words in English that should be kept lowercase such as "and" or "of", as well as acronym that should be kept uppercase such as "CEO" or "TVs".
    @param {String} str The string to apply the title case logic.
*/
export default function (str: string | undefined): string {
  if (str === undefined) return "";

  return textSplit(str).reduce((str: string, word: string, i: number) => {
    let formattedWord = word;
    const trimmedWord = word.toLowerCase().slice(0, -1);

    const exempt =
      uppercase.includes(trimmedWord) ||
      (lowercase.includes(trimmedWord) &&
        i !== 0 &&
        word.toLowerCase() !== trimmedWord);
    if (!exempt) formattedWord = word.charAt(0).toUpperCase() + word.slice(1);

    return str + formattedWord;
  }, "");
}
