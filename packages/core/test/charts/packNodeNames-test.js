import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Pack} from "../../index.ts";
import {applyPackLayout, runStages} from "../../internal.ts";
import {packEmit} from "../../src/charts/Pack/emit.ts";

useJsdom();

/**
    A Pack's circles are keyed by their path of keys: a group by its groups'
    keys down to its own, a leaf by its groups' keys and then its id. So no
    two circles share a key (the same id under two parents included), and a
    redraw that reorders the circles pairs each one with itself. A group
    circle is named at its own `groupBy` level, the root circle reads as the
    total, and leaves keep their labels.
*/

const rows = [
  {top: "T1", parent: "P1", id: "A", value: 3},
  {top: "T1", parent: "P1", id: "B", value: 4},
  {top: "T1", parent: "P2", id: "C", value: 5},
  {top: "T1", parent: "P2", id: "D", value: 6},
  {top: "T2", parent: "P3", id: "E", value: 7},
  {top: "T2", parent: "P3", id: "F", value: 5},
  {top: "T2", parent: "P1", id: "G", value: 2},
  {top: "T2", parent: "P1", id: "H", value: 1},
];

/** The scene nodes Pack emits for `data`. */
function emit(configure, data = rows) {
  const viz = configure(new Pack().sum("value").data(data))
    .width(400)
    .height(300);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [applyPackLayout]);
  return packEmit({viz, shapeData});
}

/** Each circle Pack emits as `key | aria label`, in layout order. */
const circles = (configure, data) =>
  emit(configure, data)
    .filter(n => n.type === "circle")
    .map(n => `${n.key} | ${n.aria.label}`);

it("keys each circle by its path and names each group at its own level", () => {
  assert.deepStrictEqual(
    circles(viz => viz.groupBy(["top", "parent", "id"])),
    [
      "pack-root-0 | Total, 33.",
      "pack-group-T1 | T1, 18.",
      "pack-group-T2 | T2, 15.",
      "pack-group-T1/P2 | P2, 11.",
      "pack-group-T1/P1 | P1, 7.",
      "pack-group-T2/P3 | P3, 12.",
      // The same `parent` under another `top` is a group of its own.
      "pack-group-T2/P1 | P1, 3.",
      "pack-leaf-T1/P2/D | D, 6.",
      "pack-leaf-T1/P2/C | C, 5.",
      "pack-leaf-T1/P1/B | B, 4.",
      "pack-leaf-T1/P1/A | A, 3.",
      "pack-leaf-T2/P3/E | E, 7.",
      "pack-leaf-T2/P3/F | F, 5.",
      "pack-leaf-T2/P1/G | G, 2.",
      "pack-leaf-T2/P1/H | H, 1.",
    ],
  );
});

it("keys the same id under two parents apart, circles and labels alike", () => {
  const nodes = emit(viz => viz.groupBy(["top", "parent", "id"]).depth(1));
  assert.deepStrictEqual(
    nodes
      .filter(n => n.type === "circle")
      .map(n => `${n.key} | ${n.aria.label}`),
    [
      "pack-root-0 | Total, 33.",
      "pack-group-T1 | T1, 18.",
      "pack-group-T2 | T2, 15.",
      "pack-leaf-T1/P2 | P2, 11.",
      "pack-leaf-T1/P1 | P1, 7.",
      "pack-leaf-T2/P3 | P3, 12.",
      "pack-leaf-T2/P1 | P1, 3.",
    ],
  );
  const keys = nodes.map(n => n.key);
  assert.ok(nodes.some(n => n.type === "text"));
  assert.strictEqual(new Set(keys).size, keys.length, keys.join(", "));
  assert.deepStrictEqual(
    circles(viz => viz.groupBy(["top", "parent"]).depth(0)),
    [
      "pack-root-0 | Total, 33.",
      "pack-leaf-T1 | T1, 18.",
      "pack-leaf-T2 | T2, 15.",
    ],
  );
});

it("keeps every circle's key when a redraw reorders the circles", () => {
  const configure = viz => viz.groupBy(["parent", "id"]);
  const before = circles(configure);
  const swapped = rows.map(d =>
    d.parent === "P1" ? {...d, value: 20 - d.value} : d,
  );
  const after = circles(configure, swapped);
  // P1 moves from last to first among the groups, and its leaves reverse.
  assert.deepStrictEqual(before.slice(1, 4), [
    "pack-group-P3 | P3, 12.",
    "pack-group-P2 | P2, 11.",
    "pack-group-P1 | P1, 10.",
  ]);
  assert.deepStrictEqual(after.slice(1, 4), [
    "pack-group-P1 | P1, 70.",
    "pack-group-P3 | P3, 12.",
    "pack-group-P2 | P2, 11.",
  ]);
  const names = list =>
    Object.fromEntries(
      list.map(c => {
        const [key, label] = c.split(" | ");
        return [key, label.split(",")[0]];
      }),
    );
  assert.notDeepStrictEqual(after, before);
  assert.deepStrictEqual(names(after), names(before));
});
