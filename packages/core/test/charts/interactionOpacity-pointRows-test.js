import {it} from "vitest";
import assert from "assert";
import {
  applyInteractionOpacity,
  pointRows,
} from "../../src/charts/viz/interactionOpacity.ts";

/**
    A multi-point mark (a Line or Area) carries its points' merged aggregate
    as its datum, where numeric values sum, so the discrete tick labels that
    follow a hover read the values off its points (see `pointRows`).
*/
const rows = [
  {id: "A", year: 2001, i: 0},
  {id: "A", year: 2002, i: 1},
  {id: "A", year: 2003, i: 2},
];
const points = rows.map((datum, k) => ({x: k, y: 0, datum, index: k}));

it("pointRows: gives the points the predicate matches", () => {
  const out = pointRows(points, d => d.year === 2002, true);
  assert.deepStrictEqual(out, [rows[1]]);
});

it("pointRows: gives every point when only the whole mark matched", () => {
  assert.deepStrictEqual(
    pointRows(points, d => d.year === 6006, true),
    rows,
  );
});

it("pointRows: gives none for a mark without a datum of its own", () => {
  assert.deepStrictEqual(
    pointRows(points, d => d.year === 6006, false),
    [],
  );
});

it("pointRows: matches a point's wrapped row", () => {
  const wrapped = rows.map((data, k) => ({
    x: k,
    y: 0,
    datum: {__d3plus__: true, data},
    index: k,
  }));
  const out = pointRows(wrapped, d => d.year === 2003, true);
  assert.deepStrictEqual(out, [wrapped[2].datum]);
});

/** A tick label stamped to follow the hover on `year`. */
const tick = year => ({
  type: "text",
  key: `tick-${year}`,
  lines: [{text: `${year}`}],
  hoverMatch: {field: "year", value: year},
  paint: {},
});

it("applyInteractionOpacity: a hovered line keeps its points' tick labels lit", () => {
  const line = {
    type: "path",
    key: "line-A",
    datum: {id: "A", year: 6006},
    interactionPoints: points.slice(0, 2),
    paint: {stroke: "#4c6ef5"},
  };
  const viz = {
    _hover: d => d.id === "A",
    schema: {shapeConfig: {}},
  };
  const out = applyInteractionOpacity(
    [line, tick(2001), tick(2002), tick(2003)],
    viz,
  );
  const opacity = Object.fromEntries(
    out.slice(1).map(n => [n.hoverMatch.value, n.paint.opacity ?? 1]),
  );
  assert.deepStrictEqual(opacity, {2001: 1, 2002: 1, 2003: 0.5});
});
