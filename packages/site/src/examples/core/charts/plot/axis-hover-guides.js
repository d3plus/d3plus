const config = {
  data: [
    {id: "alpha", gdp: 1200, life: 64.2, population: 12},
    {id: "beta", gdp: 2400, life: 70.8, population: 40},
    {id: "gamma", gdp: 3100, life: 68.1, population: 22},
    {id: "delta", gdp: 4600, life: 75.4, population: 31},
    {id: "epsilon", gdp: 5200, life: 72.9, population: 8},
  ],
  groupBy: "id",
  size: "population",
  x: "gdp",
  y: "life",
  axisHover: true,
  axisHoverConfig: {
    guideConfig: {strokeDasharray: "4 3", strokeWidth: 1},
    badgeConfig: {fontSize: 12, padding: 4},
  },
};
