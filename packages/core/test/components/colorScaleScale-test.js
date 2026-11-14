import {it} from "vitest";
import assert from "assert";
import {color as d3Color} from "d3-color";
import {ColorScale} from "../../index.ts";
import {
  centeredStops,
  colorScaleBucketCount,
  divergingQuantiles,
  divergingThresholds,
  mergeLogStops,
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
    for (const scale of ["linear", "log", "buckets", "quantile", "jenks"]) {
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
      assert.deepStrictEqual(
        cs._colorScale.domain(),
        scale === "quantile"
          ? divergingQuantiles(values, midpoint, count / 2)
          : thresholds,
        label,
      );
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

/** The `rgb(…)` form of a color string. */
const rgb = c => d3Color(c).formatRgb();

it("linear — a color array through the midpoint color spans each side evenly", () => {
  const {off, light, sequential} = new ColorScale().schema.colorDefaults;
  for (const scale of ["linear", "buckets"])
    for (const [color, domain] of [
      [
        [off, light, sequential],
        [-10, 0, 10],
      ],
      [
        [off, "#f4a582", light, "#92c5de", sequential],
        [-10, -5, 0, 5, 10],
      ],
      [
        [off, "#f4a582", "#fddbc7", light, sequential],
        [-9, -6, -3, 0, 6],
      ],
    ]) {
      const values = [domain[0], -1, 1, domain.at(-1)];
      const label = `${scale} ${color.length} colors`;
      const cs = solve(values, {scale, color});
      assert.deepStrictEqual(cs._colorScale.domain(), domain, label);
      assert.strictEqual(colorOf(cs, domain[0]), rgb(off), `${label}: low`);
      assert.strictEqual(
        colorOf(cs, domain.at(-1)),
        rgb(sequential),
        `${label}: high`,
      );
      if (scale === "linear")
        assert.notStrictEqual(
          colorOf(cs, domain.at(-1) - 1),
          rgb(sequential),
          `${label}: the high color is reached only at the top`,
        );
    }
});

it("centeredStops — each side of the midpoint spaces its own colors evenly", () => {
  assert.deepStrictEqual(centeredStops(-10, 0, 10, 1, 1), [-10, 0, 10]);
  assert.deepStrictEqual(centeredStops(-10, 0, 10, 2, 2), [-10, -5, 0, 5, 10]);
  assert.deepStrictEqual(
    centeredStops(-9, 0, 6, 3, 1),
    [-9, -6, -3, 0, 6],
    "uneven sides",
  );
  assert.deepStrictEqual(centeredStops(-4, 1, 9, 1, 2), [-4, 1, 5, 9]);
  assert.deepStrictEqual(centeredStops(-10, 0, 10, 0, 2), [0, 5, 10]);
  assert.deepStrictEqual(centeredStops(-10, 0, 10, 2, 0), [-10, -5, 0]);
  for (const below of [1, 2, 3, 6, 7])
    for (const above of [1, 2, 3, 6, 7]) {
      const stops = centeredStops(-0.7, 0, 0.3, below, above);
      assert.strictEqual(stops.length, below + 1 + above, `${below}/${above}`);
      assert.strictEqual(stops[0], -0.7);
      assert.strictEqual(stops.at(-1), 0.3);
    }
});

it("log — a pole of exactly 1 or -1 takes its own color, once", () => {
  const {off, light, sequential} = new ColorScale().schema.colorDefaults;
  for (const values of [
    [-10, -5, 1],
    [-1, 0.5, 1],
    [-10, -8, -5, -2, 0.5, 1],
    [-1, -0.5, 2, 4, 8, 10],
    [-1, -0.8, -0.5, 0.2, 0.5, 1],
  ]) {
    const cs = solve(values, {scale: "log"});
    const domain = cs._colorScale.domain();
    const label = `${values} → ${domain}`;
    assert.ok(
      domain.every((d, i) => !i || d > domain[i - 1]),
      `${label}: the stops ascend`,
    );
    assert.strictEqual(
      domain.length,
      cs._colorScale.range().length,
      `${label}: a color per stop`,
    );
    assert.strictEqual(colorOf(cs, values[0]), rgb(off), `${label}: low`);
    assert.strictEqual(
      colorOf(cs, values.at(-1)),
      rgb(sequential),
      `${label}: high`,
    );
    // The midpoint stays between the sides: at -1 when the high pole is 1.
    const midpoint = values.at(-1) === 1 ? -1 : 1;
    if (values[0] < -1 || values.at(-1) > 1)
      assert.strictEqual(
        colorOf(cs, midpoint),
        rgb(light),
        `${label}: the midpoint`,
      );
  }
});

it("mergeLogStops — stops on one value keep the color farthest from the midpoint", () => {
  assert.deepStrictEqual(mergeLogStops([-10, 1, 1], ["a", "b", "c"]), {
    stops: [-10, 1],
    colors: ["a", "c"],
  });
  assert.deepStrictEqual(
    mergeLogStops([-1, -1, 1, 3, 10], ["a", "b", "c", "d", "e"]),
    {stops: [-1, 1, 3, 10], colors: ["a", "c", "d", "e"]},
  );
  assert.deepStrictEqual(
    mergeLogStops([-1, -1, 1, 1, 1], ["a", "b", "c", "d", "e"]),
    {stops: [-1, 1], colors: ["a", "e"]},
  );
  assert.deepStrictEqual(
    mergeLogStops([-10, -3, 1, 3, 10], ["a", "b", "c", "d", "e"]),
    {stops: [-10, -3, 1, 3, 10], colors: ["a", "b", "c", "d", "e"]},
    "distinct stops",
  );
  assert.deepStrictEqual(
    mergeLogStops([1, 1], ["a", "b"]),
    {stops: [1, 1], colors: ["a", "b"]},
    "a single value keeps both stops",
  );
});

const longTails = [-100, -4, -3, -2, -1, 1, 2, 3, 4, 100];

it("quantile — a diverging scale splits each side at its values' quantiles", () => {
  for (const [buckets, thresholds] of [
    [5, [-100, -2.5, 0, 2.5, 100]],
    [4, [-100, -2.5, 0, 2.5]],
  ]) {
    const cs = solve(longTails, {scale: "quantile", buckets});
    const label = `${buckets} → ${cs._colorScale.domain()}`;
    assert.deepStrictEqual(cs._colorScale.domain(), thresholds, label);
    const below = longTails.filter(v => v < 0).map(v => colorOf(cs, v));
    const counts = [...new Set(below)].map(c => below.filter(d => d === c));
    assert.deepStrictEqual(
      counts.map(d => d.length),
      [3, 2],
      `${label}: the negative values split evenly`,
    );
    assert.ok(reddish(colorOf(cs, -100)), `${label}: low pole`);
    assert.ok(bluish(colorOf(cs, 100)), `${label}: high pole`);
  }
});

it("divergingQuantiles — each side splits its own values, up to the midpoint", () => {
  assert.deepStrictEqual(divergingQuantiles(longTails, 0, 1), [-100, 0]);
  assert.deepStrictEqual(
    divergingQuantiles(longTails, 0, 2),
    [-100, -2.5, 0, 2.5],
  );
  assert.deepStrictEqual(
    divergingQuantiles([-9, -1, 0, 1, 3, 4, 5, 9], 0, 2),
    [-9, -1, 0, 3],
    "the midpoint counts as a positive value",
  );
  assert.deepStrictEqual(
    divergingQuantiles([-4, 1, 2, 3, 9], 2, 2),
    [-4, 1, 2, 2.5],
    "a midpoint of 2",
  );
  assert.deepStrictEqual(
    divergingQuantiles([-5, 1, 2, 3, 4, 5], 0, 2),
    [-5, -2.5, 0, 2.5],
    "one value below the midpoint",
  );
  assert.deepStrictEqual(divergingQuantiles([-1, 1], 0, 0), [], "no buckets");
});

it("jenks — only-negative values take the low pole's ramp, like the other scales", () => {
  const values = [-9, -8, -5, -4, -2, -1];
  const luminance = c => {
    const {r, g, b} = d3Color(c).rgb();
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const buckets = solve(values, {scale: "buckets"});
  const jenks = solve(values, {scale: "jenks"});
  const colors = values.map(v => colorOf(jenks, v));
  assert.ok(colors.every(reddish), `red: ${colors}`);
  assert.strictEqual(colors[0], colorOf(buckets, values[0]), "the pole");
  assert.ok(
    luminance(colors[0]) < luminance(colors.at(-1)),
    `the darkest color is the most negative: ${colors}`,
  );
});
