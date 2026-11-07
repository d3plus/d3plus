const data = [
  {region: "Americas", country: "Brazil", value: 21},
  {region: "Americas", country: "Canada", value: 17},
  {region: "Americas", country: "Mexico", value: 12},
  {region: "Europe", country: "France", value: 19},
  {region: "Europe", country: "Germany", value: 24},
  {region: "Europe", country: "Spain", value: 9},
  {region: "Asia", country: "India", value: 22},
  {region: "Asia", country: "Japan", value: 18},
  {region: "Asia", country: "Korea", value: 8},
];

const config = {
  data,
  groupBy: ["region", "country"],
  depth: 0,
  sum: "value",
  legend: true,
  legendHistory: true,
};
