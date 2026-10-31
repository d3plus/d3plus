const dense = (() => {
  let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  return Array.from({length: 1000}, (_, i) => {
    const c = i % 3;
    const base = normal();
    return {
      id: i,
      cluster: ["Alpha", "Beta", "Gamma"][c],
      a: Math.round((50 + 15 * base + 10 * c) * 10) / 10,
      b: Math.round((30 - 8 * base + 6 * normal()) * 10) / 10,
      c: Math.round((20 + 12 * c + 5 * normal()) * 10) / 10,
      d: Math.round((60 + 10 * normal() - 12 * c) * 10) / 10,
      e: Math.round((40 + 9 * base + 4 * normal()) * 10) / 10,
    };
  });
})();

const config = {
  data: dense,
  groupBy: ["cluster", "id"],
  renderer: "canvas",
};
