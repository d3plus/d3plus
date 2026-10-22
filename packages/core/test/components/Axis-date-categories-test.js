import {it} from "vitest";
import assert from "assert";
import {AxisBottom} from "../../index.ts";
import {
  thinEvenly,
  wholeLineLabels,
} from "../../src/components/Axis/axisLayoutLabels.ts";
import {buildTickFormat} from "../../src/components/Axis/axisLayoutScale.ts";
import {
  axisDateCategories,
  axisDateLabel,
  axisShownDates,
  axisTimeLocale,
  axisTimeReference,
  isCategoryAxis,
  isValidDate,
  resetAxisDates,
} from "../../src/components/Axis/timeValues.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    Dates on a category (band, ordinal, or point) axis label like a time
    axis's ticks: at the interval the dates step by, in the axis's locale,
    with the year on the first label drawn and on the first drawn after each
    change of year (and, at hourly steps, the date on the first drawn each
    day). An axis `tickFormat` still wins.
*/

const range = (n, step) => Array.from({length: n}, (_, i) => step(i));
const months = range(30, i => new Date(2023, i, 1));
const days = range(14, i => new Date(2026, 2, 1 + i));
const years = range(8, i => new Date(2016 + i, 0, 1));
const quarters = range(6, i => new Date(2025, i * 3, 1));
const hours = range(12, i => new Date(2026, 2, 3, 6 + i));

/**
    Renders a standalone category axis over `domain` and returns it with its
    label formatter applied to every category (`labels`), and the categories
    it draws (`shown`) with their labels (`painted`).
*/
function draw(
  domain,
  {scale = "point", locale, tickFormat, data, width = 600} = {},
) {
  document.body.innerHTML = "";
  const axis = new AxisBottom()
    .scale(scale)
    .domain(domain)
    .width(width)
    .height(100)
    .duration(0);
  if (data) axis.data(data);
  if (locale) axis.locale(locale);
  if (tickFormat) axis.tickFormat(tickFormat);
  axis.render();
  const shown = axis._visibleTicks;
  return {
    axis,
    labels: domain.map(axis._labelFormat),
    shown,
    painted: shown.map(axis._labelFormat),
  };
}

/**
    Asserts that of the drawn labels, exactly the first and each first after
    a change of year (`boundary` compares two Dates) name the year.
*/
function assertCarries(
  shown,
  painted,
  {
    boundary = (a, b) => a.getFullYear() !== b.getFullYear(),
    pattern = /\d{4}/,
  } = {},
) {
  shown.forEach((d, i) => {
    const opens = !i || boundary(shown[i - 1], d);
    assert.strictEqual(
      pattern.test(painted[i]),
      opens,
      `"${painted[i]}" ${opens ? "names" : "leaves out"} the ${pattern} (got ${painted})`,
    );
  });
}

it("isValidDate: only Dates holding a valid time", () => {
  assert.strictEqual(isValidDate(new Date(2024, 0, 1)), true);
  assert.strictEqual(isValidDate(new Date("nope")), false);
  assert.strictEqual(isValidDate("2024-01-01"), false);
  assert.strictEqual(isValidDate(+new Date(2024, 0, 1)), false);
  assert.strictEqual(isValidDate(undefined), false);
});

it("isCategoryAxis: band, ordinal, and point scales", () => {
  for (const scale of ["band", "ordinal", "point"])
    assert.strictEqual(
      isCategoryAxis(new AxisBottom().scale(scale)),
      true,
      scale,
    );
  for (const scale of ["linear", "log", "time"])
    assert.strictEqual(
      isCategoryAxis(new AxisBottom().scale(scale)),
      false,
      scale,
    );
});

it("axisDateCategories: the valid Dates in the domain, unique and in order, else in the data", () => {
  const a = new Date(2024, 0, 1),
    b = new Date(2024, 1, 1),
    c = new Date(2024, 2, 1);
  const fromDomain = draw([c, "x", a, new Date("nope"), b, new Date(+a)]).axis;
  assert.deepStrictEqual(
    axisDateCategories(fromDomain).map(Number),
    [a, b, c].map(Number),
  );
  const fromData = new AxisBottom().scale("point").domain(["x", "y"]);
  fromData._scaleData = [b, a, "z", b];
  assert.deepStrictEqual(
    axisDateCategories(fromData).map(Number),
    [a, b].map(Number),
  );
  assert.deepStrictEqual(axisDateCategories(draw(["x", "y"]).axis), []);
});

it("point axis: monthly Dates label as months, with the year on the first label and each January", () => {
  const {labels, shown, painted} = draw(months);
  assert.strictEqual(labels[0], "Jan 2023");
  assert.strictEqual(labels[1], "Feb");
  assert.strictEqual(
    labels[29],
    "Jun",
    "the last month no longer repeats the year",
  );
  assert.ok(
    labels.every(l => !/GMT|00:00/.test(l)),
    `no raw Date strings (got ${labels})`,
  );
  assertCarries(shown, painted);
});

