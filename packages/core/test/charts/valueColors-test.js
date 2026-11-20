import {it} from "vitest";
import assert from "assert";
import {
  fitColors,
  swatchColors,
  swatchGradient,
  thresholdDefaults,
  valueColorAt,
  valuePixelStops,
  valueScale,
  valueThresholds,
} from "../../src/charts/Plot/valueColors.ts";

// Value colors: marks colored by where they sit on the value axis.

const defaults = {
  below: "#ff0000",
  middle: "#ffaa00",
  above: "#00ff00",
  low: "#0000ff",
  high: "#ffff00",
};

it("valueThresholds — a number or a list, sorted and deduplicated", () => {
  assert.deepStrictEqual(valueThresholds(50), [50]);
  assert.deepStrictEqual(valueThresholds([60, 20, 60, 40]), [20, 40, 60]);
  assert.deepStrictEqual(
    valueThresholds([1, "2", NaN, Infinity, null]),
    [1],
    "only finite numbers",
  );
  assert.deepStrictEqual(valueThresholds(undefined), []);
  assert.deepStrictEqual(valueThresholds(false), []);
});

it("fitColors — as given, blended, or padded to fit", () => {
  assert.deepStrictEqual(fitColors(["#000", "#fff"], 2), ["#000", "#fff"]);
  const three = fitColors(["#000000", "#ffffff"], 3);
  assert.strictEqual(three.length, 3);
  assert.strictEqual(three[0], "rgb(0, 0, 0)");
  assert.strictEqual(three[2], "rgb(255, 255, 255)");
  assert.notStrictEqual(three[1], three[0], "a blended middle");
  assert.deepStrictEqual(
    fitColors(["red", null], 3),
    ["red", null, null],
    "a series color can't blend: the last repeats",
  );
  assert.deepStrictEqual(fitColors(["red", "blue", "green"], 2), [
    "rgb(255, 0, 0)",
    "rgb(0, 128, 0)",
  ]);
  assert.deepStrictEqual(fitColors(["red"], 2), ["red", "red"]);
  assert.deepStrictEqual(fitColors([], 2), []);
  assert.deepStrictEqual(fitColors(["red"], 0), []);
});

it("thresholdDefaults — off and on, or a traffic light", () => {
  assert.deepStrictEqual(thresholdDefaults(2, defaults), [
    "#ff0000",
    "#00ff00",
  ]);
  assert.deepStrictEqual(thresholdDefaults(3, defaults), [
    "#ff0000",
    "#ffaa00",
    "#00ff00",
  ]);
  const four = thresholdDefaults(4, defaults);
  assert.strictEqual(four.length, 4);
  assert.strictEqual(four[0], "rgb(255, 0, 0)", "red at the bottom");
  assert.strictEqual(four[3], "rgb(0, 255, 0)", "green at the top");
});

it("valueScale — bands or a gradient, from one valueColors object", () => {
  for (const off of [undefined, false, null, [50], "red"])
    assert.strictEqual(valueScale(off, [0, 10], defaults), undefined, `${off}`);
  assert.deepStrictEqual(
    valueScale({values: [50]}, [0, 100], defaults),
    {kind: "threshold", values: [50], colors: ["#ff0000", "#00ff00"]},
    "a threshold by default, below and above",
  );
  assert.deepStrictEqual(
    valueScale({values: 50}, undefined, defaults).values,
    [50],
    "a single value",
  );
  assert.strictEqual(
    valueScale({type: "threshold"}, [0, 10], defaults),
    undefined,
    "thresholds need values",
  );
  assert.deepStrictEqual(
    valueScale(
      {values: [10, 20], colors: ["a", "b", null]},
      undefined,
      defaults,
    ),
    {kind: "threshold", values: [10, 20], colors: ["a", "b", null]},
  );
  assert.deepStrictEqual(
    valueScale({values: [10, 20]}, undefined, defaults).colors,
    ["#ff0000", "#ffaa00", "#00ff00"],
    "three bands: a traffic light",
  );
  assert.deepStrictEqual(
    valueScale({type: "gradient"}, [0, 30], defaults),
    {kind: "gradient", values: [0, 30], colors: ["#0000ff", "#ffff00"]},
    "no values spans the data",
  );
  assert.deepStrictEqual(
    valueScale({type: "gradient", values: true}, [0, 30], defaults).values,
    [0, 30],
    "and so does true",
  );
  assert.strictEqual(
    valueScale({type: "gradient"}, undefined, defaults),
    undefined,
    "a gradient across no data",
  );
  assert.deepStrictEqual(
    valueScale(
      {type: "gradient", values: [0, 15, 30], colors: ["a", "b", "c"]},
      [5, 6],
      defaults,
    ),
    {kind: "gradient", values: [0, 15, 30], colors: ["a", "b", "c"]},
    "one color per value",
  );
  assert.deepStrictEqual(
    valueScale(
      {type: "gradient", values: [0, 100], colors: ["a", "b", "c"]},
      undefined,
      defaults,
    ),
    {kind: "gradient", values: [0, 50, 100], colors: ["a", "b", "c"]},
    "more colors than values spread evenly",
  );
  const flat = valueScale({type: "gradient"}, [4, 4], defaults);
  assert.deepStrictEqual(flat.values, [4], "a flat series has one stop");
  assert.deepStrictEqual(
    flat.colors,
    fitColors(["#0000ff", "#ffff00"], 1),
    "in the palette's middle color",
  );
  assert.deepStrictEqual(
    valueScale({values: 5, colors: "#123"}, [0, 9], defaults).colors,
    ["#123", "#123"],
    "a single color string",
  );
});

