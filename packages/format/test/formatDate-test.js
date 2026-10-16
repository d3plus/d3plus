import assert from "assert";
import {default as formatDate, formatDateFull} from "../es/src/formatDate.js";
import {timeFormat, timeFormatDefaultLocale, timeFormatLocale} from "d3-time-format";

const spanish = {
  dateTime: "%A, %e de %B de %Y, %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  quarter: "T",
  periods: ["AM", "PM"],
  days: [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ],
  shortDays: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
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
};

it("formatDate", () => {
  const days = [],
    months = [],
    years = [];
  for (let i = 2; i <= 12; i++) {
    const zeroPad = i < 10 ? `0${i}` : i;
    days.push(new Date(`01/${zeroPad}/2020`));
    months.push(new Date(`${zeroPad}/01/2020`));
    years.push(new Date(`01/01/20${zeroPad}`));
  }

  assert.strictEqual(
    "Feb 2020",
    formatDate(months[0], months),
    "starting month includes year",
  );
  assert.strictEqual(
    "Jun",
    formatDate(months[4], months),
    "middle month excludes year",
  );
  assert.strictEqual(
    "Dec 2020",
    formatDate(months[months.length - 1], months),
    "ending month includes year",
  );

  assert.strictEqual(
    "Jan 2, 2020",
    formatDate(days[0], days),
    "starting day includes year",
  );
  assert.strictEqual(
    "Jan 6",
    formatDate(days[4], days),
    "middle day excludes year",
  );
  assert.strictEqual(
    "Jan 12, 2020",
    formatDate(days[days.length - 1], days),
    "ending day includes year",
  );

  assert.strictEqual(
    "2002",
    formatDate(years[0], years),
    "starting year is year-only",
  );
  assert.strictEqual(
    "2012",
    formatDate(years[years.length - 1], years),
    "ending year is year-only",
  );

  const quarters = [
    new Date("03/31/1987"),
    new Date("06/30/1987"),
    new Date("09/30/1987"),
    new Date("12/31/1987"),
    new Date("03/31/1988"),
    new Date("06/30/1988"),
  ];

  assert.strictEqual(
    "Q1 1987",
    formatDate(quarters[0], quarters),
    "starting quarter includes year",
  );
  assert.strictEqual(
    "Q2",
    formatDate(quarters[1], quarters),
    "middle quarter excludes year",
  );
  assert.strictEqual(
    "Q2 1988",
    formatDate(quarters[quarters.length - 1], quarters),
    "ending quarter includes year",
  );

  timeFormatDefaultLocale(spanish);
  assert.strictEqual(
    "ago",
    formatDate(months[6], months, timeFormat),
    "custom timeFormat for localization",
  );

  // Hourly data
  const hours = [];
  for (let i = 0; i < 10; i++) {
    hours.push(new Date(2020, 0, 1, i));
  }
  timeFormatDefaultLocale({
    dateTime: "%x, %X", date: "%-m/%-d/%Y", time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    shortDays: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    shortMonths: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    quarter: "Q",
  });
  const hourFirst = formatDate(hours[0], hours);
  assert.ok(hourFirst.length > 0, "hourly data first element formatted");
  const hourMid = formatDate(hours[5], hours);
  assert.ok(hourMid.length > 0, "hourly data middle element formatted");

  // Small array (<=5 elements) for daily data
  const smallDays = [
    new Date(2020, 0, 1),
    new Date(2020, 0, 2),
    new Date(2020, 0, 3),
  ];
  const smallDay = formatDate(smallDays[1], smallDays);
  assert.ok(smallDay.includes("2020") || smallDay.includes("Jan"), "small daily array includes year or month");

  // Subsecond data
  const millis = [
    new Date(2020, 0, 1, 12, 0, 0, 0),
    new Date(2020, 0, 1, 12, 0, 0, 500),
    new Date(2020, 0, 1, 12, 0, 1, 0),
  ];
  const milliResult = formatDate(millis[1], millis);
  assert.ok(milliResult.length > 0, "subsecond data formatted");

  // Second-level data
  const seconds = [
    new Date(2020, 0, 1, 12, 0, 0),
    new Date(2020, 0, 1, 12, 0, 30),
    new Date(2020, 0, 1, 12, 1, 0),
  ];
  const secResult = formatDate(seconds[1], seconds);
  assert.ok(secResult.length > 0, "second-level data formatted");

  // Minute-level data
  const minutes = [
    new Date(2020, 0, 1, 12, 0),
    new Date(2020, 0, 1, 12, 30),
    new Date(2020, 0, 1, 13, 0),
  ];
  const minResult = formatDate(minutes[1], minutes);
  assert.ok(minResult.length > 0, "minute-level data formatted");

  // Steps finer than an hour label a date on the hour as its hour, and one at
  // midnight as its day, never as the raw Date string.
  const halfHours = [
    new Date(2020, 0, 1, 23, 0),
    new Date(2020, 0, 1, 23, 30),
    new Date(2020, 0, 2, 0, 0),
    new Date(2020, 0, 2, 0, 30),
    new Date(2020, 0, 2, 1, 0),
    new Date(2020, 0, 2, 1, 30),
  ];
  assert.strictEqual(formatDate(halfHours[1], halfHours), "11:30", "a half hour reads as its time");
  assert.strictEqual(formatDate(halfHours[4], halfHours), "01 AM", "an hour reads as its hour");
  assert.strictEqual(formatDate(halfHours[2], halfHours), "Jan 2", "midnight reads as its day");
  assert.strictEqual(formatDate(halfHours[0], halfHours), "11 PM", "the first date on the hour reads as its hour");
});

