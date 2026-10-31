const surveyResults = [
  {region: "North", year: "2023", pct: 42, lower: 38.5, upper: 45.6},
  {region: "North", year: "2024", pct: 47, lower: 43.2, upper: 50.9},
  {region: "South", year: "2023", pct: 35, lower: 30.1, upper: 39.8},
  {region: "South", year: "2024", pct: 31, lower: 27.4, upper: 34.7},
  {region: "West", year: "2023", pct: 51, lower: 45.0, upper: 56.8},
  {region: "West", year: "2024", pct: 55, lower: 50.3, upper: 59.6},
];

const config = {
  data: surveyResults,
  groupBy: "year",
  confidence: ["lower", "upper"],
  x: "region",
  y: "pct",
};
