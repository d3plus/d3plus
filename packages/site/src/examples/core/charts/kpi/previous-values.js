// This year's totals, each with last year's alongside.
const config = {
  data: [
    {kpi: "Active users", value: 48210, lastYear: 41870},
    {kpi: "Sessions", value: 120400, lastYear: 125950},
    {kpi: "Bounce rate", value: 38.2, lastYear: 41.5},
    {kpi: "New signups", value: 3120, lastYear: 3120},
  ],
  groupBy: "kpi",
  previous: "lastYear",
  comparisonLabel: "vs. last year",
  deltaDirection: d => (d.kpi === "Bounce rate" ? "down" : "up"),
};
