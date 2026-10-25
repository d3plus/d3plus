import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {ColorScale} from "../../index.ts";
import {computeColorScale} from "../../src/components/ColorScale/colorScaleScale.ts";
import {
  colorScaleTypes,
  isBucketScale,
  resolveColorScaleType,
} from "../../src/components/ColorScale/colorScaleType.ts";

afterEach(() => vi.restoreAllMocks());

it("isBucketScale — jenks, buckets, and quantile draw as swatches", () => {
  assert.deepStrictEqual(colorScaleTypes.filter(isBucketScale), [
    "buckets",
    "jenks",
    "quantile",
  ]);
  assert.strictEqual(isBucketScale("linear"), false);
  assert.strictEqual(isBucketScale("log"), false);
});

it("resolveColorScaleType — returns a scale name as given", () => {
  for (const name of colorScaleTypes)
    assert.strictEqual(resolveColorScaleType(name, [1, 2]), name);
});

it("resolveColorScaleType — calls a function with the values, their extent, and the context", () => {
  const context = {};
  const calls = [];
  const scale = resolveColorScaleType(
    function (values, extent) {
      calls.push({self: this, values, extent});
      values.push(99);
      return "jenks";
    },
    [1, 4, 9],
    context,
  );
  assert.strictEqual(scale, "jenks");
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].self, context);
  assert.deepStrictEqual(calls[0].extent, [1, 9]);
  assert.deepStrictEqual(
    calls[0].values,
    [1, 4, 9, 99],
    "the function gets its own copy of the values",
  );
});

it("resolveColorScaleType — an empty value list has an undefined extent", () => {
  let seen;
  resolveColorScaleType(
    (values, extent) => ((seen = {values, extent}), "log"),
    [],
  );
  assert.deepStrictEqual(seen, {values: [], extent: [undefined, undefined]});
});

it("resolveColorScaleType — an unknown name warns and builds a linear scale", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  assert.strictEqual(
    resolveColorScaleType(() => "sqrt-ish", [1]),
    "linear",
  );
  assert.strictEqual(resolveColorScaleType("cubic-ish", [1]), "linear");
  assert.strictEqual(
    resolveColorScaleType(() => undefined, [1]),
    "linear",
  );
  assert.strictEqual(warn.mock.calls.length, 3);
  assert.match(
    warn.mock.calls[0][0],
    /unknown scale "sqrt-ish"; using "linear"/,
  );
  assert.match(warn.mock.calls[2][0], /unknown scale undefined/);
});

const rows = values => values.map((value, i) => ({id: i, value}));

it("computeColorScale — resolves a scale function once per render", () => {
  const seen = [];
  const cs = new ColorScale().scale(values => {
    seen.push(values);
    return values[values.length - 1] - values[0] > 5 ? "jenks" : "linear";
  });

  const small = computeColorScale(
    cs.data(rows([3, null, 1, NaN, 2, undefined, 4])),
  );
  assert.strictEqual(small.scale, "linear");
  assert.strictEqual(cs._scaleType, "linear");
  assert.deepStrictEqual(
    seen,
    [[1, 2, 3, 4]],
    "called once, with the sorted values and no null or NaN",
  );
  assert.strictEqual(small.ticks, undefined, "a gradient has no bucket ticks");

  const large = computeColorScale(cs.data(rows([1, 5, 20, 40, 80, 100])));
  assert.strictEqual(large.scale, "jenks");
  assert.strictEqual(cs._scaleType, "jenks");
  assert.strictEqual(seen.length, 2, "called again on the next render");
  assert.ok(large.ticks.length > 1, "jenks builds bucket ticks");
});

it("computeColorScale — a function can return each scale", () => {
  const values = rows([1, 2, 4, 8, 16, 32, 64]);
  for (const name of colorScaleTypes) {
    const cs = new ColorScale().data(values).scale(() => name);
    const out = computeColorScale(cs);
    assert.strictEqual(out.scale, name);
    assert.strictEqual(
      Array.isArray(out.ticks),
      isBucketScale(name),
      `${name}: bucket ticks only for a bucketed scale`,
    );
  }
});
