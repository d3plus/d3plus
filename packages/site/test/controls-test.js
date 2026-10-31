import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  current,
  hex,
  preview,
  representable,
  segmented,
} from "../src/components/Playground/Controls.tsx";

describe("hex", () => {
  it("keeps a six-digit hex color", () => {
    assert.equal(hex("#1f66b5"), "#1f66b5");
    assert.equal(hex("  #ABCDEF "), "#ABCDEF");
  });

  it("expands a three-digit hex color", () => {
    assert.equal(hex("#0af"), "#00aaff");
  });

  it("falls back to black for anything else", () => {
    assert.equal(hex("steelblue"), "#000000");
    assert.equal(hex("rgb(0, 0, 0)"), "#000000");
    assert.equal(hex(undefined), "#000000");
    assert.equal(hex(12), "#000000");
  });
});

describe("segmented", () => {
  it("takes two to four short options", () => {
    assert.ok(segmented(["x", "y"]));
    assert.ok(segmented(["x", "y", "left", "right"]));
    assert.ok(segmented([true, false]));
  });

  it("leaves one option, many options, or long labels to a menu", () => {
    assert.ok(!segmented([]));
    assert.ok(!segmented(["only"]));
    assert.ok(!segmented(["a", "b", "c", "d", "e"]));
    assert.ok(!segmented(["squarify", "a much longer label"]));
  });
});

describe("representable", () => {
  const spec = (control, options) => ({key: "k", control, options});

  it("takes a value of the control's own type, or none", () => {
    assert.ok(representable(spec("boolean"), true));
    assert.ok(representable(spec("number"), 0));
    assert.ok(representable(spec("text"), "id"));
    assert.ok(representable(spec("color"), "#fff"));
    assert.ok(representable(spec("select", ["a", "b"]), "b"));
    assert.ok(representable(spec("text"), undefined));
  });

  it("leaves arrays, functions, and other types to the code", () => {
    assert.ok(!representable(spec("text"), ["parent", "id"]));
    assert.ok(!representable(spec("text"), d => d.id));
    assert.ok(!representable(spec("number"), "4"));
    assert.ok(!representable(spec("boolean"), () => true));
    assert.ok(!representable(spec("select", ["a", "b"]), "c"));
  });
});

describe("preview", () => {
  it("prints arrays and objects as spaced JSON", () => {
    assert.equal(preview(["parent", "id"]), '["parent", "id"]');
    assert.equal(preview({a: 1, b: [2, 3]}), '{"a":1, "b":[2, 3]}');
  });

  it("names a function rather than printing its source", () => {
    assert.equal(
      preview(d => d.id),
      "ƒ (function)",
    );
  });

  it("cuts a long value short", () => {
    const text = preview(
      Array.from({length: 40}, (_, i) => i),
      12,
    );
    assert.equal(text.length, 12);
    assert.ok(text.endsWith("…"));
  });
});

describe("current", () => {
  const spec = {key: "padding", control: "number", defaultValue: 4};

  it("shows the config's value over the default", () => {
    assert.equal(current(spec, {padding: 8}), 8);
    assert.deepEqual(current({...spec, control: "text"}, {padding: ["a"]}), [
      "a",
    ]);
  });

  it("falls back to the default when the config has none", () => {
    assert.equal(current(spec, {}), 4);
  });

  it("skips a default the control can't show", () => {
    assert.equal(current({...spec, defaultValue: "unknown"}, {}), undefined);
  });
});
