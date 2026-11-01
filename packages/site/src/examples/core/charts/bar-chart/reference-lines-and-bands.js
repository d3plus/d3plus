const config = {
  data: [
    {region: "North", sales: 42},
    {region: "South", sales: 52},
    {region: "East", sales: 31},
    {region: "West", sales: 51},
    {region: "Central", sales: 47},
  ],
  groupBy: "region",
  x: "region",
  y: "sales",
  legend: false,
  referenceLines: [
    {x: "East", label: "Pilot"},
    {y: 50, label: "Quota", dash: "6 3"},
  ],
  referenceBands: [{x: ["South", "West"], label: "Campaign"}],
};
