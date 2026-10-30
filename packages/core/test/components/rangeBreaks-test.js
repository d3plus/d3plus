import {it} from "vitest";
import assert from "assert";
import {
  gapIndex,
  hidesAllTime,
  isHiddenTime,
  isRangeBreakRule,
  normalizeRangeBreaks,
  offsetVisible,
  rangeBreakGaps,
  rangeBreakTest,
  rangeBreakTime,
  ruleMarker,
  visibleBetween,
} from "../../internal.ts";

/**
    Range break rules for time axes: the calendar stretches a time axis
    hides (weekends, daily hours, whole days, explicit ranges), read in
    local time unless asked for UTC.
*/

const HOUR = 36e5;
const DAY = 864e5;
// January 2024 starts on a Monday.
const jan = (d, h = 0, m = 0) => +new Date(2024, 0, d, h, m);
const span = gaps => gaps.map(g => [g.start, g.end]);

it("rangeBreakTime reads Dates, timestamps, and date strings", () => {
  assert.strictEqual(
    rangeBreakTime(new Date(2024, 6, 4)),
    +new Date(2024, 6, 4),
  );
  assert.strictEqual(rangeBreakTime(jan(5)), jan(5));
  assert.strictEqual(rangeBreakTime("2024-07-04"), +new Date(2024, 6, 4));
  assert.ok(Number.isNaN(rangeBreakTime("nope")));
  assert.ok(Number.isNaN(rangeBreakTime(null)));
});

it("isRangeBreakRule and normalizeRangeBreaks keep only readable rules", () => {
  assert.ok(isRangeBreakRule("weekends"));
  assert.ok(isRangeBreakRule({days: [5, 6]}));
  assert.ok(isRangeBreakRule({hours: [17, 9]}));
  assert.ok(isRangeBreakRule({values: ["2024-07-04"]}));
  assert.ok(isRangeBreakRule({bounds: ["2024-01-01", "2024-02-01"]}));
  assert.ok(!isRangeBreakRule("weekdays"));
  assert.ok(!isRangeBreakRule({days: [7]}));
  assert.ok(!isRangeBreakRule({hours: [25, 9]}));
  assert.ok(!isRangeBreakRule({hours: [9]}));
  assert.ok(!isRangeBreakRule({bounds: ["nope", "2024-01-01"]}));
  assert.ok(!isRangeBreakRule({}));
  assert.deepStrictEqual(normalizeRangeBreaks(false), []);
  assert.deepStrictEqual(normalizeRangeBreaks(undefined), []);
  assert.deepStrictEqual(normalizeRangeBreaks("weekends"), ["weekends"]);
  assert.deepStrictEqual(
    normalizeRangeBreaks(["weekends", {nope: 1}, {hours: [17, 9]}]),
    ["weekends", {hours: [17, 9]}],
  );
});

it("ruleMarker marks bounds by default and follows an explicit marker", () => {
  assert.strictEqual(ruleMarker("weekends"), false);
  assert.strictEqual(ruleMarker({hours: [17, 9]}), false);
  assert.strictEqual(ruleMarker({values: [jan(15)]}), false);
  assert.strictEqual(ruleMarker({bounds: [jan(1), jan(5)]}), true);
  assert.strictEqual(
    ruleMarker({bounds: [jan(1), jan(5)], marker: false}),
    false,
  );
  assert.strictEqual(ruleMarker({values: [jan(15)], marker: true}), true);
});

it("rangeBreakGaps finds each rule type's gaps", () => {
  assert.deepStrictEqual(
    span(rangeBreakGaps(["weekends"], jan(1), jan(21))),
    [
      [jan(6), jan(8)],
      [jan(13), jan(15)],
      [jan(20), jan(22)],
    ],
    "weekends: Saturday through Sunday, whole days",
  );
  assert.deepStrictEqual(
    span(rangeBreakGaps([{days: [3]}], jan(1), jan(14))),
    [
      [jan(3), jan(4)],
      [jan(10), jan(11)],
    ],
    "days: every Wednesday",
  );
  assert.deepStrictEqual(
    span(rangeBreakGaps([{hours: [17, 9]}], jan(2, 10), jan(3, 12))),
    [[jan(2, 17), jan(3, 9)]],
    "hours: a window that wraps past midnight",
  );
  assert.deepStrictEqual(
    span(rangeBreakGaps([{hours: [12, 13.5]}], jan(2), jan(3, 23))),
    [
      [jan(2, 12), jan(2, 13, 30)],
      [jan(3, 12), jan(3, 13, 30)],
    ],
    "hours: a daytime window, fractions as minutes",
  );
  assert.deepStrictEqual(
    span(
      rangeBreakGaps([{values: ["2024-01-15", jan(1, 13)]}], jan(1), jan(31)),
    ),
    [
      [jan(1), jan(2)],
      [jan(15), jan(16)],
    ],
    "values: each date's whole day",
  );
  assert.deepStrictEqual(
    span(rangeBreakGaps([{bounds: [jan(20), jan(10)]}], jan(1), jan(31))),
    [[jan(10), jan(20)]],
    "bounds: one range, reversed ends flipped",
  );
  assert.deepStrictEqual(
    rangeBreakGaps([{bounds: [jan(20), jan(25)]}], jan(1), jan(10)),
    [],
    "gaps outside the window are left out",
  );
  assert.deepStrictEqual(rangeBreakGaps(["weekends"], jan(5), jan(1)), []);
});

