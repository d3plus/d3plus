import {it} from "vitest";
import assert from "assert";
import {default as findWeekend} from "../src/findWeekend.ts";

it("findWeekend follows CLDR regions", () => {
  const expected = {
    "en-US": [6, 0],
    "en-GB": [6, 0],
    "es-ES": [6, 0],
    "pt-BR": [6, 0],
    "zh-CN": [6, 0],
    "ar-SA": [5, 6],
    "ar-EG": [5, 6],
    "he-IL": [5, 6],
    "fa-IR": [5],
    "ps-AF": [4, 5],
    "hi-IN": [0],
  };
  for (const [locale, days] of Object.entries(expected))
    assert.deepStrictEqual(findWeekend(locale), days, locale);
});

it("findWeekend reads underscores, scripts, and bare languages", () => {
  assert.deepStrictEqual(findWeekend("ar_SA"), [5, 6]);
  assert.deepStrictEqual(findWeekend("sr-Latn-RS"), [6, 0]);
  assert.deepStrictEqual(findWeekend("ar"), [5, 6]);
  assert.deepStrictEqual(findWeekend("en"), [6, 0]);
});

it("findWeekend falls back to Saturday and Sunday", () => {
  assert.deepStrictEqual(findWeekend("zz"), [6, 0]);
  assert.deepStrictEqual(findWeekend(undefined), [6, 0]);
  // Each call returns its own array.
  const a = findWeekend("ar-SA");
  a.push(0);
  assert.deepStrictEqual(findWeekend("ar-SA"), [5, 6]);
});
