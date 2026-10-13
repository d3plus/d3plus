import assert from "assert";
import {AxisBottom} from "../../es/index.js";
import {buildTickFormat} from "../../es/src/components/Axis/axisLayoutScale.js";
import {
  axisDateCategories,
  axisDateLabel,
  axisTimeLocale,
  isCategoryAxis,
  isValidDate,
} from "../../es/src/components/Axis/timeValues.js";
import it from "../jsdom.js";

/**
    Dates on a category (band, ordinal, or point) axis label like a time
    axis's ticks: at the interval the dates step by, with the year on the
    first and last dates and on each year's first, in the axis's locale. An
    axis `tickFormat` still wins.
*/

const range = (n, step) => Array.from({length: n}, (_, i) => step(i));
const months = range(30, i => new Date(2023, i, 1));
const days = range(14, i => new Date(2026, 2, 1 + i));
const years = range(8, i => new Date(2016 + i, 0, 1));
const quarters = range(6, i => new Date(2025, i * 3, 1));
const hours = range(12, i => new Date(2026, 2, 3, 6 + i));

/** Renders a standalone category axis over `domain` and returns it with its label formatter applied to every category. */
function draw(domain, {scale = "point", locale, tickFormat, data} = {}) {
  document.body.innerHTML = "";
  const axis = new AxisBottom().scale(scale).domain(domain).width(600).height(100).duration(0);
  if (data) axis.data(data);
  if (locale) axis.locale(locale);
  if (tickFormat) axis.tickFormat(tickFormat);
  axis.render();
  return {axis, labels: domain.map(axis._labelFormat)};
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
    assert.strictEqual(isCategoryAxis(new AxisBottom().scale(scale)), true, scale);
  for (const scale of ["linear", "log", "time"])
    assert.strictEqual(isCategoryAxis(new AxisBottom().scale(scale)), false, scale);
});

it("axisDateCategories: the valid Dates in the domain, unique and in order, else in the data", () => {
  const a = new Date(2024, 0, 1), b = new Date(2024, 1, 1), c = new Date(2024, 2, 1);
  const fromDomain = draw([c, "x", a, new Date("nope"), b, new Date(+a)]).axis;
  assert.deepStrictEqual(axisDateCategories(fromDomain).map(Number), [a, b, c].map(Number));
  const fromData = new AxisBottom().scale("point").domain(["x", "y"]);
  fromData._scaleData = [b, a, "z", b];
  assert.deepStrictEqual(axisDateCategories(fromData).map(Number), [a, b].map(Number));
  assert.deepStrictEqual(axisDateCategories(draw(["x", "y"]).axis), []);
});

it("point axis: monthly Dates label as months, with the year on January and the ends", () => {
  const {labels} = draw(months);
  assert.strictEqual(labels[0], "Jan 2023");
  assert.strictEqual(labels[1], "Feb");
  assert.strictEqual(labels[12], "Jan 2024");
  assert.strictEqual(labels[13], "Feb");
  assert.strictEqual(labels[29], "Jun 2025");
  assert.ok(labels.every(l => !/GMT|00:00/.test(l)), `no raw Date strings (got ${labels})`);
});

it("point axis: daily Dates label as days", () => {
  const {labels} = draw(days);
  assert.deepStrictEqual([labels[0], labels[1], labels[6], labels[13]], ["Mar 1, 2026", "Mar 2", "Mar 7", "Mar 14, 2026"]);
});

it("band axis: yearly Dates label as years", () => {
  assert.deepStrictEqual(draw(years, {scale: "band"}).labels, range(8, i => `${2016 + i}`));
});

it("band axis: quarterly Dates label as quarters in the axis's locale", () => {
  assert.deepStrictEqual(draw(quarters, {scale: "band"}).labels, ["Q1 2025", "Q2", "Q3", "Q4", "Q1 2026", "Q2 2026"]);
  assert.deepStrictEqual(
    draw(quarters, {scale: "band", locale: "es-ES"}).labels,
    ["T1 2025", "T2", "T3", "T4", "T1 2026", "T2 2026"],
  );
});

it("point axis: hourly Dates label the time of day between the ends", () => {
  const {labels} = draw(hours);
  assert.strictEqual(labels[1], "07 AM");
  assert.strictEqual(labels[6], "12 PM");
  assert.strictEqual(labels[0], "Mar 3, 2026");
});

it("point axis: Dates label in the axis's locale", () => {
  const {labels} = draw(months, {locale: "es-ES"});
  assert.deepStrictEqual([labels[0], labels[1], labels[29]], ["ene 2023", "feb", "jun 2025"]);
});

it("point axis: a tickFormat still labels Dates", () => {
  const {labels} = draw(years, {tickFormat: d => `FY${d.getFullYear()}`});
  assert.deepStrictEqual(labels, range(8, i => `FY${2016 + i}`));
});

it("point axis: strings and numbers among the categories read as given", () => {
  assert.deepStrictEqual(draw(["2024-01-01", "Apples", 2024]).labels, ["2024-01-01", "Apples", 2024]);
});

it("buildTickFormat: Date categories label against the axis's Dates", () => {
  const axis = draw(months).axis;
  const format = buildTickFormat(axis, axisTimeLocale(axis), () => []);
  assert.strictEqual(format(months[12]), "Jan 2024");
  assert.strictEqual(format(months[14]), "Mar");
  assert.strictEqual(format("Apples"), "Apples");
});

it("axisDateLabel: a Date on a category axis at the categories' interval, always with the year", () => {
  assert.strictEqual(axisDateLabel(draw(months).axis, months[14]), "Mar 2024");
  assert.strictEqual(axisDateLabel(draw(days).axis, days[4]), "Mar 5, 2026");
  assert.strictEqual(axisDateLabel(draw(years, {scale: "band"}).axis, years[3]), "2019");
  assert.strictEqual(axisDateLabel(draw(quarters, {locale: "es-ES"}).axis, quarters[2]), "T3 2025");
  assert.strictEqual(axisDateLabel(draw(["a", "b"]).axis, months[3]), "2023", "a lone Date reads as its year");
});
