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
  metric: "metric",
  value: "value",
};
