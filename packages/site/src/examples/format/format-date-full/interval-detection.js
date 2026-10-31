import {formatDateFull} from "@d3plus/format";

const quarterly = [
  new Date(2022, 0, 1),
  new Date(2022, 3, 1),
  new Date(2022, 6, 1),
  new Date(2022, 9, 1),
  new Date(2023, 0, 1),
  new Date(2023, 3, 1),
  new Date(2023, 6, 1),
  new Date(2023, 9, 1),
];
quarterly.map(d => formatDateFull(d, quarterly));
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
daily.map(d => formatDateFull(d, daily));
const hourly = [
  new Date(2024, 2, 1),
  new Date(2024, 2, 1, 1),
  new Date(2024, 2, 1, 2),
  new Date(2024, 2, 1, 3),
  new Date(2024, 2, 1, 4),
  new Date(2024, 2, 1, 5),
  new Date(2024, 2, 1, 6),
  new Date(2024, 2, 1, 7),
  new Date(2024, 2, 1, 8),
  new Date(2024, 2, 1, 9),
  new Date(2024, 2, 1, 10),
  new Date(2024, 2, 1, 11),
];
hourly.map(d => formatDateFull(d, hourly));
