const featureData = [
  {region: "North", quarter: "Q1", revenue: 35},
  {region: "North", quarter: "Q2", revenue: 50},
  {region: "North", quarter: "Q3", revenue: 42},
  {region: "North", quarter: "Q4", revenue: 47},
  {region: "South", quarter: "Q1", revenue: 20},
  {region: "South", quarter: "Q2", revenue: 30},
  {region: "South", quarter: "Q3", revenue: 38},
  {region: "South", quarter: "Q4", revenue: 33},
];

const config = {
  data: featureData,
  groupBy: "region",
  x: "quarter",
  y: "revenue",
  on: {
    "click.shape": d => console.log("clicked bar:", d),
    "mouseenter.shape": d => console.log("hovered bar:", d),
  },
};
