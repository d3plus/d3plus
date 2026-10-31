const countries = [
  ["Brazil", "Americas", 15.1, 75.9, 216],
  ["Canada", "Americas", 53.4, 82.6, 39],
  ["Mexico", "Americas", 21.5, 75.0, 128],
  ["United States", "Americas", 74.6, 79.3, 335],
  ["China", "Asia", 21.5, 78.6, 1410],
  ["India", "Asia", 8.4, 72.0, 1429],
  ["Indonesia", "Asia", 13.4, 71.7, 278],
  ["Japan", "Asia", 45.6, 84.7, 124],
  ["France", "Europe", 50.9, 83.3, 68],
  ["Germany", "Europe", 58.9, 81.4, 84],
  ["Italy", "Europe", 46.8, 83.7, 59],
  ["Egypt", "Africa", 15.1, 70.2, 113],
  ["Ethiopia", "Africa", 2.8, 67.3, 127],
  ["Nigeria", "Africa", 5.6, 54.5, 224],
  ["South Africa", "Africa", 14.0, 66.1, 60],
].map(([country, region, gdp, life, pop]) => ({
  country,
  region,
  "GDP per Capita ($K)": gdp,
  "Life Expectancy": life,
  "Population (M)": pop,
}));

const config = {
  data: countries,
  groupBy: ["region", "country"],
  size: "Population (M)",
  x: "GDP per Capita ($K)",
  y: "Life Expectancy",
  shapeConfig: {Circle: {fillOpacity: 0.7, strokeWidth: 2}},
};
