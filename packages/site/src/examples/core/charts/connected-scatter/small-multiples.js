const development = (() => {
  let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const countries = [
    ["Avalon", 8000, 0.035, 66, 0.32],
    ["Brightwater", 22000, 0.018, 74, 0.18],
    ["Cedar Isles", 3000, 0.05, 55, 0.45],
  ];
  return countries.flatMap(([country, gdp, growth, life, gain]) =>
    Array.from({length: 16}, (_, i) => {
      // A downturn in the middle years pulls each path back.
      const shock = i >= 7 && i <= 9 ? 0.82 : 1;
      return {
        country,
        year: 1990 + i * 2,
        "GDP per Capita": Math.round(
          gdp * (1 + growth) ** (i * 2) * shock * (0.97 + random() * 0.06),
        ),
        "Life Expectancy":
          Math.round(
            (life + gain * i * 2 - (shock < 1 ? 2.5 : 0) + random() * 0.6) * 10,
          ) / 10,
      };
    }),
  );
})();

const config = {
  data: development,
  facet: "country",
  groupBy: "country",
  legend: false,
  order: "year",
  x: "GDP per Capita",
  y: "Life Expectancy",
};
