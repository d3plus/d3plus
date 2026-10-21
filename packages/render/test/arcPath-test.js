import {it} from "vitest";
import assert from "assert";
import {arc} from "d3-shape";
import {arcPath, FULL_TURN} from "../index.ts";

it("arcPath draws an annular sector the way d3's arc does", () => {
  const geometry = {innerRadius: 20, outerRadius: 50, startAngle: 0, endAngle: Math.PI / 2};
  assert.strictEqual(arcPath(geometry), arc()(geometry));
  assert.ok(arcPath(geometry).startsWith("M"), "a path");
});

it("arcPath applies padAngle, defaulting it to 0", () => {
  const geometry = {innerRadius: 20, outerRadius: 50, startAngle: 0, endAngle: Math.PI / 2};
  assert.strictEqual(arcPath(geometry), arcPath({...geometry, padAngle: 0}));
  assert.notStrictEqual(arcPath(geometry), arcPath({...geometry, padAngle: 0.1}));
});

it("FULL_TURN is one full revolution in radians", () => {
  assert.strictEqual(FULL_TURN, Math.PI * 2);
});
