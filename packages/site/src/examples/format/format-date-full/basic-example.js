import {formatDateFull} from "@d3plus/format";

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
monthly.map(d => formatDateFull(d, monthly));
