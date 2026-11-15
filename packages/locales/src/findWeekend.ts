import findLocale from "./findLocale.js";

// CLDR week data (supplemental weekData weekendStart/weekendEnd): regions
// whose weekend isn't Saturday and Sunday.
const weekends: Record<string, number[]> = {};
const add = (regions: string, days: number[]) =>
  regions.split(" ").forEach(region => (weekends[region] = days));
add("AE BH DZ EG IL IQ JO KW LY OM QA SA SD SY YE", [5, 6]);
add("AF", [4, 5]);
add("IR", [5]);
add("IN UG", [0]);

/** The 2-letter region subtag of a locale tag, upper-cased, if it has one. */
function regionOf(tag: string): string | undefined {
  return tag
    .split(/[-_]/)
    .slice(1)
    .find(part => /^[A-Za-z]{2}$/.test(part))
    ?.toUpperCase();
}

/**
    Returns the days of the weekend (0 = Sunday … 6 = Saturday) in a locale's region, per CLDR: `"en-US"` → `[6, 0]`, `"ar-SA"` → `[5, 6]`, `"fa-IR"` → `[5]`. Accepts the same forms as `findWeekStart`: `"en-US"`, `"en_US"`, script tags like `"sr-Latn-RS"`, and 2-letter language codes, which resolve to their default region through `findLocale` (`"ar"` → `"ar-SA"` → `[5, 6]`). A locale whose region can't be found, or anything that isn't a string, has a Saturday and Sunday weekend.

    Like `findWeekStart`, the region table is static so server-side and browser renders of the same chart agree.
    @param locale A locale code (e.g., "en-US", "ar_SA") or a 2-letter language code (e.g., "ar").
*/
export default function findWeekend(locale: string): number[] {
  if (typeof locale !== "string") return [6, 0];
  let region = regionOf(locale);
  if (!region) {
    const language = locale.split(/[-_]/)[0].toLowerCase();
    if (language) region = regionOf(findLocale(language));
  }
  return (region && weekends[region]?.slice()) || [6, 0];
}
