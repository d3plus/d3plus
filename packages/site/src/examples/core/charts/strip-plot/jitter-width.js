const penguins = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const species = ["Adelie", "Chinstrap", "Gentoo"];
  return Array.from({length: 180}, (_, i) => ({
    id: "Penguin " + (i + 1),
    species: species[i % 3],
    "Body Mass (g)": Math.round(3700 + 300 * (i % 3) ** 2 + 420 * normal()),
  }));
})();

const config = {
  data: penguins,
  groupBy: "id",
  color: "species",
  jitter: 0.25,
  legend: false,
  x: "species",
  y: "Body Mass (g)",
};
