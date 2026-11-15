const months = [
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
];
const regions = {
  North: {
    Revenue: [201, 209, 216, 213, 224, 231],
    Orders: [2650, 2590, 2700, 2760, 2810, 2790],
  },
  South: {
    Revenue: [148, 151, 149, 157, 162, 167],
    Orders: [1810, 1850, 1790, 1880, 1920, 1985],
  },
};

const config = {
  data: Object.entries(regions).flatMap(([region, metrics]) =>
    Object.entries(metrics).flatMap(([metric, values]) =>
      values.map((value, i) => ({region, metric, month: months[i], value})),
    ),
  ),
  groupBy: "metric",
  time: "month",
  facet: "region",
};
