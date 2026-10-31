const heights = (() => {
  let seed = 42;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = (mu, sigma) =>
    mu +
    sigma *
      Math.sqrt(-2 * Math.log(random())) *
      Math.cos(2 * Math.PI * random());
  return Array.from({length: 1000}, () => ({"Height (cm)": normal(170, 10)}));
})();

const config = {
  data: heights,
  value: "Height (cm)",
};
