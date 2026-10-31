import {formatDate} from "@d3plus/format";
import {timeFormatLocale} from "d3-time-format";
import {locale} from "@d3plus/locales";

const halfHourly = [
  new Date(2024, 2, 1, 14),
  new Date(2024, 2, 1, 14, 30),
  new Date(2024, 2, 1, 15),
  new Date(2024, 2, 1, 15, 30),
  new Date(2024, 2, 1, 16),
  new Date(2024, 2, 1, 16, 30),
];
halfHourly.map(d => formatDate(d, halfHourly));
halfHourly.map(d =>
  formatDate(d, halfHourly, timeFormatLocale(locale["es-ES"]).format),
);
