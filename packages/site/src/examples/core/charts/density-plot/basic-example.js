const penguins = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const species = [
    ["Adelie", 150, 190, 6.5, ["Biscoe", "Dream", "Torgersen"]],
    ["Chinstrap", 68, 196, 7, ["Dream"]],
    ["Gentoo", 124, 217, 6.5, ["Biscoe"]],
  ];
  return species.flatMap(([name, n, mean, sd, islands]) =>
    Array.from({length: n}, (_, i) => ({
      species: name,
      island: islands[i % islands.length],
      "Flipper Length (mm)": Math.round((mean + sd * normal()) * 10) / 10,
    })),
  );
})();

const config = {
  data: penguins,
  groupBy: "species",
  value: "Flipper Length (mm)",
};