it("formatDate: the shown dates decide which labels carry the year", () => {
  timeFormatDefaultLocale({
    dateTime: "%x, %X", date: "%-m/%-d/%Y", time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    shortDays: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    shortMonths: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  });
  const range = (n, step) => Array.from({length: n}, (_, i) => step(i));
  const every = (dates, n) => dates.filter((_, i) => i % n === 0);
  const label = (dates, shown) => shown.map(d => formatDate(d, dates, timeFormat, shown));

  const months = range(30, i => new Date(2023, i, 1));
  assert.deepStrictEqual(
    label(months, every(months, 5)),
    ["Jan 2023", "Jun", "Nov", "Apr 2024", "Sep", "Feb 2025"],
    "with January thinned away, the first month shown in each year names it",
  );
  assert.deepStrictEqual(
    label(months, every(months, 3)).slice(-3),
    ["Oct", "Jan 2025", "Apr"],
    "the last label shown keeps its year only when it opens one",
  );
  assert.deepStrictEqual(
    label(months, months.slice(1, 4)),
    ["Feb 2023", "Mar", "Apr"],
    "the first label shown carries the year, wherever it falls",
  );

  const days = range(40, i => new Date(2025, 11, 10 + i));
  assert.deepStrictEqual(
    label(days, every(days, 7)),
    ["Dec 10, 2025", "Dec 17", "Dec 24", "Dec 31", "Jan 7, 2026", "Jan 14"],
    "days: the first day shown after New Year names the year",
  );

  const quarters = range(12, i => new Date(2022, i * 3, 1));
  assert.deepStrictEqual(
    label(quarters, every(quarters, 3)),
    ["Q1 2022", "Q4", "Q3 2023", "Q2 2024"],
    "quarters",
  );

  const hours = range(48, i => new Date(2026, 2, 3, 6 + i));
  assert.deepStrictEqual(
    label(hours, every(hours, 6)),
    ["Mar 3, 2026, 06 AM", "12 PM", "06 PM", "Mar 4, 12 AM", "06 AM", "12 PM", "06 PM", "Mar 5, 12 AM"],
    "hours: the first label of each day shown names the day, with its hour",
  );
  assert.deepStrictEqual(
    label(hours, every(hours, 5)).slice(0, 5),
    ["Mar 3, 2026, 06 AM", "11 AM", "04 PM", "09 PM", "Mar 4, 02 AM"],
    "hours: the day rides on the first label shown after midnight",
  );
  const newYear = range(12, i => new Date(2025, 11, 31, 18 + i));
  assert.strictEqual(
    formatDate(newYear[6], newYear, timeFormat, newYear),
    "Jan 1, 2026, 12 AM",
    "hours: a new year names the year",
  );

  assert.strictEqual(
    formatDate(+months[12], months, timeFormat, every(months, 5)),
    "Jan 2024",
    "a timestamp reads as its Date",
  );
  assert.strictEqual(
    formatDate(months[12], months, timeFormatLocale(spanish).format, every(months, 4)),
    "ene 2024",
    "custom formatter for localization",
  );
});

