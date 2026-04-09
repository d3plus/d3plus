import assert from "assert";
import {default as findLocale} from "../es/src/findLocale.js";

it("findLocale", () => {
  assert.strictEqual(findLocale("en"), "en-US", "default country");
  assert.strictEqual(findLocale("zh"), "zh-CN", "default country zh");
  assert.strictEqual(findLocale("pt"), "pt-BR", "default country pt");

  assert.strictEqual(findLocale("en-US"), "en-US", "5-char locale returned as-is");
  assert.strictEqual(findLocale("fr-FR"), "fr-FR", "5-char locale returned as-is");

  assert.strictEqual(findLocale("fr"), "fr-FR", "ISO lookup with matching tag");
  assert.strictEqual(findLocale("de"), "de-DE", "ISO lookup with matching tag de");

  assert.strictEqual(findLocale("xx"), "xx", "unknown code returned as-is");

  assert.strictEqual(typeof findLocale(42), "number", "non-string returned as-is");
});
