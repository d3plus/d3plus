const scoreData = ["2024", "2025"].flatMap((group, g) =>
  [
    "Speed",
    "Power",
    "Range",
    "Comfort",
    "Safety",
    "Price",
    "Design",
    "Support",
  ].map((metric, m) => ({
    group,
    metric,
    value: 30 + ((m * 23 + g * 37) % 65),
  })),
);

const config = {
  data: scoreData,
  groupBy: "group",
  levelFormat: d => `${d}%`,
  levels: [0, 25, 50, 75, 100],
  metric: "metric",
  value: "value",
};
