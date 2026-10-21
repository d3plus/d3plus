import localeTags from "./localeTags.js";

/**
    Converts a 2-letter language code into a full language-region locale string (e.g., "en" to "en-US").
    @param locale A 2-letter language code (e.g., "en", "fr").
*/
export default function findLocale(locale: string): string {
  if (typeof locale !== "string" || locale.length === 5) return locale;
  return Object.hasOwn(localeTags, locale) ? localeTags[locale] : locale;
}
