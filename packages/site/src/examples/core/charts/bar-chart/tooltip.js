const config = {
  data: [
    {region: "North", quarter: "Q1", revenue: 35},
    {region: "North", quarter: "Q2", revenue: 50},
    {region: "North", quarter: "Q3", revenue: 42},
    {region: "North", quarter: "Q4", revenue: 47},
    {region: "South", quarter: "Q1", revenue: 20},
    {region: "South", quarter: "Q2", revenue: 30},
    {region: "South", quarter: "Q3", revenue: 38},
    {region: "South", quarter: "Q4", revenue: 33},
  ],
  groupBy: "region",
  tooltipConfig: {
    title: d => `${d.region} — ${d.quarter}`,
    tbody: [
      ["Region", d => d.region],
      ["Revenue", d => `$${d.revenue}M`],
    ],
  },
  x: "quarter",
  y: "revenue",
};
