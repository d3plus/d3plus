import assert from "assert";
import {autoTitle, keyedAccessor, valueKeyOf} from "../../es/src/charts/helpers/valueTitle.js";

it("keyedAccessor reads its key and valueKeyOf remembers it", () => {
  const fn = keyedAccessor("score");
  assert.strictEqual(fn({score: 7}), 7);
  assert.strictEqual(valueKeyOf(fn), "score");
  assert.strictEqual(valueKeyOf(d => d.score), undefined, "a plain function has no key");
  assert.strictEqual(valueKeyOf("score"), undefined);
});

it("autoTitle titles an axis until the user sets their own title", () => {
  const config = {};
  autoTitle(config, undefined, "score");
  assert.strictEqual(config.title, "score", "an unset title is filled");
  autoTitle(config, "score", "points");
  assert.strictEqual(config.title, "points", "the automatic title follows the key");
  config.title = "Mine";
  autoTitle(config, "points", "other");
  assert.strictEqual(config.title, "Mine", "a user title is kept");
  assert.doesNotThrow(() => autoTitle(undefined, undefined, "x"), "a missing config is skipped");
});
