const regions = [
  {region: "North", quarter: "Q1", change: 40},
  {region: "North", quarter: "Q2", change: 25},
  {region: "North", quarter: "Q3", change: -15},
  {region: "North", quarter: "Q4", change: 18},
  {region: "North", quarter: "Year", subtotal: true},
  {region: "South", quarter: "Q1", change: 30},
  {region: "South", quarter: "Q2", change: -10},
  {region: "South", quarter: "Q3", change: 22},
  {region: "South", quarter: "Q4", change: 8},
  {region: "South", quarter: "Year", subtotal: true},
];

const config = {
  data: regions,
  groupBy: "region",
  x: "quarter",
  y: "change",
  subtotal: "subtotal",
};
