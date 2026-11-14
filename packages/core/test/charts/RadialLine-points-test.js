import {it} from "vitest";
import assert from "assert";
import {
  radialDotNodes,
  radialPointHover,
  radialPointOf,
  radialPointTooltipRows,
  radialValueText,
  registerRadialPoint,
} from "../../src/charts/RadialLine/points.ts";
import {radialPaint} from "../../src/charts/RadialLine/emit.ts";
import {radialLabelsSeries} from "../../src/charts/RadialLine/seriesLabelNodes.ts";

/** The slice of a chart the dot helpers read. */
const fakeViz = (on = {}) => ({
  schema: {locale: "en-US", on},
  _drawLabel: d => `${d.id}`,
});

/** Two registered dot rows of series A. */
const dots = () => {
  const rows = [
    {id: "A", month: "Jan", v: 1500},
    {id: "A", month: "Feb", v: 4},
  ];
  return rows.map((row, k) => {
    const info = {key: row.month, label: row.month.toUpperCase(), value: row.v};
    registerRadialPoint(row, info);
    return {row, i: k + 3, x: k * 10, y: -k * 5, info};
  });
};

it("radialPointOf reads a registered dot row, and nothing else", () => {
  const row = {id: "A"};
  assert.strictEqual(radialPointOf(row), undefined);
  registerRadialPoint(row, {key: "Jan", label: "Jan", value: 3});
  assert.deepStrictEqual(radialPointOf(row), {
    key: "Jan",
    label: "Jan",
    value: 3,
  });
  assert.strictEqual(radialPointOf({id: "A"}), undefined);
  assert.strictEqual(radialPointOf(undefined), undefined);
  assert.strictEqual(radialPointOf("A"), undefined);
});

it("radialValueText abbreviates, or formats through levelFormat", () => {
  const viz = fakeViz();
  assert.strictEqual(radialValueText(viz, 1500), "1.5k");
  viz.schema.levelFormat = d => `${d}°`;
  assert.strictEqual(radialValueText(viz, 12), "12°");
});

it("radialPointTooltipRows lists a dot's `x` label and value, none for a series", () => {
  const viz = fakeViz();
  const [jan, feb] = dots();
  assert.deepStrictEqual(radialPointTooltipRows(viz, jan.row), [
    ["JAN", "1.5k"],
  ]);
  assert.deepStrictEqual(radialPointTooltipRows(viz, feb.row), [["FEB", "4"]]);
  assert.deepStrictEqual(radialPointTooltipRows(viz, {id: "A"}), []);
});

it("radialDotNodes puts a Circle on each dot, painted from the config", () => {
  const nodes = radialDotNodes(
    fakeViz(),
    "A",
    0,
    dots(),
    {r: 3, fill: d => (d.month === "Jan" ? "red" : "blue")},
    "radial",
  );
  assert.deepStrictEqual(
    nodes.map(n => ({
      key: n.key,
      type: n.type,
      r: n.r,
      at: [n.transform.x, n.transform.y],
      index: n.index,
      fill: n.paint.fill,
      hoverKeys: n.hoverKeys,
      aria: n.aria.label,
    })),
    [
      {
        key: "radial-point-A-Jan",
        type: "circle",
        r: 3,
        at: [0, -0],
        index: 3,
        fill: "red",
        hoverKeys: {slot: ["Jan"]},
        aria: "A, JAN: 1.5k.",
      },
      {
        key: "radial-point-A-Feb",
        type: "circle",
        r: 3,
        at: [10, -5],
        index: 4,
        fill: "blue",
        hoverKeys: {slot: ["Feb"]},
        aria: "A, FEB: 4.",
      },
    ],
  );
});

it("radialDotNodes leaves out dots whose radius is 0 or less", () => {
  assert.deepStrictEqual(
    radialDotNodes(fakeViz(), "A", 0, dots(), {r: 0}, "r"),
    [],
  );
  assert.deepStrictEqual(
    radialDotNodes(fakeViz(), "A", 0, dots(), {}, "r"),
    [],
  );
  const some = radialDotNodes(
    fakeViz(),
    "A",
    0,
    dots(),
    {r: d => (d.month === "Feb" ? 2 : -1)},
    "r",
  );
  assert.deepStrictEqual(
    some.map(n => n.key),
    ["r-point-A-Feb"],
  );
});

it("radialPointHover focuses the hovered dot's `x`, after the chart's own mouseenter", () => {
  const calls = [];
  const viz = fakeViz();
  const hover = () => true;
  viz.schema.on.mouseenter = function (d, i) {
    calls.push([this, d, i]);
    viz._hover = hover;
  };
  radialPointHover(viz);
  const [, feb] = dots();
  viz.schema.on.mouseenter(feb.row, 1, feb.row, {});
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0][0], viz, "the base handler runs as the chart");
  assert.deepStrictEqual(viz._hoverFocus, {hover, rows: [{slot: "Feb"}]});

  viz._hoverFocus = undefined;
  viz.schema.on.mouseenter({id: "A"}, 0, {id: "A"}, {});
  assert.strictEqual(
    viz._hoverFocus,
    undefined,
    "a series path focuses nothing",
  );

  const bare = fakeViz();
  bare._hover = hover;
  radialPointHover(bare);
  bare.schema.on.mouseenter(feb.row, 1, feb.row, {});
  assert.deepStrictEqual(
    bare._hoverFocus.rows,
    [{slot: "Feb"}],
    "no base handler",
  );
});

it("radialPaint resolves the fill and stroke opacity and dashes, with an explicit opacity", () => {
  const paint = radialPaint(
    {
      fill: d => d.c,
      fillOpacity: 0.25,
      stroke: "black",
      strokeWidth: 2,
      strokeOpacity: () => 0.5,
      strokeDasharray: "4 2",
    },
    {c: "red"},
    0,
  );
  assert.strictEqual(paint.fill, "red");
  assert.strictEqual(paint.fillOpacity, 0.25);
  assert.strictEqual(paint.stroke, "black");
  assert.strictEqual(paint.strokeWidth, 2);
  assert.strictEqual(paint.strokeOpacity, 0.5);
  assert.deepStrictEqual(paint.strokeDasharray, [4, 2]);
  assert.strictEqual(paint.opacity, 1);
  const plain = radialPaint({opacity: 0.4, strokeDasharray: [3, "x"]}, {}, 0);
  assert.strictEqual(plain.opacity, 0.4);
  assert.deepStrictEqual(plain.strokeDasharray, [3]);
  assert.strictEqual(plain.fillOpacity, undefined);
  assert.strictEqual(radialPaint({}, {}, 0).strokeDasharray, undefined);
});

it("radialLabelsSeries reads lineLabels as a flag or a function of the series", () => {
  assert.strictEqual(radialLabelsSeries(true, {}, 0), true);
  assert.strictEqual(radialLabelsSeries("end", {}, 0), true);
  assert.strictEqual(radialLabelsSeries(false, {}, 0), false);
  assert.strictEqual(radialLabelsSeries("false", {}, 0), false);
  assert.strictEqual(radialLabelsSeries(undefined, {}, 0), false);
  const pick = d => d.id === "A";
  assert.strictEqual(radialLabelsSeries(pick, {id: "A"}, 0), true);
  assert.strictEqual(radialLabelsSeries(pick, {id: "B"}, 1), false);
});
