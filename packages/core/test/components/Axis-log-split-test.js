import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft} from "../../index.ts";

/**
    A log axis whose domain crosses zero splits into a negative and a
    positive part, each sized by its span in decades out from the split, so
    its ticks run in order whether its poles are past ±1 or inside (-1, 1).
*/

useJsdom();

/** Draws a log axis over `domain` and returns it. */
function draw(Axis, domain) {
  document.body.innerHTML = "";
  const axis = new Axis()
    .scale("log")
    .domain(domain)
    .width(Axis === AxisBottom ? 600 : 80)
    .height(Axis === AxisBottom ? 80 : 400)
    .duration(0);
  axis.render();
  return axis;
}

const domains = [
  [-10, 0.5],
  [-0.8, 0.6],
  [-100, 10],
  [-0.5, 100],
  [0.01, 0.5],
  [-0.5, -0.01],
];

for (const [Axis, reversed] of [
  [AxisBottom, false],
  [AxisLeft, true],
])
  for (const [low, high] of domains)
    it(`${Axis.name} log [${low}, ${high}]: ticks run in order, inside the range`, () => {
      const axis = draw(Axis, reversed ? [high, low] : [low, high]);
      const ticks = [...new Set(axis._availableTicks)]
        .filter(d => d !== 0)
        .sort((a, b) => a - b);
      const values = [low, ...ticks.filter(d => d > low && d < high), high];
      const positions = values.map(d => axis._getPosition(d));
      const label = `${values} → ${positions.map(Math.round)}`;
      assert.ok(positions.every(Number.isFinite), `${label}: finite`);
      const step = reversed ? -1 : 1;
      // The split's two sides, -m and m, meet at one position.
      const meet = i => values[i - 1] < 0 && values[i] > 0;
      assert.ok(
        positions.every(
          (p, i) => !i || (p - positions[i - 1]) * step > (meet(i) ? -0.5 : 0),
        ),
        `${label}: in order`,
      );
      const range = axis._getRange();
      const [start, end] = [Math.min(...range), Math.max(...range)];
      for (const [i, p] of positions.entries())
        assert.ok(
          p >= start - 0.5 && p <= end + 0.5,
          `${values[i]} at ${p} is inside [${start}, ${end}]`,
        );
      if (low < 0 && high > 0) {
        // Both parts draw a decade at the same length.
        const m = Math.min(...axis._d3Scale.domain().map(Math.abs));
        const perDecade = (from, to) =>
          Math.abs(axis._getPosition(to) - axis._getPosition(from)) /
          Math.log10(Math.abs(to / from));
        const [negative, positive] = [perDecade(-m, low), perDecade(m, high)];
        assert.ok(
          Math.abs(negative - positive) < 0.01 * positive,
          `${label}: ${negative} vs ${positive} px per decade`,
        );
      }
      const ends = [positions[0], positions.at(-1)].sort((a, b) => a - b);
      assert.ok(Math.abs(ends[0] - start) < 0.5, `${label}: reaches the start`);
      assert.ok(Math.abs(ends[1] - end) < 0.5, `${label}: reaches the end`);
    });
