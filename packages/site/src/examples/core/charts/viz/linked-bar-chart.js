const data = [
  {region: "Americas", country: "Brazil", revenue: 42},
  {region: "Americas", country: "Chile", revenue: 18},
  {region: "Americas", country: "Mexico", revenue: 27},
  {region: "Europe", country: "France", revenue: 35},
  {region: "Europe", country: "Germany", revenue: 39},
  {region: "Europe", country: "Spain", revenue: 21},
];

const config = {
  data,
  groupBy: "country",
  x: "country",
  y: "revenue",
  color: "region",
  title: "Revenue by country",
  link: {group: "viz-linked", by: "country"},
};
