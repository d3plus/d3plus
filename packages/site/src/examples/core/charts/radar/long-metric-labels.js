const kpiData = ["Team A", "Team B"].flatMap((group, g) =>
  [
    "Customer Satisfaction Index",
    "Revenue",
    "Net Promoter Score (Trailing 12 Months)",
    "Churn",
    "Average Handling Time",
    "Employee Engagement",
    "Market Share",
    "Gross Margin Percentage",
  ].map((metric, m) => ({group, metric, value: 20 + ((m * 13 + g * 31) % 70)})),
);

const config = {
  data: kpiData,
  groupBy: "group",
  metric: "metric",
  value: "value",
};
