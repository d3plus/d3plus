import {it} from "vitest";
import assert from "assert";
import {tickLookups} from "../../src/components/Axis/axisTickLookups.ts";

/**
    `tickLookups` answers each tick's lookups as the array scans it replaces
    (`includes`, and `find` by `===`) do.
*/

/** The array scans `tickLookups` replaces. */
const scans = (ticks, labels, textData, scaleData) => ({
  isTick: d => ticks.includes(d),
  isLabel: d => labels.includes(d),
  text: d => textData.find(t => t.d === d),
  scaleValue: d => scaleData.find(t => +t === d),
});

const day = new Date(2020, 0, 1);
const values = [
  0,
  -0,
  1,
  2,
  2.5,
  NaN,
  Infinity,
  "1",
  "a",
  "",
  day,
  new Date(+day),
  null,
  undefined,
  false,
  true,
];

it("tickLookups — answers as the array scans do, on varied values", () => {
  let seed = 9;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = n =>
    Array.from({length: n}, () => values[Math.floor(rand() * values.length)]);
  for (let run = 0; run < 300; run++) {
    const ticks = pick(Math.floor(rand() * 8));
    const labels = pick(Math.floor(rand() * 8));
    const textData = pick(Math.floor(rand() * 8)).map((d, i) => ({d, i}));
    const scaleData = pick(Math.floor(rand() * 8));
    const fast = tickLookups(ticks, labels, textData, scaleData);
    const slow = scans(ticks, labels, textData, scaleData);
    for (const d of values)
      for (const key of ["isTick", "isLabel", "text", "scaleValue"])
        assert.strictEqual(
          fast[key](d),
          slow[key](d),
          `run ${run}: ${key}(${String(d)})`,
        );
  }
});

it("tickLookups — the first match wins, and NaN finds no label", () => {
  const first = {d: 3, i: 0},
    second = {d: 3, i: 1};
  const lookup = tickLookups(
    [NaN],
    [NaN],
    [{d: NaN, i: 0}, first, second],
    [0, "0", "3", 3],
  );
  assert.strictEqual(lookup.isTick(NaN), true, "includes finds NaN");
  assert.strictEqual(lookup.isLabel(NaN), true);
  assert.strictEqual(lookup.text(NaN), undefined, "=== never matches NaN");
  assert.strictEqual(lookup.text(3), first);
  assert.strictEqual(lookup.scaleValue(0), 0, "a falsy first match");
  assert.strictEqual(lookup.scaleValue(3), "3");
  assert.strictEqual(lookup.scaleValue("3"), undefined);
});