it("formatDate: hourly ends read their hour", () => {
  const hours = Array.from({length: 12}, (_, i) => new Date(2026, 2, 3, 6 + i));
  assert.strictEqual(formatDate(hours[0], hours), "Mar 3, 2026, 06 AM");
  assert.strictEqual(formatDate(hours[11], hours), "Mar 3, 2026, 05 PM");
  assert.strictEqual(formatDate(hours[5], hours), "11 AM");
  assert.strictEqual(formatDate(hours[11], hours, timeFormat, hours), "05 PM", "the last shown hour, on the first's day");
});

it("formatDateFull", () => {
  const range = (n, step) => Array.from({length: n}, (_, i) => step(i));
  const years = range(8, i => new Date(2018 + i, 0, 1));
  const quarters = range(12, i => new Date(2024 + Math.floor(i / 4), (i % 4) * 3, 1));
  const months = range(36, i => new Date(2024, i, 1));
  const days = range(20, i => new Date(2026, 2, 1 + i));
  const hours = range(12, i => new Date(2026, 2, 3, i));
  const minutes = range(6, i => new Date(2026, 2, 3, 12, i * 15));
  const seconds = range(6, i => new Date(2026, 2, 3, 12, 0, i * 30));
  const millis = range(6, i => new Date(2026, 2, 3, 12, 0, 0, i * 250));

  assert.strictEqual(formatDateFull(years[3], years), "2021", "yearly data reads as the year");
  assert.strictEqual(formatDateFull(quarters[6], quarters), "Q3 2025", "a middle quarter keeps its year");
  assert.strictEqual(formatDate(quarters[6], quarters), "Q3", "where formatDate drops it");
  assert.strictEqual(formatDateFull(months[14], months), "Mar 2025", "a middle month keeps its year");
  assert.strictEqual(formatDate(months[14], months), "Mar", "where formatDate drops it");
  assert.strictEqual(formatDateFull(days[9], days), "Mar 10, 2026", "a middle day keeps its year");
  assert.strictEqual(formatDateFull(hours[5], hours), "Mar 3, 2026 5 AM", "hourly data adds the hour");
  assert.strictEqual(formatDateFull(minutes[1], minutes), "Mar 3, 2026 12:15 PM", "minute data adds the minute");
  assert.strictEqual(formatDateFull(minutes[0], minutes), "Mar 3, 2026 12:00 PM", "an on-the-hour value in minute data");
  assert.strictEqual(formatDateFull(seconds[1], seconds), "Mar 3, 2026 12:00:30 PM", "second data adds the second");
  assert.strictEqual(formatDateFull(millis[1], millis), "Mar 3, 2026 12:00:00.250 PM", "subsecond data adds the millisecond");
  assert.strictEqual(formatDateFull(months[14], [months[14]]), "2025", "a lone date reads as its year");
  assert.strictEqual(
    formatDateFull(months[16], months, timeFormatLocale(spanish).format),
    "may 2025",
    "custom formatter for localization",
  );
});
