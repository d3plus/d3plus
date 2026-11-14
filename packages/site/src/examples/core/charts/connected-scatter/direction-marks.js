const driving = Array.from({length: 30}, (_, i) => {
  const t = i / 29;
  // Prices fall, rise, and fall again while driving keeps growing.
  return {
    country: "United States",
    year: 1980 + i,
    "Miles Driven per Person": Math.round(
      7000 + 3000 * t + 600 * Math.sin(t * Math.PI * 3),
    ),
    "Gas Price":
      Math.round((2.2 + 1.2 * Math.cos(t * Math.PI * 2.4) + 0.6 * t) * 100) /
      100,
  };
});

const config = {
  data: driving,
  groupBy: "country",
  legend: false,
  order: "year",
  pathArrows: false,
  pathLabels: d => `'${String(d.year).slice(2)}`,
  x: "Miles Driven per Person",
  y: "Gas Price",
};
