import assert from "assert";
import {
  addDays,
  blockDays,
  blockMonths,
  blockWeeks,
  calendarBlocks,
  calendarDayKey,
  dateExtent,
  daysBetween,
  localeWeekStart,
  parseCalendarDate,
  resolveWeekStart,
  startOfDay,
  weekIndex,
  weekdaySlot,
} from "../../es/src/charts/Calendar/calendarDates.js";

const day = (y, m, d) => new Date(y, m - 1, d);
const key = d => (d ? calendarDayKey(d) : d);

/** Runs `fn` with the process time zone set to `tz`. */
function inZone(tz, fn) {
  const before = process.env.TZ;
  process.env.TZ = tz;
  try {
    fn();
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
}

it("Calendar dates: startOfDay drops the time of day", () => {
  const d = startOfDay(new Date(2024, 4, 6, 18, 45, 12));
  assert.strictEqual(+d, +day(2024, 5, 6));
});

it("Calendar dates: parseCalendarDate reads Dates, timestamps, and strings as local days", () => {
  assert.strictEqual(key(parseCalendarDate("2024-02-29")), "2024-02-29", "ISO day is local");
  assert.strictEqual(parseCalendarDate("2024-02-29").getHours(), 0, "at local midnight");
  assert.strictEqual(key(parseCalendarDate(new Date(2024, 0, 5, 23, 59))), "2024-01-05");
  assert.strictEqual(key(parseCalendarDate(+new Date(2024, 6, 4, 12))), "2024-07-04");
  assert.strictEqual(key(parseCalendarDate("March 3, 2025 10:00")), "2025-03-03");
  assert.strictEqual(key(parseCalendarDate(" 2025-12-31 ")), "2025-12-31", "trims");
  assert.strictEqual(key(parseCalendarDate(["2024-01-02", "2024-01-03"])), "2024-01-02", "first of an array");
  assert.strictEqual(key(parseCalendarDate("0099-06-01")), "0099-06-01", "two-digit years stay put");
});

it("Calendar dates: parseCalendarDate rejects what isn't a day", () => {
  for (const bad of [
    undefined,
    null,
    "",
    "   ",
    "not a date",
    "2023-02-29",
    "2024-13-01",
    NaN,
    Infinity,
    new Date("nope"),
    [],
    {},
    true,
  ]) {
    assert.strictEqual(parseCalendarDate(bad), null, `${String(bad)} → null`);
  }
});

it("Calendar dates: calendarDayKey pads every field", () => {
  assert.strictEqual(calendarDayKey(day(2024, 1, 5)), "2024-01-05");
  assert.strictEqual(calendarDayKey(day(2024, 12, 31)), "2024-12-31");
});

it("Calendar dates: daysBetween counts calendar days, signed", () => {
  assert.strictEqual(daysBetween(day(2024, 1, 1), day(2024, 12, 31)), 365, "leap year");
  assert.strictEqual(daysBetween(day(2023, 1, 1), day(2023, 12, 31)), 364);
  assert.strictEqual(daysBetween(day(2024, 12, 31), day(2025, 1, 1)), 1, "across the year boundary");
  assert.strictEqual(daysBetween(day(2024, 3, 1), day(2024, 2, 28)), -2, "earlier is negative");
  assert.strictEqual(daysBetween(new Date(2024, 0, 1, 23), new Date(2024, 0, 2, 1)), 1, "ignores the time of day");
});

it("Calendar dates: day math holds across daylight-saving shifts", () => {
  for (const tz of ["America/New_York", "Europe/London", "America/Sao_Paulo", "Australia/Sydney"]) {
    inZone(tz, () => {
      // US spring forward / UK fall back / São Paulo's midnight shift (2018) / Sydney's April shift.
      assert.strictEqual(daysBetween(day(2024, 3, 9), day(2024, 3, 11)), 2, `${tz} spring`);
      assert.strictEqual(daysBetween(day(2024, 10, 26), day(2024, 10, 28)), 2, `${tz} autumn`);
      assert.strictEqual(daysBetween(day(2018, 11, 3), day(2018, 11, 5)), 2, `${tz} midnight shift`);
      assert.strictEqual(key(addDays(day(2018, 11, 3), 1)), "2018-11-04", `${tz} addDays`);
      assert.strictEqual(key(addDays(day(2024, 3, 9), 1)), "2024-03-10", `${tz} addDays`);
      const days = blockDays({key: "2024", start: day(2024, 1, 1), end: day(2024, 12, 31)}, 0);
      assert.strictEqual(days.length, 366, `${tz} every day once`);
      assert.strictEqual(new Set(days.map(d => d.key)).size, 366, `${tz} no repeats`);
      assert.ok(days.every((d, i) => !i || daysBetween(days[i - 1].date, d.date) === 1), `${tz} consecutive`);
    });
  }
});

it("Calendar dates: addDays steps whole days, either direction", () => {
  assert.strictEqual(key(addDays(day(2024, 2, 28), 1)), "2024-02-29");
  assert.strictEqual(key(addDays(day(2023, 2, 28), 1)), "2023-03-01");
  assert.strictEqual(key(addDays(day(2025, 1, 1), -1)), "2024-12-31");
});

it("Calendar dates: weekdaySlot places a day within a week starting on weekStart", () => {
  const monday = day(2024, 1, 1);
  assert.strictEqual(weekdaySlot(monday, 0), 1, "Monday is slot 1 of a Sunday week");
  assert.strictEqual(weekdaySlot(monday, 1), 0, "slot 0 of a Monday week");
  assert.strictEqual(weekdaySlot(monday, 6), 2, "slot 2 of a Saturday week");
  assert.strictEqual(weekdaySlot(day(2024, 1, 7), 1), 6, "Sunday ends a Monday week");
});

it("Calendar dates: weekIndex counts weeks from the block's first day", () => {
  const origin = day(2024, 1, 1); // Monday
  assert.strictEqual(weekIndex(origin, origin, 0), 0);
  assert.strictEqual(weekIndex(day(2024, 1, 6), origin, 0), 0, "Saturday ends week 0");
  assert.strictEqual(weekIndex(day(2024, 1, 7), origin, 0), 1, "Sunday starts week 1");
  assert.strictEqual(weekIndex(day(2024, 1, 7), origin, 1), 0, "but not in a Monday week");
  assert.strictEqual(weekIndex(day(2024, 12, 31), origin, 0), 52);
});

it("Calendar dates: blockWeeks covers leap years and both week starts", () => {
  const year = y => ({key: `${y}`, start: day(y, 1, 1), end: day(y, 12, 31)});
  assert.strictEqual(blockWeeks(year(2024), 0), 53);
  assert.strictEqual(blockWeeks(year(2023), 0), 53, "starts and ends on Sunday");
  assert.strictEqual(blockWeeks(year(2023), 1), 53);
  assert.strictEqual(blockWeeks(year(2028), 0), 54, "leap year starting on Saturday spans 54 weeks");
  assert.strictEqual(blockWeeks(year(2028), 1), 53);
  const feb2026 = {key: "2026-02", start: day(2026, 2, 1), end: day(2026, 2, 28)};
  assert.strictEqual(blockWeeks(feb2026, 0), 4, "a Sunday-first February fills exactly four weeks");
  assert.strictEqual(blockWeeks(feb2026, 1), 5);
});

it("Calendar dates: blockDays slots each day by week and weekday", () => {
  const days = blockDays({key: "2024-03", start: day(2024, 3, 1), end: day(2024, 3, 31)}, 0);
  assert.strictEqual(days.length, 31);
  assert.deepStrictEqual(
    [days[0].key, days[0].week, days[0].day],
    ["2024-03-01", 0, 5],
    "Friday March 1st",
  );
  assert.deepStrictEqual([days[2].week, days[2].day], [1, 0], "Sunday the 3rd starts week 1");
  assert.deepStrictEqual([days[30].key, days[30].week, days[30].day], ["2024-03-31", 5, 0]);
});

it("Calendar dates: localeWeekStart follows CLDR regions", () => {
  const expected = {
    "en-US": 0,
    "en-GB": 1,
    "de-DE": 1,
    "es-ES": 1,
    "es-MX": 0,
    "fr-FR": 1,
    "it-IT": 1,
    "pt-BR": 0,
    "zh-CN": 0,
    "ar-SA": 0,
    "ar-EG": 6,
    "fa-IR": 6,
    "sr-Latn-RS": 1,
    "en_CA": 0,
  };
  for (const [locale, start] of Object.entries(expected)) {
    assert.strictEqual(localeWeekStart(locale), start, locale);
  }
  assert.strictEqual(localeWeekStart("en"), 1, "no region → Monday");
  assert.strictEqual(localeWeekStart(undefined), 1);
  assert.strictEqual(localeWeekStart({}), 1);
});

it("Calendar dates: resolveWeekStart reads numbers and day names, else the locale", () => {
  assert.strictEqual(resolveWeekStart(1, "en-US"), 1);
  assert.strictEqual(resolveWeekStart(7, "en-US"), 0, "wraps");
  assert.strictEqual(resolveWeekStart(-1, "en-US"), 6, "wraps negatives");
  assert.strictEqual(resolveWeekStart("monday", "en-US"), 1);
  assert.strictEqual(resolveWeekStart("Sun", "en-GB"), 0);
  assert.strictEqual(resolveWeekStart("SATURDAY", "en-US"), 6);
  assert.strictEqual(resolveWeekStart("th", "en-US"), 4);
  assert.strictEqual(resolveWeekStart("t", "en-GB"), 1, "too short → locale");
  assert.strictEqual(resolveWeekStart("someday", "en-US"), 0, "unknown → locale");
  assert.strictEqual(resolveWeekStart(undefined, "en-GB"), 1);
  assert.strictEqual(resolveWeekStart(NaN, "en-US"), 0);
});

it("Calendar dates: dateExtent finds the first and last day", () => {
  assert.strictEqual(dateExtent([]), null);
  const [lo, hi] = dateExtent([day(2024, 5, 1), day(2023, 1, 9), day(2025, 2, 3)]);
  assert.deepStrictEqual([key(lo), key(hi)], ["2023-01-09", "2025-02-03"]);
});

it("Calendar dates: calendarBlocks covers whole years or months", () => {
  const years = calendarBlocks(day(2023, 6, 15), day(2025, 1, 2), "year");
  assert.deepStrictEqual(years.map(b => b.key), ["2023", "2024", "2025"]);
  assert.deepStrictEqual([key(years[1].start), key(years[1].end)], ["2024-01-01", "2024-12-31"]);

  const months = calendarBlocks(day(2024, 11, 20), day(2025, 2, 3), "month");
  assert.deepStrictEqual(months.map(b => b.key), ["2024-11", "2024-12", "2025-01", "2025-02"]);
  assert.strictEqual(key(months[3].end), "2025-02-28");
  const leap = calendarBlocks(day(2024, 2, 10), day(2024, 2, 10), "month");
  assert.strictEqual(key(leap[0].end), "2024-02-29", "leap February");

  assert.deepStrictEqual(calendarBlocks(day(2025, 1, 1), day(2024, 1, 1), "year"), [], "reversed range");
});

it("Calendar dates: blockMonths splits a year into its months", () => {
  const months = blockMonths({key: "2024", start: day(2024, 1, 1), end: day(2024, 12, 31)});
  assert.strictEqual(months.length, 12);
  assert.strictEqual(months[1].key, "2024-02");
  assert.strictEqual(key(months[1].end), "2024-02-29");
});
