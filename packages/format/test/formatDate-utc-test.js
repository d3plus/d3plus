import {afterAll, beforeAll, it} from "vitest";
import assert from "assert";
import {
  default as formatDate,
  dateFormatter,
  dateFullFormatter,
  formatDateFull,
  uses24Hour,
} from "../src/formatDate.ts";
import {timeFormat, timeFormatLocale, utcFormat} from "d3-time-format";

/**
    Dates read in UTC (`utc`): labeled on UTC's calendar, so dates stored at
    UTC midnight read as their own day in a time zone west of UTC.
*/

let zone;
beforeAll(() => {
  zone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
});
afterAll(() => {
  if (zone === undefined) delete process.env.TZ;
  else process.env.TZ = zone;
});

const utcDay = d => new Date(Date.UTC(2024, 2, d));
const utcMonth = m => new Date(Date.UTC(2024, m, 1));

it("the test runs west of UTC", () => {
  assert.strictEqual(utcDay(1).getDate(), 29, "UTC midnight is Feb 29 here");
});

it("formatDate reads days in UTC with utc", () => {
  const days = [1, 2, 3, 4, 5, 6].map(utcDay);
  assert.strictEqual(formatDate(days[2], days, {utc: true}), "Mar 3");
  assert.strictEqual(formatDate(days[0], days, {utc: true}), "Mar 1, 2024");
  // In local time the same dates read as the day before.
  assert.strictEqual(formatDate(days[2], days), "Mar 2");
});

it("formatDate reads months, quarters and years in UTC with utc", () => {
  const months = [0, 1, 2, 3, 4, 5, 6].map(utcMonth);
  assert.strictEqual(formatDate(months[3], months, {utc: true}), "Apr");
  const quarters = [0, 3, 6, 9, 12, 15, 18, 21].map(utcMonth);
  assert.strictEqual(formatDate(quarters[1], quarters, {utc: true}), "Q2");
  const years = [2020, 2021, 2022, 2023, 2024, 2025].map(
    y => new Date(Date.UTC(y, 0, 1)),
  );
  assert.strictEqual(formatDate(years[2], years, {utc: true}), "2022");
  assert.strictEqual(formatDate(years[2], years), "2021");
});

it("formatDate puts the year on the first shown date of each UTC year", () => {
  const months = [8, 9, 10, 11, 12, 13, 14, 15].map(utcMonth);
  const shown = months.slice();
  assert.deepStrictEqual(
    months.map(d => formatDate(d, months, utcFormat, {shown, utc: true})),
    ["Sep 2024", "Oct", "Nov", "Dec", "Jan 2025", "Feb", "Mar", "Apr"],
  );
});

it("dateFormatter labels as formatDate does with utc", () => {
  const days = [1, 2, 3, 4, 5, 6, 7, 8].map(utcDay);
  const label = dateFormatter(days, {utc: true});
  days.forEach(d =>
    assert.strictEqual(label(d), formatDate(d, days, {utc: true})),
  );
  assert.strictEqual(label(days[4]), "Mar 5");
});

it("formatDateFull and dateFullFormatter read UTC with utc", () => {
  const days = [1, 2, 3].map(utcDay);
  assert.strictEqual(formatDateFull(days[1], days, {utc: true}), "Mar 2, 2024");
  assert.strictEqual(
    dateFullFormatter(days, {utc: true})(days[2]),
    "Mar 3, 2024",
  );
  const hours = [0, 1, 2].map(h => new Date(Date.UTC(2024, 2, 1, 15 + h)));
  assert.strictEqual(
    formatDateFull(hours[0], hours, {utc: true}),
    "Mar 1, 2024 3 PM",
  );
  assert.strictEqual(formatDateFull(hours[0], hours), "Mar 1, 2024 7 AM");
});

it("a custom UTC formatter writes the locale's words", () => {
  const spanish = timeFormatLocale({
    dateTime: "%x, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["d", "l", "m", "x", "j", "v", "s"],
    shortDays: ["d", "l", "m", "x", "j", "v", "s"],
    months: [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ],
    shortMonths: [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ],
  });
  const days = [1, 2, 3, 4, 5, 6].map(utcDay);
  assert.strictEqual(
    formatDate(days[1], days, {formatter: spanish.utcFormat, utc: true}),
    "mar 2",
  );
  const hours = [0, 1, 2].map(h => new Date(Date.UTC(2024, 2, 1, 15 + h)));
  assert.strictEqual(
    formatDateFull(hours[0], hours, spanish.utcFormat, {utc: true}),
    "mar 1, 2024 15:00",
  );
});

it("uses24Hour reads a UTC formatter's clock in UTC", () => {
  assert.strictEqual(uses24Hour(utcFormat, {utc: true}), false);
  assert.strictEqual(uses24Hour(timeFormat), false);
  const h24 = timeFormatLocale({
    dateTime: "%x, %X",
    date: "%d/%m/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["", "", "", "", "", "", ""],
    shortDays: ["", "", "", "", "", "", ""],
    months: Array(12).fill(""),
    shortMonths: Array(12).fill(""),
  });
  assert.strictEqual(uses24Hour(h24.utcFormat, {utc: true}), true);
  assert.strictEqual(uses24Hour(h24.format), true);
  // A UTC formatter read in local time writes another hour than 15.
  assert.strictEqual(uses24Hour(h24.utcFormat), false);
});

it("options sit in the formatter's place or after it, and positional args still work", () => {
  const months = [8, 9, 10, 11, 12, 13, 14, 15].map(utcMonth);
  const shown = months.slice();
  const expected = months.map(d =>
    formatDate(d, months, {formatter: utcFormat, shown, utc: true}),
  );
  assert.deepStrictEqual(
    months.map(d => formatDate(d, months, utcFormat, {shown, utc: true})),
    expected,
  );
  // Local dates, given a formatter and an array of shown dates as before.
  const local = [8, 9, 10, 11, 12, 13].map(m => new Date(2024, m, 1));
  assert.deepStrictEqual(
    local.map(d => formatDate(d, local, timeFormat, local)),
    local.map(d => formatDate(d, local, {formatter: timeFormat, shown: local})),
  );
  assert.strictEqual(
    formatDate(local[4], local, timeFormat, local),
    "Jan 2025",
  );
  const days = [1, 2, 3].map(utcDay);
  assert.strictEqual(
    dateFullFormatter(days, utcFormat, {utc: true})(days[0]),
    dateFullFormatter(days, {formatter: utcFormat, utc: true})(days[0]),
  );
  assert.strictEqual(
    dateFormatter(days, timeFormat)(days[0]),
    formatDate(days[0], days),
  );
});
