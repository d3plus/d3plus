import {it} from "vitest";
import assert from "assert";
import {formatAbbreviate} from "@d3plus/format";
import {ColorScale} from "../../index.ts";
import {
  bucketBounds,
  decimalPlaces,
} from "../../src/components/ColorScale/bucketBounds.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("ColorScale", async () => {
  await new Promise(cb => {
    new ColorScale().render(cb);
  });

  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.getElementsByClassName("d3plus-ColorScale").length,
    1,
    "created <g> container element",
  );
});

/** Every bucket label the default bucketFormat gives `ticks` over `values`. */
const bucketLabels = (ticks, values, cs = new ColorScale()) =>
  ticks.map((tick, i) => cs.bucketFormat()(tick, i, ticks, values));

it("decimalPlaces — the decimals a value is written with", () => {
  assert.strictEqual(decimalPlaces(12), 0);
  assert.strictEqual(decimalPlaces(1990), 0);
  assert.strictEqual(decimalPlaces(2.5), 1);
  assert.strictEqual(decimalPlaces(-0.25), 2);
  assert.strictEqual(decimalPlaces(0.0123), 4);
  assert.strictEqual(decimalPlaces(0), 0);
  assert.strictEqual(decimalPlaces(0.1 + 0.2), 1, "ignores float noise");
  assert.strictEqual(decimalPlaces(1.1 * 3), 1, "ignores float noise");
});

it("bucketBounds — the first and last values the data can write", () => {
  const format = String;
  const ints = [1, 2, 3, 4, 5, 8, 11];
  assert.deepStrictEqual(bucketBounds(1, 0, [1, 3, 5], ints, format), [1, 2]);
  assert.deepStrictEqual(
    bucketBounds(1, 0, [1, 3.5, 6], ints, format),
    [1, 3],
    "an upper tick between data values",
  );
  assert.deepStrictEqual(
    bucketBounds(3.5, 1, [1, 3.5, 6], ints, format),
    [4, 5],
    "a lower tick between data values",
  );
  assert.deepStrictEqual(
    bucketBounds(1.1, 0, [1.1, 1.3], [1.1, 1.2, 1.3], format),
    [1.1, 1.2],
    "steps without float noise",
  );
  assert.deepStrictEqual(
    bucketBounds(1, 1, [1, 1, 5], ints, format),
    [2, 4],
    "a repeated first tick starts the next bucket a step above it",
  );
  assert.deepStrictEqual(
    bucketBounds(1000, 0, [1000, 1500], [1000, 1250, 1500], v =>
      formatAbbreviate(v),
    ),
    [1000, 1490],
    "drops a place when the upper bound would print as the next tick",
  );
});

it("bucketFormat — integer data gives whole, contiguous buckets", () => {
  const values = [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  assert.deepStrictEqual(bucketLabels([1, 3, 5, 8, 11], values), [
    "1 - 2",
    "3 - 4",
    "5 - 7",
    "8 - 10",
    "11+",
  ]);
  assert.deepStrictEqual(
    bucketLabels([1, 3, 5, 8, 14], values),
    ["1 - 2", "3 - 4", "5 - 7", "8 - 13", "14"],
    "no '+' when the last bucket starts at the max",
  );
  assert.deepStrictEqual(
    bucketLabels([1, 2, 3], [1, 2, 3]),
    ["1", "2", "3"],
    "a one-value bucket prints that value",
  );
});

it("bucketFormat — decimal data steps at its own precision", () => {
  const values = [1, 1.4, 1.9, 2.5, 3.2, 4.8];
  assert.deepStrictEqual(bucketLabels([1, 2, 3.2], values), [
    "1 - 1.9",
    "2 - 3.1",
    "3.2+",
  ]);
  assert.deepStrictEqual(
    bucketLabels([1, 2.25, 3.5], values),
    ["1 - 2.2", "2.3 - 3.4", "3.5+"],
    "ticks between data values snap to it",
  );
});

it("bucketFormat — mixed magnitudes and negative values", () => {
  assert.deepStrictEqual(bucketLabels([0.5, 3, 1200], [0.5, 3, 1200, 45000]), [
    "0.5 - 2.9",
    "3 - 1.19k",
    "1.2k+",
  ]);
  assert.deepStrictEqual(
    bucketLabels([10000, 15000, 20000], [10000, 12500, 15000, 20000, 24000]),
    ["10k - 14.9k", "15k - 19.9k", "20k+"],
    "abbreviated bounds stay distinct",
  );
  assert.deepStrictEqual(
    bucketLabels([-5, -2.5, 0], [-5, -3.5, -2.5, -1, 0, 2.5]),
    ["-5 - -2.6", "-2.5 - -0.1", "0+"],
  );
  assert.deepStrictEqual(bucketLabels([-10, -4, 3], [-10, -7, -4, 0, 3, 9]), [
    "-10 - -5",
    "-4 - 2",
    "3+",
  ]);
});

it("bucketFormat — leaves the values array in its order", () => {
  const values = [1, 2, 3, 4, 5, 6];
  bucketLabels([1, 3, 5], values);
  assert.deepStrictEqual(values, [1, 2, 3, 4, 5, 6]);
});
