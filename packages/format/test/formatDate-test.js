import assert from "assert";
import {default as formatDate} from "../es/src/formatDate.js";
import {timeFormat, timeFormatDefaultLocale} from "d3-time-format";

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
});
