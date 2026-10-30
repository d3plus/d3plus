import {it} from "vitest";
import assert from "assert";
import {scaleTime} from "d3-scale";
import {brokenTimeScale, isBrokenTimeScale} from "../../internal.ts";
import {near} from "~test/helpers.js";

/**
    A time scale that hides stretches of time (`rangeBreaks`): shown time
    shares one pixel rate, hidden time closes up, and the scale still reads
    like d3's `scaleTime` (domain, range, ticks, tickFormat, invert, copy).
*/

const HOUR = 36e5;
// January 2024 starts on a Monday.
const jan = (d, h = 0, m = 0) => new Date(2024, 0, d, h, m);

/** Mon Jan 1 to Fri Jan 12 with weekends hidden: nine shown days over 900px. */
const weekdays = () =>
  brokenTimeScale(["weekends"])
    .domain([jan(1), jan(12)])
    .range([0, 900]);

it("isBrokenTimeScale tells a broken time scale from d3's", () => {
  assert.ok(isBrokenTimeScale(weekdays()));
  assert.ok(!isBrokenTimeScale(scaleTime()));
  assert.ok(!isBrokenTimeScale(null));
});

it("maps shown time at one rate and closes up hidden time", () => {
  const x = weekdays();
  assert.deepStrictEqual(x.domain(), [jan(1), jan(12)]);
  assert.deepStrictEqual(x.range(), [0, 900]);
  near(x(jan(1)), 0, 1e-9, "Monday");
  near(x(jan(4)), 300, 1e-9, "Thursday");
  near(x(jan(5)), 400, 1e-9, "Friday");
  near(x(jan(6)), 500, 1e-9, "Saturday sits where its gap closes");
  near(x(jan(7, 12)), 500, 1e-9, "Sunday too");
  near(x(jan(8)), 500, 1e-9, "Monday");
  near(
    x(jan(8)) - x(jan(5)),
    x(jan(5)) - x(jan(4)),
    1e-9,
    "Friday to Monday is one day",
  );
  near(x(jan(12)), 900, 1e-9, "the domain's end");
  assert.ok(Number.isNaN(x(NaN)));
});

it("extrapolates past the domain through the rules' gaps", () => {
  const x = weekdays();
  near(x(new Date(2023, 11, 29)), -100, 1e-9, "the Friday before");
  near(x(jan(15)), 1000, 1e-9, "the Monday after");
  near(x(jan(16)), 1100, 1e-9);
});

it("inverts around and past hidden ranges", () => {
  const x = weekdays();
  assert.deepStrictEqual(x.invert(450), jan(5, 12), "Friday noon");
  assert.deepStrictEqual(
    x.invert(500),
    jan(8),
    "a closed gap inverts to the time after it",
  );
  assert.deepStrictEqual(x.invert(650), jan(9, 12));
  assert.deepStrictEqual(
    x.invert(-100),
    new Date(2023, 11, 29),
    "before the domain",
  );
  assert.deepStrictEqual(x.invert(1050), jan(15, 12), "after it");
  for (const t of [
    jan(2, 6),
    jan(5, 23),
    jan(8, 1),
    jan(11, 13),
    jan(16, 4),
    new Date(2023, 11, 28),
  ])
    assert.deepStrictEqual(x.invert(x(t)), t, `round trip ${t}`);
});

it("follows a reversed domain or range", () => {
  const rev = brokenTimeScale(["weekends"])
    .domain([jan(12), jan(1)])
    .range([0, 900]);
  near(rev(jan(12)), 0, 1e-9);
  near(rev(jan(8)), 400, 1e-9);
  near(rev(jan(5)), 500, 1e-9);
  assert.deepStrictEqual(rev.invert(400), jan(8));
  const down = brokenTimeScale(["weekends"])
    .domain([jan(1), jan(12)])
    .range([900, 0]);
  near(down(jan(5)), 500, 1e-9);
  assert.deepStrictEqual(down.invert(350), jan(8, 12));
  assert.deepStrictEqual(
    rev.ticks(5).map(Number),
    rev
      .ticks(5)
      .map(Number)
      .sort((a, b) => b - a),
    "reversed ticks run with the domain",
  );
});

