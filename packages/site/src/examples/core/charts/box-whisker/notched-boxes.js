const scores = (() => {
  let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const regions = [
    {name: "North", n: 120, mean: 52, sd: 9},
    {name: "South", n: 30, mean: 61, sd: 14},
    {name: "East", n: 70, mean: 48, sd: 6},
    {name: "West", n: 12, mean: 57, sd: 11},
  ];
  return regions.flatMap(r =>
    Array.from({length: r.n}, (_, i) => ({
      id: r.name + " " + (i + 1),
      region: r.name,
      score: Math.round(r.mean + r.sd * normal() + 6 * random() ** 4),
    })),
  );
})();

const config = {
  data: scores,
  groupBy: "id",
  boxNotch: true,
  boxPoints: false,
  color: "region",
  legend: false,
  x: "region",
  y: "score",
};
