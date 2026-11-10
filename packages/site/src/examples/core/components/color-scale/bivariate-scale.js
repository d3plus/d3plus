const cities = [
  {income: 41, rent: 820},
  {income: 48, rent: 1450},
  {income: 52, rent: 990},
  {income: 57, rent: 1210},
  {income: 63, rent: 1630},
  {income: 66, rent: 1080},
  {income: 71, rent: 1920},
  {income: 78, rent: 1390},
  {income: 85, rent: 2210},
];

const config = {
  data: cities,
  bivariate: true,
  value: d => [d.income, d.rent],
  bivariateBuckets: 3,
  bivariateLabels: ["Income", "Rent"],
  orient: "right",
  height: 200,
  width: 300,
};
