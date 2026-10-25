import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {
  colorScaleHoverValue,
  handleColorScaleHover,
  hoveredSwatch,
} from "../../src/charts/features/colorScaleHover.ts";

afterEach(() => vi.restoreAllMocks());

/** A stand-in chart with a colorScale reading `value`, and its ColorScale. */
const fakeViz = (overrides = {}) => {
  let hovered;
  const cs = {
    _hoverMark: true,
    hover(_) {
      if (!arguments.length) return hovered;
      hovered = _;
      return this;
    },
    hoverMark() {
      return this._hoverMark;
    },
  };
  return {
    schema: {colorScale: d => d.value},
    _colorScaleClass: cs,
    _scheduleSceneRepaint: vi.fn(),
    ...overrides,
  };
};

const shape = datum => ({type: "rect", key: "k", datum, index: 0});

it("colorScaleHoverValue — a shape's row read through colorScale", () => {
  const viz = fakeViz();
  assert.strictEqual(colorScaleHoverValue(viz, shape({value: 12})), 12);
  assert.strictEqual(
    colorScaleHoverValue(viz, shape({value: "7.5"})),
    7.5,
    "a numeric string",
  );
});

it("colorScaleHoverValue — unwraps a label or line datum to the row the fill read", () => {
  const viz = fakeViz({schema: {colorScale: (d, i) => d.value + i}});
  const row = {value: 10, i: 3};
  const label = shape({__d3plus__: true, data: {__d3plus__: true, data: row}});
  assert.strictEqual(colorScaleHoverValue(viz, label), 13);
});

it("colorScaleHoverValue — null for chrome, buckets, and missing values", () => {
  const viz = fakeViz();
  assert.strictEqual(colorScaleHoverValue(viz, undefined), null);
  assert.strictEqual(
    colorScaleHoverValue(viz, {
      ...shape({value: 1}),
      interactionGroup: "legend",
    }),
    null,
    "a legend entry",
  );
  assert.strictEqual(
    colorScaleHoverValue(viz, {...shape({value: 1}), interactionGroup: "axis"}),
    null,
    "axis chrome",
  );
  assert.strictEqual(
    colorScaleHoverValue(viz, shape({_isColorScaleBucket: true, color: "red"})),
    null,
    "a colorScale swatch",
  );
  assert.strictEqual(colorScaleHoverValue(viz, shape(undefined)), null);
  assert.strictEqual(colorScaleHoverValue(viz, shape(4)), null, "a tick");
  for (const value of [null, undefined, "", NaN, "n/a", Infinity, true])
    assert.strictEqual(
      colorScaleHoverValue(viz, shape({value})),
      null,
      String(value),
    );
  assert.strictEqual(
    colorScaleHoverValue(
      fakeViz({schema: {colorScale: false}}),
      shape({value: 3}),
    ),
    null,
    "no colorScale",
  );
});

const event = (type, datum) => ({
  type,
  pick: datum === undefined ? null : {node: shape(datum)},
});

it("handleColorScaleHover — marks the hovered value, repainting only on change", () => {
  const viz = fakeViz();
  const cs = viz._colorScaleClass;
  handleColorScaleHover(viz, event("mouseenter", {value: 5}));
  assert.strictEqual(cs.hover(), 5);
  assert.strictEqual(viz._scheduleSceneRepaint.mock.calls.length, 1);
  handleColorScaleHover(viz, event("mousemove", {value: 5}));
  assert.strictEqual(viz._scheduleSceneRepaint.mock.calls.length, 1, "same");
  handleColorScaleHover(viz, event("mousemove", {value: 9}));
  assert.strictEqual(cs.hover(), 9);
  handleColorScaleHover(viz, event("mousemove"));
  assert.strictEqual(cs.hover(), false, "off any shape");
  handleColorScaleHover(viz, event("mousemove", {value: 9}));
  handleColorScaleHover(viz, event("mouseleave"));
  assert.strictEqual(cs.hover(), false, "leaving the chart");
  assert.strictEqual(viz._scheduleSceneRepaint.mock.calls.length, 5);
  handleColorScaleHover(viz, event("click", {value: 2}));
  assert.strictEqual(cs.hover(), false, "other events pass");
});

it("handleColorScaleHover — holds during a transition, but leaving still clears", () => {
  const viz = fakeViz({_transitionEndsAt: Date.now() + 10000});
  const cs = viz._colorScaleClass;
  cs.hover(5);
  handleColorScaleHover(viz, event("mousemove", {value: 9}));
  assert.strictEqual(cs.hover(), 5);
  handleColorScaleHover(viz, event("mouseleave"));
  assert.strictEqual(cs.hover(), false);
});

it("handleColorScaleHover — nothing to do without a colorScale or with hoverMark(false)", () => {
  const off = fakeViz();
  off._colorScaleClass._hoverMark = false;
  handleColorScaleHover(off, event("mousemove", {value: 9}));
  assert.strictEqual(off._colorScaleClass.hover(), undefined);
  const none = fakeViz({schema: {colorScale: false}});
  handleColorScaleHover(none, event("mousemove", {value: 9}));
  assert.strictEqual(none._colorScaleClass.hover(), undefined);
  assert.strictEqual(none._scheduleSceneRepaint.mock.calls.length, 0);
});

it("hoveredSwatch — the marked value's swatch when the chart's own hover is off", () => {
  const viz = fakeViz({schema: {shapeConfig: {hoverOpacity: 1}}});
  const cs = viz._colorScaleClass;
  cs._colorScale = v => (v < 10 ? "light" : "dark");
  assert.strictEqual(hoveredSwatch(viz), null, "nothing marked");
  cs.hover(12);
  assert.deepStrictEqual(hoveredSwatch(viz), {color: "dark", dimOpacity: 0.5});
  viz.schema.shapeConfig.hoverOpacity = 0.3;
  assert.deepStrictEqual(
    hoveredSwatch(viz),
    {color: "dark", dimOpacity: 0.3},
    "a hoverOpacity below 1 sets the dim",
  );
});

it("hoveredSwatch — null when the chart's hover drives it, on a bar, or with hoverMark off", () => {
  const viz = fakeViz({schema: {}});
  const cs = viz._colorScaleClass;
  cs._colorScale = () => "dark";
  cs.hover(12);
  assert.ok(hoveredSwatch(viz));
  viz._hover = () => true;
  assert.strictEqual(hoveredSwatch(viz), null, "the chart's own hover");
  viz._hover = false;
  cs._barGeometry = {};
  assert.strictEqual(hoveredSwatch(viz), null, "a bar, not swatches");
  cs._barGeometry = undefined;
  cs._hoverMark = false;
  assert.strictEqual(hoveredSwatch(viz), null, "hoverMark(false)");
  cs._hoverMark = true;
  cs.hover(NaN);
  assert.strictEqual(hoveredSwatch(viz), null, "no finite value");
});
