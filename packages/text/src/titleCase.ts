import {titleCaseLocale} from "@d3plus/locales";
import type {TitleCaseRules} from "@d3plus/locales";

import textSplit from "./textSplit.js";

const softHyphen = "­";
// Leading/trailing punctuation & whitespace ignored when matching the word
// lists (so "smith," or "ceo." still match), but `&` is kept (for "R&D").
const edge = /^[^\p{L}\p{N}&]+|[^\p{L}\p{N}&]+$/gu;

// A locale's `lowercase`/`acronyms` arrays compiled into lookup structures,
// memoized per rules object so the common (English) path builds them once.
const cache = new WeakMap<
  TitleCaseRules,
  {lower: Set<string>; upper: Map<string, string>}
>();
function compile(rules: TitleCaseRules) {
  let c = cache.get(rules);
  if (!c) {
    const upper = new Map<string, string>();
    for (const a of rules.acronyms ?? []) {
      const lc = a.toLowerCase();
      upper.set(lc, a);
      upper.set(`${lc}s`, `${a}s`); // plural, e.g. "tvs" -> "TVs"
    }
    c = {lower: new Set(rules.lowercase ?? []), upper};
    cache.set(rules, c);
  }
  return c;
}

// Resolves a locale code (or explicit rules object) to its title-case rules.
// Keyed by language ("en-US" -> "en"); unknown languages fall back to the
// `default` (sentence-case) entry.
function resolveRules(locale: string | TitleCaseRules): TitleCaseRules {
  if (locale && typeof locale === "object") return locale;
  const code = typeof locale === "string" ? locale.toLowerCase() : "";
  return (
    titleCaseLocale[code] ||
    titleCaseLocale[code.slice(0, 2)] ||
    titleCaseLocale.default
  );
}

/**
    Capitalizes the first letter of a word. When the whole input string is
    "shouting" (all caps), the rest of the letters are lowered so "SOUTH"
    becomes "South"; otherwise the body is preserved so genuine mixed-case
    ("McDonald") and unlisted acronyms ("NASA") survive untouched.
*/
function capitalize(word: string, shouting: boolean): string {
  const body = shouting ? word.toLowerCase() : word;
  return body.replace(/\p{L}/u, c => c.toUpperCase());
}

/**
    Capitalizes each significant word of a phrase, normalizing case in both
    directions: the locale's minor words (articles, short conjunctions/
    prepositions) are forced lowercase in the middle and known acronyms are
    forced uppercase — so "SOUTH BY SOUTHWEST" becomes "South by Southwest" and
    "jack smith, ceo" becomes "Jack Smith, CEO". The first and last words are
    always capitalized. The locale supplies the minor-word and acronym lists
    (e.g. "le"/"de"/"par" for French); pass an explicit rules object for full
    control, including `{style: "sentence"}` to capitalize only the first word.
    @param str The string to capitalize.
    @param locale A locale code (e.g. "en-US", "fr-FR") or an explicit rules object. Defaults to "en-US".
*/
export default function (
  str: string | undefined,
  locale: string | TitleCaseRules = "en-US",
): string {
  if (str === undefined) return "";

  const rules = resolveRules(locale);
  const {lower, upper} = compile(rules);
  const title = rules.style !== "sentence";

  // "Shouting" — the input is entirely uppercase (no lowercase letters). Only
  // then do we lower the body of all-caps words; in mixed text an all-caps
  // token is most likely a real acronym and is left as-is.
  const shouting = /\p{Lu}/u.test(str) && !/\p{Ll}/u.test(str);

  const words = textSplit(str);
  const hasLetter = (w: string): boolean => /\p{L}/u.test(w);
  const first = words.findIndex(hasLetter);
  let last = -1;
  for (let i = words.length - 1; i >= 0; i--) {
    if (hasLetter(words[i])) {
      last = i;
      break;
    }
  }

  return words
    .reduce((acc: string, word: string, i: number) => {
      // Continuation of a hyphenated long word (textSplit breaks long words
      // into soft-hyphenated syllables) — it's mid-word, so append untouched.
      if (acc.endsWith(softHyphen)) return acc + word;

      const trail = (word.match(/\s*$/) as RegExpMatchArray)[0];
      const core = trail ? word.slice(0, -trail.length) : word;
      const key = core.toLowerCase().replace(edge, "");

      let out: string;
      if (upper.has(key)) {
        // Re-attach any punctuation that surrounded the matched word.
        const lead = (core.match(/^[^\p{L}\p{N}&]*/u) as RegExpMatchArray)[0];
        const tail = (core.match(/[^\p{L}\p{N}&]*$/u) as RegExpMatchArray)[0];
        out = lead + upper.get(key) + tail;
      } else if (title) {
        out =
          i !== first && i !== last && lower.has(key)
            ? core.toLowerCase()
            : capitalize(core, shouting);
      } else {
        // Sentence style: capitalize the first word; lower the rest only when
        // shouting (otherwise preserve the writer's casing, e.g. proper nouns).
        out = i === first ? capitalize(core, shouting) : shouting ? core.toLowerCase() : core;
      }

      return acc + out + trail;
    }, "")
    .replaceAll(softHyphen, "");
}