it("never ticks inside a gap", () => {
  const cases = [
    [["weekends"], jan(1), jan(31)],
    [["weekends"], jan(1), new Date(2024, 5, 30)],
    [[{hours: [17, 9]}], jan(2, 9), jan(5, 17)],
    [["weekends", {hours: [16, 9.5]}], jan(1, 9, 30), jan(19, 16)],
    [[{values: [jan(15), jan(16)]}], jan(10), jan(20)],
    [[{bounds: [jan(10), jan(20)]}], jan(1), jan(31)],
  ];
  for (const [rules, a, b] of cases) {
    const x = brokenTimeScale(rules).domain([a, b]).range([0, 800]);
    for (const count of [3, 5, 10, 20]) {
      const ticks = x.ticks(count);
      assert.ok(ticks.length > 0, `${JSON.stringify(rules)} ticks (${count})`);
      ticks.forEach(t => {
        assert.ok(!x.isHidden(t), `${JSON.stringify(rules)}: ${t} is shown`);
        assert.ok(+t >= +a && +t <= +b, `${t} inside the domain`);
      });
      const n = ticks.map(Number);
      assert.deepStrictEqual(
        n,
        [...new Set(n)].sort((p, q) => p - q),
        "distinct and ascending",
      );
    }
  }
  // d3 ticks a month by its Sundays; hidden, they move to Monday.
  const month = brokenTimeScale(["weekends"])
    .domain([jan(1), jan(31)])
    .range([0, 800]);
  assert.ok(month.ticks(4).every(t => t.getDay() !== 0 && t.getDay() !== 6));
});

it("tickFormat formats like d3's time scale over the domain", () => {
  const x = weekdays();
  assert.strictEqual(
    x.tickFormat()(jan(8)),
    scaleTime()
      .domain([jan(1), jan(12)])
      .tickFormat()(jan(8)),
  );
  assert.strictEqual(x.tickFormat(10, "%a %d")(jan(8)), "Mon 08");
});

it("hides each rule type", () => {
  // Intraday: 9:00 to 17:00 shown, so 17:00 sits on the next 9:00.
  const day = brokenTimeScale([{hours: [17, 9]}])
    .domain([jan(2, 9), jan(3, 17)])
    .range([0, 160]);
  near(day(jan(2, 13)), 40, 1e-9);
  near(day(jan(2, 17)), 80, 1e-9);
  near(day(jan(3, 9)), 80, 1e-9);
  near(day(jan(3, 13)), 120, 1e-9);
  // A holiday Monday: the Friday before sits next to Tuesday.
  const holiday = brokenTimeScale(["weekends", {values: ["2024-01-15"]}])
    .domain([jan(11), jan(17)])
    .range([0, 300]);
  near(holiday(jan(12)), 100, 1e-9);
  near(holiday(jan(16)), 200, 1e-9);
  assert.ok(holiday.isHidden(jan(15, 10)));
  // Days of the week.
  const days = brokenTimeScale([{days: [3]}])
    .domain([jan(1), jan(8)])
    .range([0, 600]);
  near(
    days(jan(4)) - days(jan(2)),
    100,
    1e-9,
    "Tuesday to Thursday is one day",
  );
});

it("gives a marked gap its space, and an unmarked one none", () => {
  const marked = brokenTimeScale([{bounds: [jan(10), jan(20)]}], {space: 40})
    .domain([jan(1), jan(31)])
    .range([0, 1040]);
  // 20 shown days over 1000px, plus 40px for the gap.
  near(marked(jan(10)), 450, 1e-9);
  near(marked(jan(15)), 470, 1e-9, "a hidden time sits inside its gap's space");
  near(marked(jan(20)), 490, 1e-9);
  near(marked(jan(31)), 1040, 1e-9);
  assert.deepStrictEqual(
    marked.gaps().map(g => [+g.start, +g.end, g.marker, g.space]),
    [[+jan(10), +jan(20), true, 40]],
  );
  assert.deepStrictEqual(marked.invert(470), jan(15));
  assert.deepStrictEqual(marked.invert(490), jan(20));
  const plain = brokenTimeScale([{bounds: [jan(10), jan(20)], marker: false}], {
    space: 40,
  })
    .domain([jan(1), jan(31)])
    .range([0, 1000]);
  near(plain(jan(10)), plain(jan(20)), 1e-9);
  // A marked gap touching the domain's end, or one with no room, takes none.
  const edge = brokenTimeScale([{bounds: [jan(1), jan(5)]}], {space: 40})
    .domain([jan(1), jan(31)])
    .range([0, 1000]);
  assert.strictEqual(edge.gaps()[0].space, 0);
  const cramped = brokenTimeScale([{bounds: [jan(10), jan(20)]}], {space: 40})
    .domain([jan(1), jan(31)])
    .range([0, 100]);
  assert.strictEqual(cramped.gaps()[0].space, 0);
});

