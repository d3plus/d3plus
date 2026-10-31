const life = [
  ["Japan", "Asia", 81.1, 84.5],
  ["Switzerland", "Europe", 79.7, 83.9],
  ["Australia", "Oceania", 79.2, 83.3],
  ["United Kingdom", "Europe", 77.7, 80.7],
  ["United States", "Americas", 76.6, 76.4],
  ["China", "Asia", 71.4, 78.2],
  ["Brazil", "Americas", 70.1, 72.8],
  ["Russia", "Europe", 65.3, 69.4],
  ["India", "Asia", 62.7, 67.2],
  ["South Africa", "Africa", 55.9, 62.3],
  ["Ethiopia", "Africa", 50.7, 65.0],
  ["Nigeria", "Africa", 46.3, 52.7],
].flatMap(([country, continent, before, after]) => [
  {country, continent, year: "2000", "Life Expectancy": before},
  {country, continent, year: "2021", "Life Expectancy": after},
]);

const config = {
  data: life,
  groupBy: "year",
  facet: "continent",
  facetConfig: {scales: "independent"},
  x: "Life Expectancy",
  y: "country",
  gapSort: "descending",
};