it("valueColorAt — a value's band, or its blend along a gradient", () => {
  const bands = {
    kind: "threshold",
    values: [10, 20],
    colors: ["a", null, "c"],
  };
  assert.strictEqual(valueColorAt(bands, 5, "own"), "a");
  assert.strictEqual(
    valueColorAt(bands, 10, "own"),
    "own",
    "on a threshold: above",
  );
  assert.strictEqual(valueColorAt(bands, 25, "own"), "c");
  assert.strictEqual(
    valueColorAt(bands, "15", "own"),
    "own",
    "numeric strings",
  );
  assert.strictEqual(valueColorAt(bands, null, "own"), undefined);
  assert.strictEqual(valueColorAt(bands, NaN, "own"), undefined);
  const blend = {
    kind: "gradient",
    values: [0, 10],
    colors: ["#000000", "#ffffff"],
  };
  assert.strictEqual(valueColorAt(blend, -5, "own"), "#000000");
  assert.strictEqual(valueColorAt(blend, 15, "own"), "#ffffff");
  assert.strictEqual(valueColorAt(blend, 5, "own"), "rgb(128, 128, 128)");
});

it("valuePixelStops — hard stops at thresholds, soft at gradient values, over the axis span", () => {
  // y axis: value 0 at 200px, 100 at 0px.
  const y = v => 200 - v * 2;
  const bands = {kind: "threshold", values: [50], colors: ["red", "green"]};
  assert.deepStrictEqual(valuePixelStops(bands, y, [200, 0], "own"), {
    lo: 0,
    hi: 200,
    stops: [
      {offset: 0.5, color: "green"},
      {offset: 0.5, color: "red"},
    ],
  });
  // x axis: values run with pixels.
  const x = v => v * 4;
  assert.deepStrictEqual(
    valuePixelStops(bands, x, [0, 400], "own").stops,
    [
      {offset: 0.5, color: "red"},
      {offset: 0.5, color: "green"},
    ],
    "low values first along x",
  );
  const outside = valuePixelStops(
    {kind: "threshold", values: [150], colors: ["red", null]},
    y,
    [200, 0],
    "own",
  );
  assert.deepStrictEqual(
    outside,
    {
      lo: -100,
      hi: 200,
      stops: [
        {offset: 0, color: "own"},
        {offset: 0, color: "red"},
      ],
    },
    "a threshold past the axis widens the span",
  );
  const blend = valuePixelStops(
    {kind: "gradient", values: [0, 100], colors: ["blue", "yellow"]},
    y,
    [200, 0],
    "own",
  );
  assert.deepStrictEqual(blend.stops, [
    {offset: 0, color: "yellow"},
    {offset: 1, color: "blue"},
  ]);
  assert.strictEqual(
    valuePixelStops(bands, () => NaN, [200, 0], "own"),
    undefined,
    "no stop on the axis (a log axis at 0)",
  );
  assert.strictEqual(
    valuePixelStops(bands, () => 5, [5, 5], "own"),
    undefined,
    "no span",
  );
});

it("swatchColors and swatchGradient — a legend swatch's colors in equal steps", () => {
  const bands = {kind: "threshold", values: [10], colors: ["red", null]};
  assert.deepStrictEqual(swatchColors(bands, "blue"), ["red", "blue"]);
  assert.deepStrictEqual(swatchGradient(bands, "blue", true), {
    type: "linear",
    from: [0, 0],
    to: [1, 0],
    stops: [
      {offset: 0, color: "red"},
      {offset: 0.5, color: "red"},
      {offset: 0.5, color: "blue"},
      {offset: 1, color: "blue"},
    ],
  });
  const blend = {kind: "gradient", values: [0, 1], colors: ["a", "b"]};
  assert.deepStrictEqual(swatchGradient(blend, "own", false), {
    type: "linear",
    from: [0, 1],
    to: [0, 0],
    stops: [
      {offset: 0, color: "a"},
      {offset: 1, color: "b"},
    ],
  });
});
