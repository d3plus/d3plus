import {it} from "vitest";
import assert from "assert";
import {default as findWeekStart} from "../src/findWeekStart.ts";

it("findWeekStart follows CLDR regions", () => {
  const expected = {
    "en-US": 0,
    "en-GB": 1,
    "de-DE": 1,
    "es-ES": 1,
    "es-MX": 0,
    "fr-FR": 1,
    "it-IT": 1,
    "pt-BR": 0,
    "pt-PT": 0,
    "zh-CN": 0,
    "ar-SA": 0,
    "ar-EG": 6,
    "fa-IR": 6,
  };
  for (const [locale, start] of Object.entries(expected)) {
    assert.strictEqual(findWeekStart(locale), start, locale);
  }
});

it("findWeekStart reads underscore, lower-case, and script-tagged forms", () => {
  assert.strictEqual(findWeekStart("en_US"), 0, "underscore");
  assert.strictEqual(findWeekStart("en_GB"), 1, "underscore Monday");
  assert.strictEqual(findWeekStart("en_CA"), 0, "underscore Canada");
  assert.strictEqual(findWeekStart("ar_EG"), 6, "underscore Saturday");
  assert.strictEqual(findWeekStart("en-us"), 0, "lower-case region");
  assert.strictEqual(findWeekStart("sr-Latn-RS"), 1, "script subtag");
  assert.strictEqual(findWeekStart("zh-Hant-TW"), 0, "script subtag Sunday");
});

it("findWeekStart resolves 2-letter language codes through findLocale", () => {
  assert.strictEqual(findWeekStart("en"), 0, "en → en-US");
  assert.strictEqual(findWeekStart("pt"), 0, "pt → pt-BR");
  assert.strictEqual(findWeekStart("ar"), 0, "ar → ar-SA");
  assert.strictEqual(findWeekStart("zh"), 0, "zh → zh-CN");
  assert.strictEqual(findWeekStart("de"), 1, "de → de-DE");
  assert.strictEqual(findWeekStart("fr"), 1, "fr → fr-FR");
  assert.strictEqual(findWeekStart("zh-Hans"), 0, "script only → language default");
});

it("findWeekStart falls back to Monday", () => {
  assert.strictEqual(findWeekStart("xx"), 1, "unknown language");
  assert.strictEqual(findWeekStart(""), 1, "empty string");
  assert.strictEqual(findWeekStart(undefined), 1, "undefined");
  assert.strictEqual(findWeekStart({}), 1, "non-string");
});
