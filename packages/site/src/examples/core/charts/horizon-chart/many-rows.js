const returns = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({length: 20}, (_, f) => {
    const fund = `Fund ${f + 1}`;
    const drift = (f % 7) - 3;
    let value = drift;
    return Array.from({length: 100}, (_, day) => {
      value += (random() - 0.5) * 3 + (drift - value) * 0.08;
      return {
        fund,
        date: new Date(Date.UTC(2024, 0, 1 + day * 3)),
        "Excess Return (%)": Math.round(value * 100) / 100,
      };
    });
  }).flat();
})();

const config = {
  data: returns,
  groupBy: "fund",
  time: "date",
  timeline: false,
  x: "date",
  y: "Excess Return (%)",
  rowGap: 0,
};
