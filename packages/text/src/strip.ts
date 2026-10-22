/** Letters that don't decompose into an ASCII letter plus accents. */
const special: Record<string, string> = {
  Æ: "AE",
  æ: "ae",
  ß: "B",
  Ð: "D",
  Þ: "D",
  þ: "D",
  ð: "d",
  Ø: "O",
  ø: "o",
  "×": "x",
};

/**
    Removes all non ASCII characters from a string.
    @param value The HTML string to strip.
    @param spacer The character to replace whitespace with.
*/
export default function (value: string, spacer: string = "-"): string {
  return `${value}`.replace(/[^A-Za-z0-9\-_ء-ي]/g, (char: string) => {
    if (char === " ") return spacer;
    if (special[char]) return special[char];
    // An accented letter keeps its base letter (é → e).
    const base = char.normalize("NFD").replace(/\p{M}/gu, "");
    return /^[A-Za-z]$/.test(base) ? base : "";
  });
}
