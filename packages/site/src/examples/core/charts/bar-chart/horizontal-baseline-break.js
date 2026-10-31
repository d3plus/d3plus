const housingStarts = [
  {year: 2019, starts: 1290},
  {year: 2020, starts: 1380},
  {year: 2021, starts: 1601},
  {year: 2022, starts: 1553},
  {year: 2023, starts: 1420},
  {year: 2024, starts: 1367},
];

const config = {
  data: housingStarts,
  discrete: "y",
  groupBy: "year",
  x: "starts",
  xConfig: {
    baselineBreakConfig: {angle: 45, gap: 6, size: 14},
    domain: [1200, 1700],
  },
  y: "year",
};
