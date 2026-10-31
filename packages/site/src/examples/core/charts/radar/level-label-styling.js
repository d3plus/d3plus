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
  data: skillData,
  groupBy: "group",
  levelLabelAngle: 22.5,
  levelLabelConfig: {
    fontSize: 11,
    fontWeight: 600,
  },
  levels: 4,
  metric: "metric",
  value: "value",
};
