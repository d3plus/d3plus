import {it} from "vitest";
import assert from "assert";
import {color as d3Color} from "d3-color";
import {ColorScale} from "../../index.ts";
import {
  colorScaleBucketCount,
  divergingThresholds,
} from "../../src/components/ColorScale/colorScaleScale.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("colorScaleBucketCount — the buckets setting, capped at the unique values", () => {
  for (const n of [1, 2, 3, 4, 5])
    assert.strictEqual(colorScaleBucketCount(5, n, false), n, `${n} values`);
  assert.strictEqual(colorScaleBucketCount(5, 9, false), 5);
  assert.strictEqual(colorScaleBucketCount([0, 1, 2], 9, false), 3, "array");
  assert.strictEqual(colorScaleBucketCount(undefined, 4, false), 4);
});

it("colorScaleBucketCount — a diverging cap is odd and at least 3", () => {
  assert.deepStrictEqual(
    [2, 3, 4, 5, 6, 7].map(n => colorScaleBucketCount(5, n, true)),
    [3, 3, 3, 3, 5, 5],
  );
  assert.strictEqual(colorScaleBucketCount(7, 9, true), 7);
});

it("colorScaleBucketCount — a diverging buckets setting under 3 applies", () => {
  for (const n of [2, 3, 9]) {
    assert.strictEqual(colorScaleBucketCount(2, n, true), 2, `2 of ${n}`);
    assert.strictEqual(colorScaleBucketCount(1, n, true), 1, `1 of ${n}`);
  }
  assert.strictEqual(colorScaleBucketCount([0, 1], 9, true), 2, "array");
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

it("an explicit buckets setting under 3 applies to a diverging scale", () => {
  for (const scale of ["linear", "log", "buckets", "quantile"])
    for (const values of [
      [-1, 1],
      [-1, 0, 1],
      [-5, 2, 9],
      [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9],
    ]) {
      const label = `${scale} ${values}`;
      const two = solve(values, {scale, buckets: 2});
      const twoColors = values.map(v => colorOf(two, v));
      assert.ok(twoColors.every(Boolean), `${label}, 2: ${twoColors}`);
      assert.ok(reddish(twoColors[0]), `${label}, 2: low ${twoColors}`);
      assert.ok(bluish(twoColors.at(-1)), `${label}, 2: high ${twoColors}`);
      const mid = d3Color(two.schema.colorDefaults.light).formatRgb();
      if (["buckets", "quantile"].includes(scale))
        assert.ok(!twoColors.includes(mid), `${label}, 2: no midpoint color`);

      const one = solve(values, {scale, buckets: 1});
      const oneColors = values.map(v => colorOf(one, v));
      assert.ok(oneColors.every(Boolean), `${label}, 1: ${oneColors}`);
      assert.strictEqual(new Set(oneColors).size, 1, `${label}, 1: one color`);
    }
});

it("divergingThresholds — each side of the midpoint splits its own span evenly", () => {
  assert.deepStrictEqual(divergingThresholds(-9, 0, 9, 1), [-9, 0]);
  assert.deepStrictEqual(divergingThresholds(-9, 0, 9, 2), [-9, -4.5, 0, 4.5]);
  assert.deepStrictEqual(
    divergingThresholds(-9, 0, 9, 3),
    [-9, -6, -3, 0, 3, 6],
  );
  assert.deepStrictEqual(
    divergingThresholds(-4, 0, 12, 2),
    [-4, -2, 0, 6],
    "an asymmetric domain",
  );
  assert.deepStrictEqual(divergingThresholds(-4, 0, 12, 3), [
    -4,
    -4 + 4 / 3,
    -4 + 2 * (4 / 3),
    0,
    4,
    8,
  ]);
  assert.deepStrictEqual(
    divergingThresholds(-3, 1, 9, 2),
    [-3, -1, 1, 5],
    "a midpoint of 1",
  );
  assert.deepStrictEqual(divergingThresholds(-1, 0, 1, 0), [], "no buckets");
});

const tenValues = [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9];
const skewed = [-4, -3.5, -3, -2, -1, -0.5, 1, 2, 4, 6, 8, 10, 12];
// Off the bucket edges, so each side's values fall into mirrored buckets.
const mirrored = [-9, -8, -5, -2, -1, 1, 2, 5, 8, 9];

it("buckets / quantile — an even count splits each side of the midpoint evenly", () => {
  for (const scale of ["buckets", "quantile"])
    for (const [values, midpoint, count, thresholds] of [
      [tenValues, 0, 2, [-9, 0]],
      [tenValues, 0, 4, [-9, -4.5, 0, 4.5]],
      [tenValues, 0, 6, [-9, -6, -3, 0, 3, 6]],
      [skewed, 0, 4, [-4, -2, 0, 6]],
      [skewed, 0, 6, [-4, -4 + 4 / 3, -4 + 2 * (4 / 3), 0, 4, 8]],
      [skewed, 1, 4, [-4, -1.5, 1, 6.5]],
    ]) {
      const label = `${scale} ${count} over ${values} (midpoint ${midpoint})`;
      const cs = solve(values, {scale, buckets: count, midpoint});
      assert.deepStrictEqual(cs._colorScale.domain(), thresholds, label);
      const below = values.filter(v => v < midpoint);
      const above = values.filter(v => v >= midpoint);
      const colorsBelow = new Set(below.map(v => colorOf(cs, v)));
      const colorsAbove = new Set(above.map(v => colorOf(cs, v)));
      assert.ok(
        [...colorsBelow].every(c => !colorsAbove.has(c)),
        `${label}: the sides share no color`,
      );
      assert.ok(reddish(colorOf(cs, values[0])), `${label}: low pole`);
      assert.ok(bluish(colorOf(cs, values.at(-1))), `${label}: high pole`);
    }
});

it("buckets — an even count over a symmetric domain mirrors its colors", () => {
  for (const count of [2, 4, 6]) {
    const cs = solve(mirrored, {scale: "buckets", buckets: count});
    const below = mirrored.filter(v => v < 0).map(v => colorOf(cs, v));
    const above = mirrored.filter(v => v > 0).map(v => colorOf(cs, v));
    assert.strictEqual(new Set(below).size, count / 2, `${count} below`);
    assert.strictEqual(new Set(above).size, count / 2, `${count} above`);
    assert.deepStrictEqual(
      below.map(c => below.indexOf(c)),
      above
        .slice()
        .reverse()
        .map(c => above.slice().reverse().indexOf(c)),
      `${count}: the sides step at the same values`,
    );
  }
});

it("linear / log — an even count ramps from low through the midpoint to high", () => {
  for (const scale of ["linear", "log"])
    for (const count of [2, 4, 6])
      for (const values of [tenValues, skewed]) {
        const label = `${scale} ${count} over ${values}`;
        const cs = solve(values, {scale, buckets: count});
        const range = cs._colorScale.range();
        assert.strictEqual(range.length, count + 1, `${label}: stops`);
        assert.strictEqual(
          cs._colorScale.domain().length,
          range.length,
          `${label}: a value for every stop`,
        );
        const mid = d3Color(cs.schema.colorDefaults.light).formatRgb();
        const [low, high] = [values[0], values.at(-1)];
        assert.ok(reddish(colorOf(cs, low)), `${label}: low pole`);
        assert.ok(bluish(colorOf(cs, high)), `${label}: high pole`);
        // A log scale draws its midpoint of 0 at 1.
        const midpoint = scale === "log" ? 1 : 0;
        assert.strictEqual(colorOf(cs, midpoint), mid, `${label}: midpoint`);
        const nearHigh = values.at(-2);
        assert.notStrictEqual(
          colorOf(cs, nearHigh),
          colorOf(cs, high),
          `${label}: the high color is reached only at the top`,
        );
      }
});
