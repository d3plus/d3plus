import {it} from "vitest";
import assert from "assert";
import {clearGraphFocus, withinArea} from "../../internal.ts";

/** A Network or ArcDiagram's background click: the focus it clears and the area it covers. */

it("withinArea: a point inside an area, edges included", () => {
  const area = {x: 10, y: 20, width: 100, height: 50};
  assert.strictEqual(withinArea([10, 20], area), true);
  assert.strictEqual(withinArea([110, 70], area), true);
  assert.strictEqual(withinArea([60, 40], area), true);
  assert.strictEqual(withinArea([9, 40], area), false);
  assert.strictEqual(withinArea([60, 71], area), false);
});

it("clearGraphFocus: clears the active nodes and the zoom of a focused chart", () => {
  const calls = [];
  const viz = {
    _focus: "a",
    active: v => calls.push(["active", v]),
    _zoomToBounds: v => calls.push(["zoom", v]),
  };
  assert.strictEqual(clearGraphFocus(viz), true);
  assert.strictEqual(viz._focus, undefined);
  assert.deepStrictEqual(calls, [
    ["active", false],
    ["zoom", null],
  ]);
  assert.strictEqual(clearGraphFocus(viz), false, "nothing left to clear");
  assert.strictEqual(calls.length, 2);
});
