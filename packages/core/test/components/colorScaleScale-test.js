import {it} from "vitest";
import assert from "assert";
import {color as d3Color} from "d3-color";
import {ColorScale} from "../../index.ts";
import {colorScaleBucketCount} from "../../src/components/ColorScale/colorScaleScale.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("colorScaleBucketCount — the buckets setting, capped at the unique values", () => {
  for (const n of [1, 2, 3, 4, 5])
    assert.strictEqual(colorScaleBucketCount(5, n, false), n, `${n} values`);
  assert.strictEqual(colorScaleBucketCount(5, 9, false), 5);
  assert.strictEqual(colorScaleBucketCount([0, 1, 2], 9, false), 3, "array");
  assert.strictEqual(colorScaleBucketCount(undefined, 4, false), 4);
});

it("colorScaleBucketCount — a diverging count is odd and at least 3", () => {
  assert.deepStrictEqual(
    [2, 3, 4, 5, 6, 7].map(n => colorScaleBucketCount(5, n, true)),
    [3, 3, 3, 3, 5, 5],
  );
  assert.strictEqual(colorScaleBucketCount(2, 9, true), 3, "buckets: 2");
  assert.strictEqual(colorScaleBucketCount(1, 9, true), 3, "buckets: 1");
  assert.strictEqual(colorScaleBucketCount(7, 9, true), 7);
  assert.strictEqual(colorScaleBucketCount([0, 1], 9, true), 3, "array");
});

/** A ColorScale over `values`, laid out (never painted) with `config`. */
const solve = (values, config) => {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  document.body.appendChild(group);
  const cs = new ColorScale()
    .renderMode("compute")
    .select(group)
    .data(values.map(value => ({value})))
    .width(400)
    .height(100)
    .duration(0)
    .config(config)
    .render();
  group.remove();
  return cs;
};

/** The color `cs` gives `value`, as `rgb(…)`, or null when it is not one. */
const colorOf = (cs, value) => {
  const c = cs._colorScale(value);
  return c && !/NaN|undefined/.test(String(c))
    ? (d3Color(String(c))?.formatRgb() ?? null)
    : null;
};

/** Whether `c` reads red (the default low pole) or blue (the high pole). */
const reddish = c => d3Color(c).rgb().r > d3Color(c).rgb().b;
const bluish = c => d3Color(c).rgb().b > d3Color(c).rgb().r;

const valueSets = [
  [4],
  [-2],
  [0],
  [-1, 1],
  [0, 4],
  [2, 4],
  [-3, 0],
  [-1, 0, 1],
  [-2, 0, 3],
  [-5, 2, 9],
  [1, 2, 3],
  [-4, -1, 2, 7],
  [-1, 0, 1, 2],
  [-4, -1, 0, 2, 7],
  [1, 2, 3, 4, 5],
];

for (const scale of ["linear", "log", "buckets", "jenks", "quantile"])
  for (const midpoint of [0, 1])
    it(`${scale} (midpoint ${midpoint}) — 1–5 unique values each take a color`, () => {
      for (const values of valueSets) {
        const cs = solve(values, {scale, midpoint});
        const label = `${JSON.stringify(values)} → ${cs._colorScale.range()}`;
        const colors = values.map(v => colorOf(cs, v));
        for (const [i, c] of colors.entries()) {
          assert.ok(c, `${values[i]} has a color: ${label}`);
          assert.notStrictEqual(c, "rgb(0, 0, 0)", `${values[i]}: ${label}`);
        }
        const low = Math.min(...values),
          high = Math.max(...values);
        if (low < midpoint && high > midpoint) {
          const [lowColor, highColor] = [colorOf(cs, low), colorOf(cs, high)];
          assert.ok(reddish(lowColor), `the low pole is red: ${label}`);
          assert.ok(bluish(highColor), `the high pole is blue: ${label}`);
        }
      }
    });

it("linear — 3 values crossing zero span both poles and the midpoint", () => {
  const cs = solve([-2, 0, 3], {scale: "linear"});
  assert.deepStrictEqual(cs._colorScale.domain(), [-2, 0, 3]);
  const [low, mid, high] = [-2, 0, 3].map(v => colorOf(cs, v));
  assert.ok(reddish(low) && bluish(high));
  assert.strictEqual(mid, d3Color(cs.schema.colorDefaults.light).formatRgb());
});

it("linear — 2 values crossing zero, or a midpoint, take opposite poles", () => {
  for (const [values, midpoint] of [
    [[-1, 1], 0],
    [[0, 4], 1],
  ]) {
    const cs = solve(values, {scale: "linear", midpoint});
    assert.ok(reddish(colorOf(cs, values[0])), `${values} low`);
    assert.ok(bluish(colorOf(cs, values[1])), `${values} high`);
  }
});

it("a single value takes its pole on every scale", () => {
  for (const [value, pole] of [
    [4, bluish],
    [0, bluish],
    [-2, reddish],
  ])
    for (const scale of ["linear", "log", "buckets", "quantile"]) {
      const cs = solve([value, value], {scale});
      const c = colorOf(cs, value);
      assert.ok(c && pole(c), `${scale} ${value}: ${c}`);
    }
  const linear = solve([4], {scale: "linear"});
  assert.deepStrictEqual(linear._colorScale.domain(), [4, 4], "a solid bar");
  const buckets = solve([4], {scale: "buckets"});
  assert.deepStrictEqual(buckets._colorScale.domain(), [4], "one bucket");
});

it("buckets / quantile — 2 or 3 values crossing zero bucket each side apart", () => {
  for (const scale of ["buckets", "quantile"])
    for (const values of [
      [-1, 1],
      [-1, 0, 1],
      [-5, 2, 9],
    ]) {
      const cs = solve(values, {scale});
      const colors = values.map(v => colorOf(cs, v));
      assert.strictEqual(
        new Set(colors).size,
        values.length,
        `${scale} ${values}: ${colors}`,
      );
    }
});

it("jenks — 2 or 3 values crossing zero bucket each side apart", () => {
  const two = solve([-1, 1], {scale: "jenks"});
  assert.deepStrictEqual(two._colorScale.domain(), [-1, 0]);
  assert.ok(reddish(colorOf(two, -1)) && bluish(colorOf(two, 1)));

  for (const values of [
    [-1, 0, 1],
    [-5, 2, 9],
  ]) {
    const cs = solve(values, {scale: "jenks"});
    const colors = values.map(v => colorOf(cs, v));
    assert.strictEqual(new Set(colors).size, 3, `${values}: ${colors}`);
    assert.ok(reddish(colors[0]) && bluish(colors[2]), `${values}: ${colors}`);
  }

  const midpoint = solve([0, 4], {scale: "jenks", midpoint: 1});
  assert.ok(reddish(colorOf(midpoint, 0)) && bluish(colorOf(midpoint, 4)));
});
