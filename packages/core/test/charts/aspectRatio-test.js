import {it} from "vitest";
import assert from "assert";
import {
  aspectInset,
  axisUnits,
  plotAspectRatio,
  plotAxisUnits,
} from "../../src/charts/Plot/aspectRatio.ts";
import {configWarnings} from "../../src/utils/configWarnings.ts";

/**
    A Plot's `aspectRatio`: the units each axis measures in, how far the
    plot area shrinks to hold the ratio, and which ratios and axes it
    ignores (with a warning).
*/

/** Runs `fn` collecting console warnings. */
function warnings(fn) {
  const out = [];
  const warn = console.warn;
  console.warn = msg => out.push(msg);
  let value;
  try {
    configWarnings(true);
    value = fn();
  } finally {
    console.warn = warn;
  }
  return {value, warned: out};
}

it("axisUnits: linear and time spans, log decades, none otherwise", () => {
  assert.strictEqual(axisUnits("linear", [0, 10]), 10);
  assert.strictEqual(axisUnits("linear", [12, -2]), 14);
  assert.strictEqual(
    axisUnits("time", [new Date(2024, 0, 1), new Date(2024, 0, 2)]),
    864e5,
  );
  assert.strictEqual(axisUnits("log", [1, 1000]), 3);
  assert.strictEqual(axisUnits("log", [-100, -1]), 2);
  assert.strictEqual(axisUnits("log", [-1, 100]), undefined);
  for (const scale of ["band", "point", "ordinal", "pow", "sqrt"])
    assert.strictEqual(axisUnits(scale, [0, 10]), undefined);
  assert.strictEqual(axisUnits("linear", [5, 5]), undefined);
  assert.strictEqual(axisUnits("linear", [0, NaN]), undefined);
});

it("aspectInset: shrinks only the side that is too long", () => {
  // 10 units over 400px wide, 10 over 200px tall: x is too long.
  assert.deepStrictEqual(aspectInset({x: 10, y: 10}, {x: 400, y: 200}, 1), {
    x: 200,
    y: 0,
  });
  // Tall: y is too long.
  assert.deepStrictEqual(aspectInset({x: 10, y: 10}, {x: 200, y: 400}, 1), {
    x: 0,
    y: 200,
  });
  // A ratio of 2 draws a y unit twice an x unit.
  assert.deepStrictEqual(aspectInset({x: 10, y: 10}, {x: 400, y: 200}, 2), {
    x: 300,
    y: 0,
  });
  assert.deepStrictEqual(aspectInset({x: 10, y: 5}, {x: 400, y: 200}, 1), {
    x: 0,
    y: 0,
  });
  assert.deepStrictEqual(aspectInset({x: 10, y: 10}, {x: 0, y: 200}, 1), {
    x: 0,
    y: 0,
  });
});

it("plotAspectRatio: a positive number on even axes, else a warning", () => {
  const viz = ratio => ({schema: {aspectRatio: ratio}});
  const even = {x: "linear", y: "log"};
  assert.strictEqual(plotAspectRatio(viz(undefined), even), undefined);
  assert.strictEqual(plotAspectRatio(viz(false), even), undefined);
  assert.strictEqual(plotAspectRatio(viz(1.5), even), 1.5);
  assert.strictEqual(plotAspectRatio(viz(1), {x: "time", y: "linear"}), 1);
  const bad = warnings(() => plotAspectRatio(viz(-1), even));
  assert.strictEqual(bad.value, undefined);
  assert.match(bad.warned[0], /positive number/);
  const band = warnings(() =>
    plotAspectRatio(viz(1), {x: "point", y: "linear"}),
  );
  assert.strictEqual(band.value, undefined);
  assert.match(band.warned[0], /the x axis has no even unit/);
  const pow = warnings(() => plotAspectRatio(viz(1), {x: "pow", y: "sqrt"}));
  assert.match(pow.warned[0], /x and y axis/);
});

it("plotAxisUnits: reads the measured axes, or the given domains", () => {
  const axis = domain => ({
    _d3Scale: {},
    _d3ScaleNegative: null,
    _getDomain: () => domain,
  });
  const unmeasured = {_d3Scale: null, _d3ScaleNegative: null};
  assert.deepStrictEqual(
    plotAxisUnits(
      {x: axis([0, 20]), y: axis([1, 1e4])},
      {x: "linear", y: "log"},
      {x: [], y: []},
    ),
    {x: 20, y: 4},
  );
  assert.deepStrictEqual(
    plotAxisUnits(
      {x: unmeasured, y: axis([0, 5])},
      {x: "linear", y: "linear"},
      {x: [0, 10], y: []},
    ),
    {x: 10, y: 5},
  );
  const spans = warnings(() =>
    plotAxisUnits(
      {x: axis([-10, 10]), y: axis([0, 5])},
      {x: "log", y: "linear"},
      {x: [], y: []},
    ),
  );
  assert.strictEqual(spans.value, undefined);
  assert.match(spans.warned[0], /spans zero/);
});
