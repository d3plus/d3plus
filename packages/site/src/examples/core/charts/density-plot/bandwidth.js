const eruptions = (() => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  // Two kinds of eruption: short ones and long ones.
  return Array.from({length: 272}, (_, i) => ({
    eruption: i + 1,
    "Eruption (minutes)":
      Math.round(
        (i % 3 === 0 ? 2 + 0.3 * normal() : 4.3 + 0.4 * normal()) * 10,
      ) / 10,
  }));
})();

const config = {
  data: eruptions,
  densityConfig: {bandwidth: 0.1},
  value: "Eruption (minutes)",
};
