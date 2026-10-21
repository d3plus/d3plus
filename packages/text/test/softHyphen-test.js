import {it} from "vitest";
import assert from "assert";
import {softHyphen, textSplit} from "../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom({augment: false});

it("softHyphen", () => {
  assert.strictEqual(softHyphen, "­");
  assert.strictEqual(softHyphen.length, 1);
  const syllables = textSplit("internationalization");
  assert.ok(syllables.length > 1, "a long word splits into syllables");
  syllables.slice(0, -1).forEach(s => assert.ok(s.endsWith(softHyphen), `"${s}" ends in a soft hyphen`));
});
