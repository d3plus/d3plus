import {formatDate} from "@d3plus/format";
import {timeFormatLocale} from "d3-time-format";
import {locale} from "@d3plus/locales";

const monthly = [
  new Date(2023, 0, 1),
  new Date(2023, 1, 1),
  new Date(2023, 2, 1),
  new Date(2023, 3, 1),
  new Date(2023, 4, 1),
  new Date(2023, 5, 1),
  new Date(2023, 6, 1),
  new Date(2023, 7, 1),
  new Date(2023, 8, 1),
  new Date(2023, 9, 1),
  new Date(2023, 10, 1),
  new Date(2023, 11, 1),
];
monthly.map(d =>
  formatDate(d, monthly, timeFormatLocale(locale["es-ES"]).format),
);
const daily = [
  new Date(2024, 2, 1),
  new Date(2024, 2, 2),
  new Date(2024, 2, 3),
  new Date(2024, 2, 4),
  new Date(2024, 2, 5),
  new Date(2024, 2, 6),
  new Date(2024, 2, 7),
  new Date(2024, 2, 8),
  new Date(2024, 2, 9),
  new Date(2024, 2, 10),
];
daily.map(d => formatDate(d, daily, timeFormatLocale(locale["es-ES"]).format));
