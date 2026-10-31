const forecasts = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const series = [
    ["CPI Inflation", 2.4, -0.06, 0.55, "Inflation"],
    ["Core Inflation", 2.9, -0.08, 0.4, "Inflation"],
    ["GDP Growth", 1.8, 0.03, 0.7, "Growth"],
    ["Unemployment", 4.1, 0.02, 0.3, "Growth"],
  ];
  const rows = [];
  series.forEach(([id, level, drift, spread, topic]) => {
    let value = level;
    for (let k = 0; k < 36; k++) {
      const date =
        2019 +
        Math.floor(k / 4) +
        "-" +
        String((k % 4) * 3 + 1).padStart(2, "0") +
        "-01";
      const h = k - 23;
      value = h <= 0 ? value + (random() - 0.5) * 0.9 : value + drift;
      const row = {id, topic, date, value: Math.round(value * 100) / 100};
      if (h >= 0) {
        const w = spread * Math.sqrt(h);
        row.p05 = Math.round((row.value - 1.645 * w) * 100) / 100;
        row.p95 = Math.round((row.value + 1.645 * w * 1.15) * 100) / 100;
        row.p20 = Math.round((row.value - 0.842 * w) * 100) / 100;
        row.p80 = Math.round((row.value + 0.842 * w * 1.15) * 100) / 100;
        row.p35 = Math.round((row.value - 0.385 * w) * 100) / 100;
        row.p65 = Math.round((row.value + 0.385 * w * 1.15) * 100) / 100;
      }
      rows.push(row);
    }
  });
  return rows;
})();

const config = {
  data: forecasts.filter(d => d.topic === "Inflation"),
  groupBy: "id",
  x: "date",
  time: "date",
  y: "value",
  confidence: [
    ["p05", "p95", "90%"],
    ["p35", "p65", "30%"],
  ],
  timeline: false,
};