it("point axis: thinned monthly Dates keep the year on the first label drawn in each year", () => {
  for (const width of [200, 300, 450]) {
    const {axis, shown, painted} = draw(months, {width});
    assert.ok(
      shown.length < months.length,
      `${width}px thins the labels (got ${painted})`,
    );
    assert.deepStrictEqual(
      axis._shownLabels,
      shown,
      "the axis records the labels it draws",
    );
    assertCarries(shown, painted);
  }
});

it("point axis: daily Dates label as days", () => {
  const {labels, shown, painted} = draw(days);
  assert.deepStrictEqual(
    [labels[0], labels[1], labels[6], labels[13]],
    ["Mar 1, 2026", "Mar 2", "Mar 7", "Mar 14"],
  );
  assertCarries(shown, painted);
  const newYear = range(40, i => new Date(2025, 11, 10 + i));
  for (const width of [250, 600]) {
    const drawn = draw(newYear, {width});
    assertCarries(drawn.shown, drawn.painted);
    assert.ok(
      drawn.painted.some(l => /^Jan \d+, 2026$/.test(l)),
      `the first January day names 2026 (got ${drawn.painted})`,
    );
  }
});

it("band axis: yearly Dates label as years", () => {
  assert.deepStrictEqual(
    draw(years, {scale: "band"}).labels,
    range(8, i => `${2016 + i}`),
  );
});

it("band axis: quarterly Dates label as quarters in the axis's locale", () => {
  assert.deepStrictEqual(draw(quarters, {scale: "band"}).labels, [
    "Q1 2025",
    "Q2",
    "Q3",
    "Q4",
    "Q1 2026",
    "Q2",
  ]);
  assert.deepStrictEqual(
    draw(quarters, {scale: "band", locale: "es-ES"}).labels,
    ["T1 2025", "T2", "T3", "T4", "T1 2026", "T2"],
  );
  const many = range(20, i => new Date(2021, i * 3, 1));
  const {shown, painted} = draw(many, {scale: "band", width: 250});
  assert.ok(shown.length < many.length, `the quarters thin (got ${painted})`);
  assertCarries(shown, painted);
});

it("point axis: hourly Dates label the time of day, with the date and hour on the first", () => {
  const {labels} = draw(hours);
  assert.strictEqual(labels[0], "Mar 3, 2026, 06 AM");
  assert.strictEqual(labels[1], "07 AM");
  assert.strictEqual(labels[6], "12 PM");
  assert.strictEqual(labels[11], "05 PM", "the last hour reads as its hour");
});

it("point axis: thinned hourly Dates name the day on the first label drawn each day", () => {
  const days3 = range(48, i => new Date(2026, 2, 3, 6 + i));
  for (const width of [250, 600]) {
    const {shown, painted} = draw(days3, {width});
    assert.ok(shown.length < days3.length, `the hours thin (got ${painted})`);
    assertCarries(shown, painted, {
      boundary: (a, b) => a.getDate() !== b.getDate(),
      pattern: /^Mar \d/,
    });
    painted.forEach(l =>
      assert.match(l, /\d\d [AP]M$/, `every label reads its hour (got ${l})`),
    );
    assert.match(painted[0], /^Mar 3, 2026, 06 AM$/);
  }
});

it("point axis: Dates label in the axis's locale", () => {
  const {labels, shown, painted} = draw(months, {locale: "es-ES"});
  assert.deepStrictEqual(
    [labels[0], labels[1], labels[29]],
    ["ene 2023", "feb", "jun"],
  );
  assertCarries(shown, painted);
  const thinned = draw(months, {locale: "es-ES", width: 250});
  assertCarries(thinned.shown, thinned.painted);
  assert.match(draw(hours, {locale: "es-ES"}).labels[0], /^mar 3, 2026, 06/);
});

it("point axis: a tickFormat still labels Dates", () => {
  const {labels} = draw(years, {tickFormat: d => `FY${d.getFullYear()}`});
  assert.deepStrictEqual(
    labels,
    range(8, i => `FY${2016 + i}`),
  );
});

it("point axis: strings and numbers among the categories read as given", () => {
  assert.deepStrictEqual(draw(["2024-01-01", "Apples", 2024]).labels, [
    "2024-01-01",
    "Apples",
    2024,
  ]);
});

it("buildTickFormat: Date categories label against the axis's Dates and the ones it shows", () => {
  const axis = draw(months).axis;
  const format = buildTickFormat(axis, axisTimeLocale(axis), () => []);
  axis._shownLabels = months;
  assert.strictEqual(format(months[12]), "Jan 2024");
  assert.strictEqual(format(months[14]), "Mar");
  assert.strictEqual(format("Apples"), "Apples");
  // With January hidden, the first month shown in 2024 names the year.
  axis._shownLabels = months.filter((_, i) => i % 5 === 0);
  assert.strictEqual(format(months[15]), "Apr 2024");
  assert.strictEqual(format(months[20]), "Sep");
  assert.strictEqual(format(months[0]), "Jan 2023");
});

