const bySex = (() => {
  let seed = 42;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = (mu, sigma) =>
    mu +
    sigma *
      Math.sqrt(-2 * Math.log(random())) *
      Math.cos(2 * Math.PI * random());
  return [
    ...Array.from({length: 600}, () => ({
      Sex: "Male",
      "Height (cm)": normal(176, 7),
    })),
    ...Array.from({length: 600}, () => ({
      Sex: "Female",
      "Height (cm)": normal(163, 6.5),
    })),
  ];
})();

const config = {
  data: bySex,
  groupBy: "Sex",
  value: "Height (cm)",
  binNormalize: "density",
};
