import {it} from "vitest";
import assert from "assert";
import {AxisBottom, AxisLeft, Timeline} from "../../index.ts";
import {byValue} from "../../src/components/Timeline/timelineConfig.ts";
import {growsBack} from "../../src/charts/Plot/labelPlacement.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/** #611: `reverse` flips an axis's direction. */

const compute = axis => axis.renderMode("compute").select(null).render();

const bottom = config =>
  compute(new AxisBottom().width(600).height(100).config(config));

it("reverse defaults to false, on Axis and Timeline", () => {
  assert.strictEqual(new AxisBottom().reverse(), false);
  assert.strictEqual(new Timeline().reverse(), false);
});

it("a reversed linear axis runs from its max", () => {
  const normal = bottom({domain: [0, 100]});
  const reversed = bottom({domain: [0, 100], reverse: true});
  assert.deepStrictEqual(reversed._d3Scale.domain(), [100, 0]);
  const [left, right] = reversed._d3Scale.range();
  assert.strictEqual(reversed._getPosition(100), left);
  assert.strictEqual(reversed._getPosition(0), right);
  assert.deepStrictEqual(
    reversed._givenDomain(),
    [0, 100],
    "_givenDomain undoes the reversal",
  );
  assert.deepStrictEqual(normal._givenDomain(), [0, 100]);
  // The same ticks, mirrored.
  const sorted = axis => axis._visibleTicks.map(Number).sort((a, b) => a - b);
  assert.deepStrictEqual(sorted(reversed), sorted(normal));
});

it("a reversed axis rounds before it flips", () => {
  const reversed = bottom({
    domain: [12, 488],
    rounding: "outside",
    reverse: true,
  });
  assert.deepStrictEqual(reversed._d3Scale.domain(), [490, 10]);
});

it("a reversed category axis lists its categories the other way", () => {
  const axis = compute(
    new AxisLeft()
      .height(300)
      .width(200)
      .scale("point")
      .domain(["a", "b", "c"])
      .reverse(true),
  );
  assert.ok(axis._getPosition("c") < axis._getPosition("a"));
  assert.deepStrictEqual(axis._givenDomain(), ["a", "b", "c"]);
});

it("a reversed time axis runs late to early", () => {
  const axis = bottom({
    scale: "time",
    domain: [new Date(2020, 0, 1), new Date(2020, 11, 1)],
    reverse: true,
  });
  assert.ok(
    axis._getPosition(new Date(2020, 11, 1)) <
      axis._getPosition(new Date(2020, 0, 1)),
  );
});

it("a reversed log axis keeps its negative half", () => {
  const axis = bottom({scale: "log", domain: [-100, 1000], reverse: true});
  assert.ok(axis._d3ScaleNegative, "split at zero");
  assert.ok(axis._getPosition(1000) < axis._getPosition(-100));
  assert.ok(axis._getPosition(10) < axis._getPosition(-10));
});

it("a reversed axis keeps its breaks", () => {
  const axis = bottom({domain: [0, 1000], break: [100, 900], reverse: true});
  assert.strictEqual(axis._breaks.length, 1);
  assert.ok(axis._getPosition(950) < axis._getPosition(50));
});

it("byValue — ascending copy of dates, years or pixels", () => {
  const dates = [new Date(2020, 0, 1), new Date(2010, 0, 1)];
  const sorted = byValue(dates);
  assert.deepStrictEqual(sorted, [dates[1], dates[0]]);
  assert.notStrictEqual(sorted, dates, "a copy");
  assert.deepStrictEqual(byValue([300, 12.5, 40]), [12.5, 40, 300]);
});

it("growsBack — negative values, or positive ones on a reversed value axis", () => {
  const viz = reverse => ({
    _y: d => d.v,
    _x: d => d.v,
    _yAxis: {schema: {reverse}},
    _xAxis: {schema: {}},
  });
  assert.strictEqual(growsBack(viz(false), "y", {v: 5}, 0), false);
  assert.strictEqual(growsBack(viz(false), "y", {v: -5}, 0), true);
  assert.strictEqual(growsBack(viz(true), "y", {v: 5}, 0), true);
  assert.strictEqual(growsBack(viz(true), "y", {v: -5}, 0), false);
  assert.strictEqual(growsBack(viz(true), "x", {v: 5}, 0), false);
});
