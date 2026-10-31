const skillData = ["Analyst", "Engineer", "Designer"].flatMap((group, g) =>
  [
    "Research",
    "Writing",
    "Coding",
    "Design",
    "Testing",
    "Planning",
    "Presenting",
    "Mentoring",
  ].map((metric, m) => ({
    group,
    metric,
    value: 3 + ((m * 3 + g * 5) % 7),
  })),
);

const config = {
  axisConfig: {
    barConfig: {stroke: "#495057", strokeWidth: 2},
    gridConfig: {strokeDasharray: "4 3"},
    shapeConfig: {stroke: "#adb5bd"},
  },
  data: skillData,
  groupBy: "group",
  metric: "metric",
  value: "value",
};
