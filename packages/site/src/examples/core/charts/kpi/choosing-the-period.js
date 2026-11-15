const months = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
];
const series = {
  Revenue: [182, 186, 191, 188, 197, 204, 201, 209, 216, 213, 224, 231],
  Orders: [
    2410, 2380, 2460, 2520, 2490, 2610, 2650, 2590, 2700, 2760, 2810, 2790,
  ],
};

const config = {
  data: Object.entries(series).flatMap(([metric, values]) =>
    values.map((value, i) => ({metric, month: months[i], value})),
  ),
  groupBy: "metric",
  time: "month",
  timeline: true,
};
