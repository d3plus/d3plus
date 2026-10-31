const countries = (() => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const regions = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  return Array.from({length: 180}, (_, i) => {
    const region = regions[i % 5];
    const income = Math.round(Math.exp(8.6 + 0.3 * (i % 5) + 0.8 * normal()));
    return {
      country: "Country " + (i + 1),
      region,
      "GDP per Capita": income,
      "Life Expectancy":
        Math.round((48 + 3 * Math.log(income) + 2.5 * normal()) * 10) / 10,
      Population: Math.round(Math.exp(15.5 + 1.3 * normal())),
    };
  });
})();

const config = {
  data: countries,
  groupBy: "country",
  color: "region",
  x: "Life Expectancy",
  y: "region",
};
