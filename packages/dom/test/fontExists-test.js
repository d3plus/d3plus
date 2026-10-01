import assert from "assert";
import {default as fontExists} from "../es/src/fontExists.js";
import it from "./jsdom.js";

it("fontExists", () => {
  const missing = "Missing",
    valid = "serif";

  assert.strictEqual(valid, fontExists(valid), "single - exists");
  assert.strictEqual(false, fontExists(missing), "single - missing");
  assert.strictEqual(
    valid,
    fontExists(`${valid}, ${missing}`),
    "string - first",
  );
  assert.strictEqual(
    valid,
    fontExists(`${missing}, ${valid}`),
    "string - second",
  );
  assert.strictEqual(
    false,
    fontExists(`${missing}, ${missing}2`),
    "string - none",
  );
  assert.strictEqual(valid, fontExists([valid, missing]), "array - first");
  assert.strictEqual(valid, fontExists([missing, valid]), "array - second");
  assert.strictEqual(
    false,
    fontExists([missing, `${missing}2`]),
    "array - none",
  );
});

it("fontExists rechecks missing fonts after a web font loads", () => {
  const loads = [];
  const fonts = new window.EventTarget();
  fonts.load = font => (loads.push(font), Promise.resolve([]));
  Object.defineProperty(document, "fonts", {value: fonts});

  const late = "LateWebFont";
  assert.strictEqual(false, fontExists(late), "missing before load");
  assert.strictEqual(1, loads.length, "requests the font face");
  assert.ok(loads[0].includes(late), "requests the right family");

  fontExists(late);
  assert.strictEqual(1, loads.length, "missing verdict is cached");

  const loaded = new window.Event("loadingdone");
  loaded.fontfaces = [{family: late}];
  fonts.dispatchEvent(loaded);
  assert.strictEqual(false, fontExists(late), "still missing after load");
  assert.strictEqual(2, loads.length, "re-measured after a font load");

  const unrelated = new window.Event("loadingdone");
  unrelated.fontfaces = [{family: "NeverMeasured"}];
  fonts.dispatchEvent(unrelated);
  fontExists(late);
  assert.strictEqual(2, loads.length, "unmeasured font loads are ignored");
});

it("fontExists tolerates family names the browser can't parse", () => {
  const fonts = new window.EventTarget();
  fonts.load = () => {
    throw new window.DOMException("bad font", "SyntaxError");
  };
  Object.defineProperty(document, "fonts", {value: fonts});
  assert.strictEqual(false, fontExists("1nvalid?Face"));
});