it("rangeBreakGaps merges overlapping rules, marking a merged gap when any rule does", () => {
  const gaps = rangeBreakGaps(
    [
      "weekends",
      {hours: [17, 9]},
      {values: [jan(15)]},
      {bounds: [jan(15, 12), jan(16, 12)]},
    ],
    jan(12, 10),
    jan(16, 18),
  );
  assert.deepStrictEqual(
    span(gaps),
    [
      [jan(12, 17), jan(16, 12)],
      [jan(16, 17), jan(17, 9)],
    ],
    "Friday's close runs through the weekend, the holiday, and the bounds",
  );
  assert.deepStrictEqual(
    gaps.map(g => g.marker),
    [true, false],
  );
});

it("rangeBreakGaps reads the calendar in UTC when asked", () => {
  const utc = rangeBreakGaps(
    ["weekends"],
    Date.UTC(2024, 0, 1),
    Date.UTC(2024, 0, 9),
    true,
  );
  assert.deepStrictEqual(span(utc), [
    [Date.UTC(2024, 0, 6), Date.UTC(2024, 0, 8)],
  ]);
  const hours = rangeBreakGaps(
    [{hours: [0, 6]}],
    Date.UTC(2024, 0, 2),
    Date.UTC(2024, 0, 2, 12),
    true,
  );
  assert.deepStrictEqual(span(hours), [
    [Date.UTC(2024, 0, 2), Date.UTC(2024, 0, 2, 6)],
  ]);
});

it("gapIndex finds the last gap starting at or before a time", () => {
  const gaps = rangeBreakGaps(["weekends"], jan(1), jan(21));
  assert.strictEqual(gapIndex(gaps, jan(2)), -1);
  assert.strictEqual(gapIndex(gaps, jan(6)), 0);
  assert.strictEqual(gapIndex(gaps, jan(9)), 0);
  assert.strictEqual(gapIndex(gaps, jan(14)), 1);
  assert.strictEqual(gapIndex(gaps, jan(30)), 2);
  assert.strictEqual(gapIndex([], jan(1)), -1);
});

it("isHiddenTime and rangeBreakTest treat a gap's start as hidden and its end as shown", () => {
  assert.ok(isHiddenTime(["weekends"], jan(6)));
  assert.ok(isHiddenTime(["weekends"], jan(7, 23, 59)));
  assert.ok(!isHiddenTime(["weekends"], jan(8)));
  assert.ok(!isHiddenTime(["weekends"], jan(5, 23)));
  assert.ok(isHiddenTime([{hours: [17, 9]}], jan(2, 17)));
  assert.ok(!isHiddenTime([{hours: [17, 9]}], jan(2, 9)));
  assert.ok(!isHiddenTime([{hours: [17, 9]}], new Date(2024, 0, 2, 16, 59)));
  const test = rangeBreakTest(["weekends"], jan(1), jan(14));
  assert.deepStrictEqual(
    [jan(5), jan(6), jan(7, 12), jan(8), jan(13), jan(20), NaN].map(t =>
      test(t),
    ),
    [false, true, true, false, true, true, false],
    "inside the window by search, outside it on its own",
  );
});

it("visibleBetween counts only shown time, by the wall clock across DST changes", () => {
  assert.strictEqual(visibleBetween(["weekends"], jan(1), jan(15)), 10 * DAY);
  assert.strictEqual(visibleBetween(["weekends"], jan(5), jan(8)), DAY);
  assert.strictEqual(visibleBetween(["weekends"], jan(8), jan(5)), 0);
  // 2024's DST changes (in zones that observe them) fall on March 10 and
  // November 3: each shown day is still 9:00 to 17:00 on the clock.
  const rules = ["weekends", {hours: [17, 9]}];
  for (const [y, m, d] of [
    [2024, 2, 7],
    [2024, 9, 31],
  ]) {
    const from = +new Date(y, m, d, 9);
    const to = +new Date(y, m, d + 6, 17);
    assert.strictEqual(
      visibleBetween(rules, from, to),
      5 * 8 * HOUR,
      `${y}-${m + 1}-${d}`,
    );
  }
});

it("hidesAllTime spots rules that leave nothing shown", () => {
  assert.ok(hidesAllTime([{days: [0, 1, 2, 3, 4, 5, 6]}]));
  assert.ok(hidesAllTime([{hours: [0, 24]}]));
  assert.ok(hidesAllTime(["weekends", {days: [1, 2, 3, 4, 5]}]));
  assert.ok(!hidesAllTime(["weekends", {hours: [17, 9]}]));
  assert.ok(!hidesAllTime([{bounds: [jan(1), jan(31)]}]));
});

it("offsetVisible steps through shown time, over every gap, either way", () => {
  assert.strictEqual(offsetVisible(["weekends"], jan(5, 12), DAY), jan(8, 12));
  assert.strictEqual(offsetVisible(["weekends"], jan(8, 12), -DAY), jan(5, 12));
  assert.strictEqual(offsetVisible(["weekends"], jan(1), 10 * DAY), jan(15));
  assert.strictEqual(offsetVisible(["weekends"], jan(15), -10 * DAY), jan(1));
  assert.strictEqual(
    offsetVisible(["weekends"], jan(6, 12), HOUR),
    jan(8, 1),
    "from inside a gap",
  );
  assert.strictEqual(
    offsetVisible([{hours: [17, 9]}], jan(2, 16), 2 * HOUR),
    jan(3, 10),
  );
  assert.strictEqual(offsetVisible(["weekends"], jan(2), 0), jan(2));
  assert.strictEqual(
    offsetVisible([{days: [0, 1, 2, 3, 4, 5, 6]}], jan(2), DAY),
    jan(2),
    "nothing to step through",
  );
  // A long step past a long bounds range.
  assert.strictEqual(
    offsetVisible([{bounds: [jan(2), +new Date(2025, 0, 2)]}], jan(1), 2 * DAY),
    +new Date(2025, 0, 3),
  );
});
