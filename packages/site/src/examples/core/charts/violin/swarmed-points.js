const flowers = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const species = [
    ["setosa", 1.5, 0.2],
    ["versicolor", 4.3, 0.5],
    ["virginica", 5.6, 0.55],
  ];
  return species.flatMap(([name, mean, sd]) =>
    Array.from({length: 50}, (_, i) => ({
      id: name + " " + (i + 1),
      species: name,
      "Petal Length": Math.round((mean + sd * normal()) * 100) / 100,
    })),
  );
})();

const config = {
  data: flowers,
  densityScale: "width",
  groupBy: "species",
  inner: "points",
  value: "Petal Length",
};
