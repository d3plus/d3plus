import {it} from "vitest";
import assert from "assert";
import {growFromLine, growRectsFromCenter} from "../../src/charts/helpers/densityEnter.ts";

it("growFromLine flattens each named path onto its line, in its own frame", () => {
  const area = {type: "path", key: "density-a", d: "M5,0L8,10L-8,10L-5,0Z", transform: {x: 100, y: 50}};
  const hit = {type: "path", key: "density-q1-a::hit", d: "M-4,0L4,0", transform: {x: 100, y: 20}};
  const other = {type: "path", key: "other", d: "M0,0L1,1"};
  const grouped = {type: "path", key: "density-b", d: "M2,0L4,8", transform: {x: 10, scale: 2}};
  const group = {type: "group", key: "g", transform: {x: 40}, children: [grouped]};
  growFromLine([area, hit, other, group], "x", new Map([["density-a", 100], ["density-q1-a", 100], ["density-b", 70]]));
  assert.strictEqual(area.enterD, "M0,0L0,10L0,10L0,0Z", "onto its center line, keeping each y");
  assert.strictEqual(hit.enterD, "M0,0L0,0", "a ::hit twin shares its mark's line");
  assert.strictEqual(other.enterD, undefined, "unnamed paths keep the default enter");
  assert.strictEqual(grouped.enterD, "M10,0L10,8", "through the group's and its own transform");
});

it("growFromLine flattens onto a horizontal line and skips rotated paths", () => {
  const ridge = {type: "path", key: "r", d: "M0,80L10,60L20,80", transform: {x: 5, y: 20}};
  const rotated = {type: "path", key: "s", d: "M0,0L1,1", transform: {rotate: 90}};
  growFromLine([ridge, rotated], "y", new Map([["r", 100], ["s", 0]]));
  assert.strictEqual(ridge.enterD, "M0,80L10,80L20,80", "onto its baseline");
  assert.strictEqual(rotated.enterD, undefined);
});

it("growRectsFromCenter starts each rect at zero breadth on its own center line", () => {
  const box = {type: "rect", key: "0", x: -5, y: -20, width: 10, height: 40};
  const nested = {type: "rect", key: "1", x: 0, y: 10, width: 30, height: 6};
  const circle = {type: "circle", key: "c", cx: 0, cy: 0, r: 2};
  growRectsFromCenter([box, {type: "group", key: "g", children: [nested, circle]}], "x");
  assert.deepStrictEqual(box.enterRect, {x: 0, y: -20, width: 0, height: 40});
  assert.deepStrictEqual(nested.enterRect, {x: 15, y: 10, width: 0, height: 6});
  assert.strictEqual(circle.enterRect, undefined);
  const flat = {type: "rect", key: "2", x: 0, y: 10, width: 30, height: 6};
  growRectsFromCenter([flat], "y");
  assert.deepStrictEqual(flat.enterRect, {x: 0, y: 13, width: 30, height: 0});
});
