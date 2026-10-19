import findLocale from "./findLocale.js";

// CLDR week data (supplemental weekData firstDay): regions whose weeks start
// on Sunday or Saturday; every other region starts on Monday.
const sundayRegions = new Set(
  (
    "AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE " +
    "KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW " +
    "UM US VE VI WS YE ZA ZW"
  ).split(" "),
);
const saturdayRegions = new Set(
  "AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "),
);

/** The 2-letter region subtag of a locale tag, upper-cased, if it has one. */
function regionOf(tag: string): string | undefined {
  return tag
    .split(/[-_]/)
    .slice(1)
    .find(part => /^[A-Za-z]{2}$/.test(part))
    ?.toUpperCase();
}

/**
    Returns the first day of the week (0 = Sunday … 6 = Saturday) in a locale's region, per CLDR: `"en-US"` → 0, `"de-DE"` → 1, `"ar-EG"` → 6. Accepts the same forms as the rest of d3plus: `"en-US"`, `"en_US"`, script tags like `"sr-Latn-RS"`, and 2-letter language codes, which resolve to their default region through `findLocale` (`"en"` → `"en-US"` → 0, `"ar"` → `"ar-SA"` → 0). A locale whose region can't be found, or anything that isn't a string, starts on Monday (1).

    The region table is static on purpose: `Intl.Locale` week info differs across Node 22, Node 24, and browsers, so reading it at runtime would make server-side and browser renders of the same chart disagree.
    @param locale A locale code (e.g., "en-US", "de_DE") or a 2-letter language code (e.g., "en").
*/
export default function findWeekStart(locale: string): number {
  if (typeof locale !== "string") return 1;
  let region = regionOf(locale);
  if (!region) {
    const language = locale.split(/[-_]/)[0].toLowerCase();
    if (language) region = regionOf(findLocale(language));
  }
  if (!region) return 1;
  if (sundayRegions.has(region)) return 0;
  if (saturdayRegions.has(region)) return 6;
  return 1;
}
