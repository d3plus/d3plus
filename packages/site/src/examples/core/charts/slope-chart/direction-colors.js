const renewables = [
  ["Brazil", 41, 47],
  ["Chile", 30, 36],
  ["Peru", 31, 30],
  ["Argentina", 10, 12],
  ["Colombia", 28, 27],
  ["Mexico", 17, 22],
  ["Uruguay", 57, 58],
  ["Ecuador", 29, 29],
].flatMap(([country, before, after]) => [
  {country, year: 2015, share: before},
  {country, year: 2024, share: after},
]);

const config = {
  data: renewables,
  groupBy: "country",
  x: "year",
  y: "share",
  yConfig: {
    tickFormat: d => `${d}%`,
  },
  slopeColor: true,
};
