import {it} from "vitest";
import assert from "assert";

import {
  hasTimeNear,
  timeDataInDomain,
  timeDataSpacing,
} from "../../src/components/Axis/timeValues.ts";
import {Line} from "../../index.ts";

const day = 864e5;
const dates = [3, 0, 1, 7].map(d => new Date(Date.UTC(2026, 0, 1) + d * day));

it("timeDataInDomain keeps the dates inside the domain, answering a repeat from memory", () => {
  const scale = {domain: () => [dates[1], dates[2]]};
  const inside = timeDataInDomain(dates, scale);
  assert.deepStrictEqual(inside, [dates[1], dates[2]]);
  assert.strictEqual(timeDataInDomain(dates, scale), inside, "the same array");
  const wider = timeDataInDomain(dates, {domain: () => [dates[1], dates[3]]});
  assert.strictEqual(wider.length, 4, "a new domain filters again");
});

it("hasTimeNear finds a time within reach, in any order of data", () => {
  const t = +dates[0];
  assert.ok(hasTimeNear(dates, t, 0));
  assert.ok(hasTimeNear(dates, t + 1000, 1000));
  assert.ok(!hasTimeNear(dates, t + 1001, 1000));
  assert.ok(!hasTimeNear(dates, +dates[3] + day, 1000), "past the last");
  assert.ok(!hasTimeNear([], t, 1000));
  assert.ok(hasTimeNear([t], t, 0), "millisecond numbers too");
});

it("timeDataSpacing reads the extent, span, and closest neighbors as listed", () => {
  const spacing = timeDataSpacing(dates);
  assert.deepStrictEqual(spacing.extent, [dates[1], dates[3]]);
  assert.strictEqual(spacing.span, 7 * day);
  assert.strictEqual(spacing.step, day, "between the 2nd and 3rd as listed");
  assert.strictEqual(timeDataSpacing(dates), spacing, "read once per array");
});

it("a shape groups its data once for a render's labels and scene", () => {
  const line = new Line()
    .data([
      {id: "a", x: 0, y: 1},
      {id: "a", x: 1, y: 2},
    ])
    .x("x")
    .y("y");
  let groupings = 0;
  const own = line._dataFilter.bind(line);
  line._dataFilter = data => {
    groupings++;
    return own(data);
  };
  line.renderMode("compute").render();
  line.toScene();
  assert.strictEqual(groupings, 1);
  line.toScene();
  assert.strictEqual(groupings, 2, "a scene drawn on its own groups afresh");
});
