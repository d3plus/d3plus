import assert from "assert";
import {scaleLinear} from "d3-scale";
import {
  brokenScale,
  brokenScaleTicks,
  isBrokenScale,
  normalizeBreaks,
} from "../../es/internal.js";

/**
    Piecewise scales behind axis breaks (#766): removed value ranges collapse
    to a fixed pixel gap and the rest of the domain shares one rate.
*/

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ""} (${a} vs ${b})`);

it("normalizeBreaks reads a single pair or a list, flipping, merging, and dropping bad ranges", () => {
  assert.deepStrictEqual(normalizeBreaks([100, 900], 0, 1000), [[100, 900]], "single pair");
  assert.deepStrictEqual(normalizeBreaks([900, 100], 0, 1000), [[100, 900]], "reversed pair flipped");
  assert.deepStrictEqual(
    normalizeBreaks([[600, 800], [100, 300], [250, 400]], 0, 1000),
    [[100, 400], [600, 800]],
    "sorted, overlaps merged",
  );
  assert.deepStrictEqual(normalizeBreaks([[100, 200], [200, 300]], 0, 1000), [[100, 300]], "touching ranges merged");
  assert.deepStrictEqual(normalizeBreaks([[5, 5], ["a", 3], [1], [2, 4]], 0, 10), [[2, 4]], "empty/non-numeric/short dropped");
  assert.deepStrictEqual(normalizeBreaks([-50, 500], 0, 1000), [], "starts outside the domain");
  assert.deepStrictEqual(normalizeBreaks([500, 1000], 0, 1000), [], "touching a domain end");
  assert.deepStrictEqual(normalizeBreaks([-10, 2000], 0, 1000), [], "swallows the whole domain");
  assert.deepStrictEqual(normalizeBreaks(false, 0, 1000), []);
  assert.deepStrictEqual(normalizeBreaks(undefined, 0, 1000), []);
  assert.deepStrictEqual(normalizeBreaks([], 0, 1000), []);
});

it("brokenScale collapses each break to its fixed space and shares one rate elsewhere", () => {
  // 0–1000 over 0–436px with [100, 900] removed: 200 kept units over 400px.
  const s = brokenScale({domain: [0, 1000], range: [0, 436], breaks: [[100, 900]], space: 36});
  close(s(0), 0);
  close(s(100), 200, "break start");
  close(s(900), 236, "break end, one space later");
  close(s(1000), 436);
  close(s(50), 100, "kept values share the 2px/unit rate");
  close(s(950), 336);
  close(s(500), 218, "values inside the break interpolate across it");
  assert.deepStrictEqual(s.domain(), [0, 1000], "reports the plain domain");
  assert.deepStrictEqual(s.range(), [0, 436], "reports the plain range");
  close(s.invert(336), 950, "invert");
  assert.ok(isBrokenScale(s));
  assert.ok(!isBrokenScale(scaleLinear()));
});

it("brokenScale follows a descending domain, like a y axis", () => {
  const s = brokenScale({domain: [1000, 0], range: [0, 436], breaks: [[100, 900]], space: 36});
  close(s(1000), 0, "max at the top");
  close(s(0), 436, "min at the bottom");
  close(s(900), 200);
  close(s(100), 236);
  assert.deepStrictEqual(s.segments(), [
    {domain: [1000, 900], range: [0, 200]},
    {domain: [100, 0], range: [236, 436]},
  ]);
});

it("brokenScale handles several breaks", () => {
  const s = brokenScale({domain: [0, 100], range: [0, 172], breaks: [[10, 40], [60, 90]], space: 36});
  // 40 kept units over 100px: 2.5px per unit.
  close(s(10), 25);
  close(s(40), 61);
  close(s(60), 111);
  close(s(90), 147);
  close(s(100), 172);
  assert.strictEqual(s.segments().length, 3);
});

it("brokenScale maps a baseline edge break outside its domain", () => {
  const edge = {value: 0, position: 400, edge: 1100, edgePosition: 364};
  const s = brokenScale({domain: [2100, 1100], range: [0, 364], breaks: [], space: 36, edge});
  close(s(0), 400, "baseline at the axis end");
  close(s(-50), 400, "beyond the baseline pins to the end");
  close(s(550), 382, "between baseline and domain interpolates");
  close(s(1100), 364);
  close(s(2100), 0);
  close(s.invert(400), 0);
  close(s.invert(382), 550);
  close(s.invert(0), 2100);
  assert.deepStrictEqual(s.range(), [0, 364], "the range stops at the break");
});

it("brokenScale copy, setters, and ticks", () => {
  const s = brokenScale({domain: [0, 1000], range: [0, 436], breaks: [[100, 900]], space: 36});
  const c = s.copy();
  close(c(950), 336, "copy maps the same");
  c.range([0, 872]);
  close(c(1000), 872, "range setter rebuilds");
  close(s(1000), 436, "original untouched");
  c.domain([0, 2000]);
  assert.deepStrictEqual(c.domain(), [0, 2000], "domain setter");
  const ticks = s.ticks(10);
  assert.ok(!ticks.some(t => t > 100 && t < 900), "no ticks inside the break");
  assert.ok(ticks.includes(0) && ticks.includes(1000));
});

it("brokenScaleTicks ticks each segment as its own axis and labels both break edges", () => {
  const s = brokenScale({domain: [0, 1000], range: [0, 436], breaks: [[100, 900]], space: 36});
  const seen = [];
  const ticks = brokenScaleTicks(s, seg => {
    seen.push(seg.domain());
    return seg.ticks(4);
  });
  assert.deepStrictEqual(seen, [[0, 100], [900, 1000]], "one plain scale per segment");
  assert.ok(ticks.includes(100) && ticks.includes(900), "both break edges");
  assert.ok(ticks.some(t => t > 0 && t < 100), "the low segment gets its own nice ticks");
  assert.ok(ticks.some(t => t > 900 && t < 1000), "so does the high one");
  assert.strictEqual(new Set(ticks).size, ticks.length, "no duplicates");
});