it("axisShownDates: the shown labels as ordered Dates, cached per list", () => {
  const axis = new AxisBottom();
  assert.strictEqual(
    axisShownDates(axis),
    undefined,
    "none before a layout pass",
  );
  const shown = [months[3], months[1], +months[2]];
  axis._shownLabels = shown;
  const dates = axisShownDates(axis);
  assert.deepStrictEqual(
    dates.map(Number),
    [months[1], months[2], months[3]].map(Number),
  );
  assert.strictEqual(
    axisShownDates(axis),
    dates,
    "the same list reads from the cache",
  );
  axis._shownLabels = [months[0]];
  assert.deepStrictEqual(axisShownDates(axis).map(Number), [+months[0]]);
});

it("wholeLineLabels: dates, and numbers on a category axis, lie flat on one line", () => {
  const axis = scale => new AxisBottom().scale(scale);
  assert.strictEqual(wholeLineLabels(axis("point"), months), true, "Dates");
  assert.strictEqual(
    wholeLineLabels(axis("band"), [2016, "2017"]),
    true,
    "numbers",
  );
  assert.strictEqual(
    wholeLineLabels(axis("time"), [+months[0]]),
    true,
    "a time axis",
  );
  assert.strictEqual(
    wholeLineLabels(axis("point"), ["Apples", months[0]]),
    false,
    "named categories",
  );
  assert.strictEqual(wholeLineLabels(axis("point"), []), false, "no labels");
  assert.strictEqual(
    wholeLineLabels(axis("linear"), [1, 2]),
    false,
    "a linear axis keeps its layout",
  );
});

it("thinEvenly: a whole-line axis re-measures the labels each interval shows", () => {
  // Five labels, 10px apart, that measure 25px wide until every third shows,
  // when they measure 8px (as a date label drops its year): only then do the
  // shown labels clear their neighbors.
  const data = range(5, i => ({
    d: i,
    i,
    fP: 2,
    fS: 10,
    position: i * 10,
    width: 25,
    lines: ["x"],
    lineHeight: 14,
  }));
  const calls = [];
  thinEvenly(data, true, (step, all) => {
    calls.push([step, all]);
    data.forEach(t => (t.width = step >= 3 ? 8 : 25));
  });
  assert.deepStrictEqual(
    data.map(t => t.truncated),
    [false, true, true, false, true],
  );
  assert.deepStrictEqual(
    calls,
    [
      [2, false],
      [3, false],
      [3, true],
    ],
    "measures each interval tried, then every label",
  );
});

it("axisDateLabel: a Date on a category axis at the categories' interval, always with the year", () => {
  assert.strictEqual(axisDateLabel(draw(months).axis, months[14]), "Mar 2024");
  assert.strictEqual(axisDateLabel(draw(days).axis, days[4]), "Mar 5, 2026");
  assert.strictEqual(
    axisDateLabel(draw(years, {scale: "band"}).axis, years[3]),
    "2019",
  );
  assert.strictEqual(
    axisDateLabel(draw(quarters, {locale: "es-ES"}).axis, quarters[2]),
    "T3 2025",
  );
  assert.strictEqual(
    axisDateLabel(draw(["a", "b"]).axis, months[3]),
    "2023",
    "a lone Date reads as its year",
  );
});

it("axisDateCategories and axisTimeReference: read once per set of dates", () => {
  const axis = new AxisBottom().scale("point").domain(months.slice().reverse());
  const dates = axisDateCategories(axis);
  assert.strictEqual(
    axisDateCategories(axis),
    dates,
    "the same dates read from the cache",
  );
  axis.domain(days.slice());
  assert.deepStrictEqual(
    axisDateCategories(axis).map(Number),
    days.map(Number),
    "a new domain reads afresh",
  );
  axis.schema.domain.push(new Date(2026, 2, 20));
  assert.strictEqual(
    axisDateCategories(axis).length,
    days.length + 1,
    "as does one that changes length",
  );
  const read = axisDateCategories(axis);
  resetAxisDates(axis);
  assert.notStrictEqual(
    axisDateCategories(axis),
    read,
    "a layout pass reads them afresh",
  );

  const time = new AxisBottom().scale("time").domain([months[5], months[0]]);
  const reference = axisTimeReference(time);
  assert.deepStrictEqual(
    reference.map(Number),
    [months[0], months[5]].map(Number),
  );
  assert.strictEqual(
    axisTimeReference(time),
    reference,
    "the same dates read from the cache",
  );
  time._scaleData = months;
  assert.strictEqual(
    axisTimeReference(time).length,
    months.length,
    "new data reads afresh",
  );
});

it("axisDateLabel: reads the axis's dates once, and follows a new locale or new dates", () => {
  const {axis} = draw(months);
  assert.strictEqual(axisDateLabel(axis, months[14]), "Mar 2024");
  assert.strictEqual(axisDateLabel(axis, months[15]), "Apr 2024");
  axis.locale("es-ES");
  assert.strictEqual(
    axisDateLabel(axis, months[14]),
    "mar 2024",
    "in the new locale",
  );
  axis.domain(days);
  axis._scaleData = days;
  assert.strictEqual(
    axisDateLabel(axis, days[4]),
    "mar 5, 2026",
    "at the new dates' interval",
  );
});
