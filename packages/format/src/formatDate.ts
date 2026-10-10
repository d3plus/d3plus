import {timeYear, timeMonth, timeHour, timeMinute, timeSecond} from "d3-time";
import {timeFormat} from "d3-time-format";

type DateFormatter = (specifier: string) => (date: Date) => string;

/**
    A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.
    @param d The date to format.
    @param dataArray The full array of ordered Date Objects.
    @param formatter Optional custom format string or function.
*/
export default function formatDate(
  d: Date,
  dataArray: Date[],
  formatter: DateFormatter = timeFormat,
): string {
  const formatHour = formatter("%I %p"),
    formatMillisecond = formatter(".%L"),
    formatMinute = formatter("%I:%M"),
    formatMonth = formatter("%b"),
    formatMonthDay = formatter("%b %-d"),
    formatMonthDayYear = formatter("%b %-d, %Y"),
    formatMonthYear = formatter("%b %Y"),
    formatQuarter = formatter("Q%q"),
    formatQuarterYear = formatter("Q%q %Y"),
    formatSecond = formatter(":%S"),
    formatYear = formatter("%Y");

  const labelIndex = dataArray.findIndex(a => +a === +d);
  const firstOrLast = labelIndex === 0 || labelIndex === dataArray.length - 1;
  const smallArray = dataArray.length <= 5;
  const withYear = +timeYear(d) === +d || firstOrLast || smallArray;
  const interval = dateInterval(dataArray);

  return (
    interval === "year"
      ? formatYear
      : interval === "quarter"
        ? withYear ? formatQuarterYear : formatQuarter
        : interval === "month"
          ? withYear ? formatMonthYear : formatMonth
          : interval === "day"
            ? withYear ? formatMonthDayYear : formatMonthDay
            : interval === "hour"
              ? firstOrLast || smallArray
                ? formatMonthDayYear
                : +timeMonth(d) === +d
                  ? formatMonthDay
                  : formatHour
              : timeSecond(d) < d
                ? formatMillisecond
                : timeMinute(d) < d
                  ? formatSecond
                  : timeHour(d) < d
                    ? formatMinute
                    : (_d: Date) => _d.toString()
  )(d);
}

/**
    Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from `dataArray` (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day.
    @param d The date to format.
    @param dataArray The full array of ordered Date Objects.
    @param formatter Optional custom format string or function.
*/
export function formatDateFull(
  d: Date,
  dataArray: Date[],
  formatter: DateFormatter = timeFormat,
): string {
  const interval = dateInterval(dataArray);
  const specifier =
    interval === "year"
      ? "%Y"
      : interval === "quarter"
        ? "Q%q %Y"
        : interval === "month"
          ? "%b %Y"
          : interval === "day"
            ? "%b %-d, %Y"
            : interval === "hour"
              ? "%b %-d, %Y %-I %p"
              : timeSecond(d) < d
                ? "%b %-d, %Y %-I:%M:%S.%L %p"
                : timeMinute(d) < d
                  ? "%b %-d, %Y %-I:%M:%S %p"
                  : "%b %-d, %Y %-I:%M %p";
  return formatter(specifier)(d);
}

/**
    The coarsest interval every step between consecutive dates is a whole multiple of: "year", "quarter", "month", "day", or "hour", else undefined for finer steps.
    @param dataArray The full array of ordered Date Objects.
    @private
*/
function dateInterval(
  dataArray: Date[],
): "year" | "quarter" | "month" | "day" | "hour" | undefined {
  const [yearlySteps, monthlySteps, dailySteps, hourlySteps] = dataArray.reduce<
    [number[], number[], number[], number[]]
  >(
    (arr, d, i) => {
      if (i) {
        arr[0].push(d.getFullYear() - dataArray[i - 1].getFullYear());
        arr[1].push(monthDiff(dataArray[i - 1], d));
        arr[2].push(
          Math.round((+d - +dataArray[i - 1]) / (1000 * 60 * 60 * 24)),
        );
        arr[3].push(Math.round((+d - +dataArray[i - 1]) / (1000 * 60 * 60)));
      }
      return arr;
    },
    [[], [], [], []],
  );
  const whole = (steps: number[], size = 1) =>
    steps.every(s => s >= size && !(s % size));
  return whole(yearlySteps)
    ? "year"
    : whole(monthlySteps, 3)
      ? "quarter"
      : whole(monthlySteps)
        ? "month"
        : whole(dailySteps)
          ? "day"
          : whole(hourlySteps)
            ? "hour"
            : undefined;
}

/**
    Returns the number of months between two Date objects

    @returns {Number} the number of months between the two Date objects
    @private
*/
function monthDiff(d1: Date, d2: Date): number {
  let months: number;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}
