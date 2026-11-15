// Costs and wait times are better when they fall.
const months = [
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
];
const series = {
  Signups: [820, 860, 845, 910, 955, 990],
  "Churn rate": [4.6, 4.4, 4.5, 4.2, 4.0, 3.7],
  "Cost per lead": [38, 36, 37, 35, 36, 39],
  "Wait (minutes)": [12, 11, 13, 10, 9, 8],
};
const fallingIsGood = ["Churn rate", "Cost per lead", "Wait (minutes)"];

const config = {
  data: Object.entries(series).flatMap(([metric, values]) =>
    values.map((value, i) => ({metric, month: months[i], value})),
  ),
  groupBy: "metric",
  time: "month",
  deltaDirection: d => (fallingIsGood.includes(d.metric) ? "down" : "up"),
  delta: "both",
};
