import formatAbbreviate from "./formatAbbreviate.js";

/** English ordinal suffixes, by `Intl.PluralRules` ordinal category. */
const englishSuffixes: Record<string, string> = {
  one: "st",
  two: "nd",
  few: "rd",
  other: "th",
};

/** Ordinal forms by language (the locale's first subtag). */
const ordinals: Record<string, (n: number) => string> = {
  en: n => {
    const rule = new Intl.PluralRules("en", {type: "ordinal"}).select(n);
    return `${n}${englishSuffixes[rule] ?? "th"}`;
  },
  es: n => `${n}.º`,
  et: n => `${n}.`,
  fr: n => (n === 1 ? "1er" : `${n}e`),
  pt: n => `${n}º`,
  zh: n => `第${n}`,
};

/**
    Formats a whole number as an ordinal for the given locale (`1` to
    `"1st"` in English, `"1.º"` in Spanish, `"1º"` in Portuguese, `"第1"` in
    Chinese). A language without an ordinal form (such as Arabic) reads the
    plain number, and a number that isn't whole is formatted with
    `formatAbbreviate`.
    @param n The number to be formatted.
    @param locale The locale, as a language-region tag (`"es-ES"`) or a 2-letter language code (`"es"`).
*/
export default function formatOrdinal(
  n: number,
  locale: string = "en-US",
): string {
  if (!Number.isInteger(n)) return formatAbbreviate(n, locale);
  const tag = typeof locale === "string" ? locale : "en-US";
  const form = ordinals[tag.split(/[-_]/)[0].toLowerCase()];
  return form ? form(n) : `${n}`;
}
