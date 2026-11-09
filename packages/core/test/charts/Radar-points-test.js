import {it} from "vitest";
import assert from "assert";
import {
  radarPointHover,
  radarPointNodes,
  radarPointOf,
  radarPointTooltipRows,
  registerRadarPoint,
} from "../../src/charts/Radar/points.ts";

/** The slice of a chart the dot helpers read. */
const fakeViz = (on = {}) => ({
  schema: {locale: "en-US", on},
  _drawLabel: d => `${d.id}`,
});

/** A polygon with Speed and Range vertices, its rows registered as dots. */
const group = () => {
  const arr = [
    {id: "A", axis: "Speed", value: 1500},
    {id: "A", axis: "Range", value: 4},
  ];
  const metrics = ["Speed", "Range"];
  const values = [1500, 4];
  arr.forEach((row, k) =>
    registerRadarPoint(row, {metric: metrics[k], value: values[k]}),
  );
  return {
    id: "A",
    arr,
    metrics,
    values,
    points: [
      {x: 10, y: 0},
      {x: -5, y: 8},
    ],
  };
};

it("radarPointOf reads a registered dot row, and nothing else", () => {
  const row = {id: "A"};
  assert.strictEqual(radarPointOf(row), undefined);
  registerRadarPoint(row, {metric: "Speed", value: 3});
  assert.deepStrictEqual(radarPointOf(row), {metric: "Speed", value: 3});
  assert.strictEqual(radarPointOf({id: "A"}), undefined, "a polygon's row");
  assert.strictEqual(radarPointOf(undefined), undefined);
  assert.strictEqual(radarPointOf("A"), undefined);
});

it("radarPointTooltipRows lists a dot's metric and value, none for a polygon", () => {
  const viz = fakeViz();
  const g = group();
  assert.deepStrictEqual(radarPointTooltipRows(viz, g.arr[0]), [
    ["Speed", "1.5k"],
  ]);
  assert.deepStrictEqual(radarPointTooltipRows(viz, g.arr[1]), [
    ["Range", "4"],
  ]);
  assert.deepStrictEqual(radarPointTooltipRows(viz, {id: "A"}), []);
});

it("radarPointTooltipRows and the dot's aria label format through levelFormat when set", () => {
  const viz = fakeViz();
  viz.schema.levelFormat = d => `${d} pts`;
  const g = group();
  assert.deepStrictEqual(radarPointTooltipRows(viz, g.arr[0]), [
    ["Speed", "1500 pts"],
  ]);
  const [speed] = radarPointNodes(viz, [g], {r: 3});
  assert.strictEqual(speed.aria.label, "A, Speed: 1500 pts.");
});

it("radarPointNodes puts a Circle on each vertex, painted from the config", () => {
  const g = group();
  const nodes = radarPointNodes(fakeViz(), [g], {
    r: 3,
    fill: d => (d.axis === "Speed" ? "red" : "blue"),
    strokeWidth: 1,
  });
  assert.deepStrictEqual(
    nodes.map(n => ({
      key: n.key,
      type: n.type,
      r: n.r,
      at: [n.cx, n.cy, n.transform.x, n.transform.y],
      fill: n.paint.fill,
      strokeWidth: n.paint.strokeWidth,
      hoverKeys: n.hoverKeys,
      aria: n.aria.label,
    })),
    [
      {
        key: "radar-point-A-Speed",
        type: "circle",
        r: 3,
        at: [0, 0, 10, 0],
        fill: "red",
        strokeWidth: 1,
        hoverKeys: {metric: ["Speed"]},
        aria: "A, Speed: 1.5k.",
      },
      {
        key: "radar-point-A-Range",
        type: "circle",
        r: 3,
        at: [0, 0, -5, 8],
        fill: "blue",
        strokeWidth: 1,
        hoverKeys: {metric: ["Range"]},
        aria: "A, Range: 4.",
      },
    ],
  );
  assert.strictEqual(nodes[0].datum, g.arr[0], "the vertex's row");
});

it("radarPointNodes leaves out dots whose radius is 0 or less", () => {
  const g = group();
  assert.deepStrictEqual(radarPointNodes(fakeViz(), [g], {r: 0}), []);
  assert.deepStrictEqual(radarPointNodes(fakeViz(), [g], {}), []);
  const some = radarPointNodes(fakeViz(), [g], {
    r: d => (d.axis === "Range" ? 2 : -1),
  });
  assert.deepStrictEqual(
    some.map(n => n.key),
    ["radar-point-A-Range"],
  );
});

it("radarPointHover focuses the hovered dot's metric, after the chart's own mouseenter", () => {
  const calls = [];
  const viz = fakeViz();
  const hover = () => true;
  viz.schema.on.mouseenter = function (d, i) {
    calls.push([this, d, i]);
    viz._hover = hover;
  };
  radarPointHover(viz);
  const g = group();
  viz.schema.on.mouseenter(g.arr[1], 1, g.arr[1], {});
  assert.deepStrictEqual(calls, [[viz, g.arr[1], 1]]);
  assert.deepStrictEqual(viz._hoverFocus, {hover, rows: [{metric: "Range"}]});

  // A polygon (or legend) hover sets no focus.
  viz._hoverFocus = undefined;
  viz.schema.on.mouseenter({id: "A"}, 0, {id: "A"}, {});
  assert.strictEqual(viz._hoverFocus, undefined);

  // Nor does a dot while shape hover is off.
  const off = fakeViz({mouseenter: () => {}});
  radarPointHover(off);
  off.schema.on.mouseenter(g.arr[0], 0, g.arr[0], {});
  assert.strictEqual(off._hoverFocus, undefined);
});
