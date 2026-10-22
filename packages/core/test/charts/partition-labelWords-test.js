import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  labelFitDefaults,
  labelMetrics,
  largestFontSize,
  measureLabel,
  partitionSplit,
  wrapLineCount,
} from "../../src/charts/partition/labelWords.ts";

useJsdom();

it("partition labelWords: labelFitDefaults fills unset options", () => {
  assert.deepStrictEqual(labelFitDefaults(), {
    fontMin: 8,
    fontMax: 24,
    padding: 2,
    lineHeight: 1.2,
    maxLines: 3,
  });
  assert.strictEqual(labelFitDefaults({fontMax: 12}).fontMax, 12);
});

it("partition labelWords: partitionSplit breaks only at spaces", () => {
  assert.deepStrictEqual(
    partitionSplit("Containerization orchestration").map(w => w.trim()),
    ["Containerization", "orchestration"],
  );
  assert.ok(partitionSplit("API Reference").every(w => !w.includes("­")));
});

it("partition labelWords: labelMetrics measures words and the space at 1px", () => {
  assert.deepStrictEqual(
    labelMetrics("Docs Guides", s => s.map(w => w.length)),
    {words: [4, 6], space: 1},
  );
  assert.deepStrictEqual(
    labelMetrics("   ", () => []),
    {words: [], space: 0},
  );
});

it("partition labelWords: measureLabel returns one width per word", () => {
  const metrics = measureLabel("API Reference", {}, {});
  assert.strictEqual(metrics.words.length, 2);
  assert.ok(metrics.words.every(w => Number.isFinite(w) && w >= 0));
  assert.ok(Number.isFinite(metrics.space));
  const accessor = measureLabel(
    "API",
    {},
    {fontWeight: () => 700, fontFamily: () => ["Arial"]},
  );
  assert.strictEqual(accessor.words.length, 1);
});

it("partition labelWords: wrapLineCount wraps between words, Infinity for a word wider than the line", () => {
  const metrics = {words: [4, 6], space: 1};
  assert.strictEqual(wrapLineCount(metrics, 1, 11), 1);
  assert.strictEqual(wrapLineCount(metrics, 1, 10), 2);
  assert.strictEqual(wrapLineCount(metrics, 2, 10), Infinity);
  assert.strictEqual(wrapLineCount({words: [], space: 0}, 1, 5), 1);
});

it("partition labelWords: largestFontSize binary-searches the largest fitting whole size", () => {
  assert.strictEqual(
    largestFontSize(s => s <= 13, 8, 24),
    13,
  );
  assert.strictEqual(
    largestFontSize(() => true, 8, 24),
    24,
  );
  assert.strictEqual(
    largestFontSize(() => false, 8, 24),
    null,
  );
  assert.strictEqual(
    largestFontSize(() => true, 10, 6),
    10,
    "fontMax below fontMin",
  );
});
