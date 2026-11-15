import {it} from "vitest";
import assert from "assert";
import {closest} from "@d3plus/math";
import {AxisBottom} from "../../index.ts";
import {filterVisibleTicks} from "../../src/components/Axis/axisLayoutScale.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    `filterVisibleTicks` keeps a tick when it sits more than twice its size
    from the nearest tick kept before it, in one pass over the ticks.
*/

/** The quadratic filter the linear one replaces: each tick scans every kept tick. */
function quadraticFilter(axis, ticks, tickGet) {
  const pixels = [];
  ticks.forEach((d, i) => {
    let s = tickGet({id: d, tick: true}, i);
    if (axis.schema.shape === "Circle") s *= 2;
    const t = axis._getPosition(d);
    if (
      !pixels.length ||
      Math.abs(
        closest(
          t,
          pixels.filter(pix => pix !== false),
        ) - t,
      ) >
        s * 2
    )
      pixels.push(t);
    else pixels.push(false);
  });
  return ticks.filter((_d, i) => pixels[i] !== false);
}

/** A seeded pseudo-random generator, so failures reproduce. */
function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A minimal axis whose tick positions come from `positions`. */
function fakeAxis(positions, shape = "Line") {
  return {schema: {shape}, _getPosition: d => positions[d]};
}

/** Runs both filters over `positions` and asserts they keep the same ticks. */
function same(positions, sizes, shape, label) {
  const ticks = positions.map((_, i) => i);
  const tickGet = (_d, i) => (typeof sizes === "number" ? sizes : sizes[i]);
  const expected = quadraticFilter(fakeAxis(positions, shape), ticks, tickGet);
  const axis = fakeAxis(positions, shape);
  const actual = filterVisibleTicks(axis, ticks, tickGet);
  assert.deepStrictEqual(actual, expected, label);
  assert.strictEqual(axis._availableTicks, ticks, `${label}: available`);
  assert.deepStrictEqual(axis._visibleTicks, expected, `${label}: visible`);
}

it("keeps the same ticks as a scan of every kept tick, on sorted positions", () => {
  const rand = random(7);
  for (let run = 0; run < 200; run++) {
    const n = 1 + Math.floor(rand() * 300);
    const spread = rand() * 2000;
    const positions = Array.from({length: n}, () => rand() * spread).sort(
      (a, b) => a - b,
    );
    // Snap some positions together so ties and exact-threshold gaps occur.
    if (run % 3 === 0)
      positions.forEach((p, i) => (positions[i] = Math.round(p / 4) * 4));
    const sizes =
      run % 2 ? 1 + rand() * 6 : positions.map(() => Math.round(rand() * 5));
    same(positions, sizes, run % 4 === 0 ? "Circle" : "Line", `run ${run}`);
  }
});

it("keeps the same ticks on unsorted, reversed and duplicate positions", () => {
  const rand = random(11);
  for (let run = 0; run < 200; run++) {
    const n = 1 + Math.floor(rand() * 120);
    let positions = Array.from({length: n}, () => Math.round(rand() * 400));
    if (run % 3 === 1) positions = positions.sort((a, b) => b - a);
    if (run % 3 === 2) positions = positions.sort((a, b) => a - b).concat(5);
    same(positions, 1 + rand() * 8, "Line", `run ${run}`);
  }
});

it("keeps the same ticks around NaN and infinite positions", () => {
  const cases = [
    [NaN, 0, 10, 20],
    [0, NaN, 10, NaN, 20],
    [10, NaN, 0, 8],
    [0, 10, Infinity, Infinity],
    [-Infinity, 0, 3, 50, Infinity],
    [-Infinity, -Infinity, 0],
    [Infinity, 0, 100],
    [0, 4, 4, 4.0001, 8, 8.5, 100],
    [undefined, 0, 10],
  ];
  cases.forEach(positions => same(positions, 1, "Line", String(positions)));
  cases.forEach(positions => same(positions, 2, "Circle", String(positions)));
  same([0, 10, 20], [Infinity, 1, 1], "Line", "infinite size");
  same([0, 10, 20], [1, NaN, 1], "Line", "NaN size");
});

it("filters tens of thousands of sorted ticks in one pass", () => {
  const n = 50000;
  const positions = Array.from({length: n}, (_, i) => (i / n) * 1000);
  const ticks = positions.map((_, i) => i);
  const start = performance.now();
  const kept = filterVisibleTicks(fakeAxis(positions), ticks, () => 1);
  // A scan of every kept tick per tick takes minutes at this size.
  assert.ok(performance.now() - start < 2000, "filters quickly");
  assert.ok(kept.length > 1 && kept.length < n, "thins the ticks");
  kept.slice(1).forEach((d, i) => {
    assert.ok(positions[d] - positions[kept[i]] > 2, `tick ${d} spaced out`);
  });
});

it("thins a dense point axis to spaced-out ticks", () => {
  const values = Array.from({length: 5000}, (_, i) => i);
  const axis = new AxisBottom()
    .scale("point")
    .domain(values)
    .width(600)
    .height(100)
    .duration(0);
  axis.render();
  const visible = axis._visibleTicks;
  assert.strictEqual(axis._availableTicks.length, values.length);
  assert.ok(visible.length > 1 && visible.length < values.length);
  const positions = visible.map(d => axis._getPosition(d));
  positions.slice(1).forEach((p, i) => {
    assert.ok(p > positions[i], "visible ticks run in order");
  });
});
