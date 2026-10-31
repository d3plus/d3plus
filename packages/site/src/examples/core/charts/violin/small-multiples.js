const incomes = (() => {
  let seed = 19;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  return ["Africa", "Americas", "Asia", "Europe"].flatMap((region, r) =>
    ["Rural", "Urban"].flatMap((area, a) =>
      Array.from({length: 60}, () => ({
        region,
        area,
        "Income (k$)":
          Math.round(
            Math.exp(2.4 + 0.25 * r + 0.35 * a + 0.45 * normal()) * 100,
          ) / 100,
      })),
    ),
  );
})();

const config = {
  data: incomes,
  facet: "region",
  groupBy: "area",
  value: "Income (k$)",
};
