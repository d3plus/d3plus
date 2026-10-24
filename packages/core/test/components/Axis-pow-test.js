import {it} from "vitest";
import assert from "assert";
import {AxisBottom, AxisLeft} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    #768: `exponent` sets a `"pow"` axis's exponent. Other scales ignore it,
    and a power axis ticks evenly along its length.
*/

const compute = axis => axis.renderMode("compute").select(null).render();

const leftAxis = config =>
  compute(
    new AxisLeft().domain([1e6, 0]).height(400).width(300).config(config),
  );

it("exponent sets a pow axis's exponent, defaulting to 1", () => {
  assert.strictEqual(new AxisLeft().exponent(), 1, "default");
  const axis = leftAxis({scale: "pow", exponent: 0.3});
  assert.strictEqual(axis.exponent(), 0.3);
  assert.strictEqual(axis._d3Scale.exponent(), 0.3);
  const [top, bottom] = axis._d3Scale.range();
  // A quarter of the domain sits ~2/3 of the way up the axis at 0.3.
  const share = (bottom - axis._getPosition(250000)) / (bottom - top);
  assert.ok(Math.abs(share - Math.pow(0.25, 0.3)) < 1e-9, `${share}`);
  assert.strictEqual(
    leftAxis({scale: "pow"})._d3Scale.exponent(),
    1,
    "a pow axis without an exponent draws linearly",
  );
});

it("exponent is ignored off a pow axis, and when it isn't positive", () => {
  assert.strictEqual(
    leftAxis({scale: "sqrt", exponent: 0.3})._d3Scale.exponent(),
    0.5,
    "sqrt stays 0.5",
  );
  const linear = leftAxis({scale: "linear", exponent: 0.3});
  assert.strictEqual(linear._d3Scale.exponent, undefined, "stays linear");
  assert.strictEqual(linear._getPosition(500000), 200);
  for (const exponent of [0, -2, NaN, "0.5"])
    assert.strictEqual(
      leftAxis({scale: "pow", exponent})._d3Scale.exponent(),
      1,
      `${exponent} falls back to 1`,
    );
});

it("a pow axis's labels spread along it instead of bunching at one end", () => {
  const axis = leftAxis({scale: "pow", exponent: 0.3});
  const labels = axis._getLabels();
  assert.ok(labels.includes(0) && labels.includes(1e6), `${labels}`);
  assert.ok(
    labels.filter(d => d > 0 && d < 100000).length >= 2,
    `labels in the stretched low end: ${labels}`,
  );
  const ticks = axis._getTicks();
  assert.ok(
    labels.every(d => ticks.includes(d)),
    "every label has a tick",
  );
  const pixels = axis._visibleTicks.map(d => axis._getPosition(d));
  const gaps = pixels.slice(1).map((p, i) => Math.abs(p - pixels[i]));
  assert.ok(Math.max(...gaps) < 400 / 3, `no long gap: ${gaps}`);
});

it("a sqrt axis ticks along its length too, and exponent 1 ticks as linear", () => {
  const sqrt = leftAxis({scale: "sqrt"});
  assert.ok(
    sqrt._getLabels().some(d => d > 0 && d < 100000),
    `${sqrt._getLabels()}`,
  );
  assert.deepStrictEqual(
    leftAxis({scale: "pow"})._getLabels(),
    leftAxis({scale: "linear"})._getLabels(),
  );
});

it("a pow axis rounds its domain like a linear one", () => {
  const axis = compute(
    new AxisBottom()
      .domain([1000, 4400000])
      .width(600)
      .height(100)
      .config({scale: "pow", exponent: 0.5, rounding: "outside"}),
  );
  const linear = compute(
    new AxisBottom()
      .domain([1000, 4400000])
      .width(600)
      .height(100)
      .config({rounding: "outside"}),
  );
  assert.deepStrictEqual(axis._d3Scale.domain(), linear._d3Scale.domain());
});

it("a pow axis ignores breaks", () => {
  const axis = leftAxis({
    scale: "pow",
    exponent: 0.5,
    break: [200000, 600000],
    baselineBreak: true,
  });
  assert.deepStrictEqual(axis._breaks, []);
  assert.strictEqual(axis._d3Scale.exponent(), 0.5);
});
