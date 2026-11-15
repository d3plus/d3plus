import {it} from "vitest";
import assert from "assert";
import {
  DENSE_SKIP,
  crowdedUpTo,
  thinEvenly,
} from "../../src/components/Axis/axisLabelThinning.ts";

/**
    `crowdedUpTo` finds the intervals at which every pair of labels surely
    crowds, which `thinEvenly` skips.
*/

/** Flat one-line labels `width` wide, `gap` apart, with `fP` padding. */
const labels = (n, gap, width, fP = 0) =>
  Array.from({length: n}, (_, i) => ({
    i,
    position: i * gap,
    width,
    height: 12,
    lines: ["x"],
    widths: [width],
    lineHeight: 12,
    fS: 10,
    fP,
    rotate: false,
    slant: false,
  }));

/** Whether labels `n` apart crowd, as `thinEvenly` tests them. */
const crowdsAt = (textData, n) =>
  textData.some(
    (b, i) =>
      i >= n &&
      Math.abs(b.position - textData[i - n].position) - b.width < b.fP,
  );

it("crowdedUpTo — every interval up to it crowds, the next may not", () => {
  for (const [gap, width, fP] of [
    [10, 35, 0],
    [10, 35, 5],
    [3, 100, 2],
    [7, 7, 0],
    [20, 5, 1],
    [0.5, 40, 3],
  ]) {
    const textData = labels(200, gap, width, fP);
    const upTo = crowdedUpTo(textData, true);
    for (let n = 1; n <= upTo; n++)
      assert.ok(crowdsAt(textData, n), `${gap}/${width}/${fP}: ${n} crowds`);
    assert.ok(
      !crowdsAt(textData, upTo + 2),
      `${gap}/${width}/${fP}: the bound is tight`,
    );
  }
});

it("crowdedUpTo — none for too few labels or sizes that aren't numbers", () => {
  assert.strictEqual(crowdedUpTo(labels(1, 10, 50), true), 0);
  assert.strictEqual(crowdedUpTo(labels(5, 100, 10), true), 0, "no crowding");
  const bad = labels(5, 10, 50);
  bad[2].position = NaN;
  assert.strictEqual(crowdedUpTo(bad, true), 0);
  assert.strictEqual(crowdedUpTo(labels(4, 0, 10), true), 4, "one spot");
});

it("thinEvenly — keeps the same interval as trying every one", () => {
  for (const [gap, width, fP] of [
    [10, 35, 0],
    [3, 100, 2],
    [20, 5, 1],
    [1, 40, 2],
  ]) {
    const textData = labels(300, gap, width, fP);
    let step = 1;
    while (step < textData.length && crowdsAt(textData, step)) step++;
    const expected = textData.filter(t => t.i % step === 0).map(t => t.i);
    thinEvenly(textData, true);
    const shown = textData.filter(t => !t.truncated).map(t => t.i);
    assert.deepStrictEqual(shown, expected, `${gap}/${width}/${fP}`);
  }
});

it("thinEvenly — labels measured per interval skip ahead only on a dense axis", () => {
  const tried = (gap, width) => {
    const textData = labels(300, gap, width, 2);
    const steps = [];
    thinEvenly(textData, true, (s, all) => !all && steps.push(s));
    return {steps, upTo: crowdedUpTo(textData, true)};
  };
  // Every third label surely crowds: below DENSE_SKIP, each interval is tried.
  const sparse = tried(10, 35);
  assert.ok(sparse.upTo >= 1 && sparse.upTo < DENSE_SKIP);
  assert.deepStrictEqual(sparse.steps, [2, 3, 4]);
  // Every 40th surely crowds: the search starts past them.
  const dense = tried(1, 40);
  assert.ok(dense.upTo >= DENSE_SKIP);
  assert.strictEqual(dense.steps[0], dense.upTo + 1);
  assert.ok(dense.steps.length <= 3);
});
