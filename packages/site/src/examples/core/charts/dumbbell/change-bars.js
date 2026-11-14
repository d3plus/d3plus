// Unemployment rate (%), 2019 and 2023.
const rates = [
  ["Spain", 14.1, 12.2],
  ["Greece", 17.3, 11.1],
  ["Italy", 10.0, 7.7],
  ["France", 8.4, 7.3],
  ["Sweden", 6.8, 7.7],
  ["Canada", 5.7, 5.4],
  ["Brazil", 11.9, 8.0],
  ["Chile", 7.2, 8.7],
  ["Korea", 3.8, 2.7],
].flatMap(([country, before, after]) => [
  {country, year: "2019", Unemployment: before},
  {country, year: "2023", Unemployment: after},
]);

const config = {
  arrows: true,
  connector: "bar",
  data: rates,
  groupBy: "year",
  x: "Unemployment",
  y: "country",
};