it("merges overlapping rules into one gap", () => {
  const x = brokenTimeScale(["weekends", {hours: [17, 9]}, {days: [0]}])
    .domain([jan(12, 9), jan(15, 17)])
    .range([0, 160]);
  near(x(jan(12, 17)), 80, 1e-9);
  near(x(jan(15, 9)), 80, 1e-9);
  assert.strictEqual(x.gaps().length, 1);
});

it("keeps every shown day the same width across a DST change", () => {
  // 2024's DST changes (in zones that observe them): March 10 and November 3.
  for (const [m, d] of [
    [2, 7],
    [9, 31],
  ]) {
    const x = brokenTimeScale(["weekends", {hours: [17, 9]}])
      .domain([new Date(2024, m, d, 9), new Date(2024, m, d + 6, 17)])
      .range([0, 400]);
    // Five shown 8-hour days over 400px: 10px an hour.
    near(x(new Date(2024, m, d + 4, 9)), 160, 1e-9, "the Monday after");
    near(x(new Date(2024, m, d + 4, 13)), 200, 1e-9);
    assert.deepStrictEqual(x.invert(200), new Date(2024, m, d + 4, 13));
    assert.strictEqual(
      x.visible(new Date(2024, m, d, 9), new Date(2024, m, d + 6, 17)),
      40 * HOUR,
    );
  }
});

it("reads the calendar in UTC when asked", () => {
  const utc = brokenTimeScale(["weekends"], {utc: true})
    .domain([Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 12)])
    .range([0, 900]);
  assert.deepStrictEqual(
    utc.gaps().map(g => [g.start, g.end]),
    [[Date.UTC(2024, 0, 6), Date.UTC(2024, 0, 8)]],
  );
  near(utc(Date.UTC(2024, 0, 8)), 500, 1e-9);
  const local = weekdays();
  assert.deepStrictEqual(
    local.gaps().map(g => [g.start, g.end]),
    [[+jan(6), +jan(8)]],
  );
});

it("handles an empty domain and one that is entirely hidden", () => {
  const point = brokenTimeScale(["weekends"])
    .domain([jan(3), jan(3)])
    .range([0, 100]);
  assert.strictEqual(point(jan(3)), 50, "a single time sits mid-range");
  assert.deepStrictEqual(point.invert(20), jan(3));
  assert.deepStrictEqual(point.ticks(), [jan(3)]);
  const hidden = brokenTimeScale(["weekends"])
    .domain([jan(6), jan(7, 12)])
    .range([0, 100]);
  assert.strictEqual(hidden(jan(6, 12)), 50);
  assert.deepStrictEqual(hidden.invert(80), jan(6));
  assert.deepStrictEqual(hidden.ticks(), []);
  const all = brokenTimeScale([{hours: [0, 24]}])
    .domain([jan(1), jan(5)])
    .range([0, 100]);
  assert.strictEqual(all(jan(2)), 50);
  assert.deepStrictEqual(all.ticks(), []);
  assert.deepStrictEqual(all.offset(jan(2), HOUR), jan(2));
});

it("copies independently and reports visible time and offsets", () => {
  const x = weekdays();
  const y = x.copy();
  assert.ok(isBrokenTimeScale(y));
  y.domain([jan(1), jan(5)]).range([0, 400]);
  assert.deepStrictEqual(
    x.domain(),
    [jan(1), jan(12)],
    "the original keeps its domain",
  );
  near(y(jan(3)), 200, 1e-9);
  near(x(jan(3)), 200, 1e-9);
  assert.strictEqual(x.visible(jan(5), jan(8)), 24 * HOUR);
  assert.strictEqual(x.visible(jan(8), jan(5)), -24 * HOUR);
  assert.deepStrictEqual(x.offset(jan(5, 12), 24 * HOUR), jan(8, 12));
  assert.deepStrictEqual(x.offset(jan(8, 12), -24 * HOUR), jan(5, 12));
  assert.ok(x.isHidden(jan(6)) && !x.isHidden(jan(8)) && x.isHidden(jan(13)));
  assert.deepStrictEqual(x.rangeBreaks, ["weekends"]);
});
