import {it} from "vitest";
import assert from "assert";

import {Geomap, Network, Rings} from "../../index.ts";
import {
  LINK_SIZE_SHARE,
  linkSizeMaxField,
  linkWidthRange,
} from "../../internal.ts";

it("linkWidthRange caps the widest link at half the smallest node's radius", () => {
  assert.strictEqual(LINK_SIZE_SHARE, 0.5);
  assert.deepStrictEqual(linkWidthRange(1, undefined, 20), [1, 10]);
  assert.deepStrictEqual(linkWidthRange(2, undefined, 40), [2, 20]);
  assert.deepStrictEqual(linkWidthRange(undefined, undefined, 20), [1, 10]);
});

it("linkWidthRange uses a set linkSizeMax as given", () => {
  assert.deepStrictEqual(linkWidthRange(1, 6, 20), [1, 6]);
  assert.deepStrictEqual(linkWidthRange(1, 30, 20), [1, 30], "past the cap");
  assert.deepStrictEqual(linkWidthRange(0, 0, 20), [0, 0]);
});

it("linkWidthRange holds a linkSizeMin wider than the widest link sensibly", () => {
  // A set linkSizeMax is a ceiling: the thinnest link is held to it.
  assert.deepStrictEqual(linkWidthRange(8, 4, 20), [4, 4]);
  // The default cap gives way to a wider linkSizeMin.
  assert.deepStrictEqual(linkWidthRange(12, undefined, 20), [12, 12]);
  // Tiny nodes: never under the thinnest link.
  assert.deepStrictEqual(linkWidthRange(1, undefined, 1), [1, 1]);
});

it("linkWidthRange falls back on unusable inputs", () => {
  // No nodes (an empty min) or a bad radius: every link is the thinnest.
  for (const rMin of [undefined, NaN, Infinity, -5])
    assert.deepStrictEqual(
      linkWidthRange(1, undefined, rMin),
      [1, 1],
      String(rMin),
    );
  // A bad linkSizeMin is 1; a bad linkSizeMax is unset.
  assert.deepStrictEqual(linkWidthRange("3", undefined, 20), [1, 10]);
  assert.deepStrictEqual(linkWidthRange(-2, undefined, 20), [1, 10]);
  assert.deepStrictEqual(linkWidthRange(1, -4, 20), [1, 10]);
  assert.deepStrictEqual(linkWidthRange(1, NaN, 20), [1, 10]);
});

it("linkSizeMaxField declares linkSizeMax, with an optional default", () => {
  assert.deepStrictEqual(linkSizeMaxField(), {key: "linkSizeMax"});
  assert.deepStrictEqual(linkSizeMaxField(10), {
    key: "linkSizeMax",
    default: 10,
  });
});

it("linkSizeMax is an option on Network, Rings, and Geomap", () => {
  for (const Chart of [Network, Rings]) {
    const viz = new Chart();
    assert.strictEqual(viz.linkSizeMax(), undefined, Chart.name);
    assert.strictEqual(viz.linkSizeMax(6), viz, "chains");
    assert.strictEqual(viz.linkSizeMax(), 6);
    assert.strictEqual(viz.linkSizeMin(), 1);
    assert.strictEqual(viz.linkSizeScale(), "sqrt");
  }
  assert.strictEqual(new Geomap().linkSizeMax(), 10);
});
