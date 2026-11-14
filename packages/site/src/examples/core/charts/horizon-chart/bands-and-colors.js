const anomalies = (() => {
  let seed = 3;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cities = ["Lagos", "Lima", "Oslo", "Perth", "Seoul", "Tucson"];
  return cities.flatMap((city, c) => {
    const drift = (c - 2.5) * 0.4;
    let value = drift;
    return Array.from({length: 120}, (_, week) => {
      value += (random() - 0.5) * 1.2 + (drift - value) * 0.08;
      return {
        city,
        week: new Date(Date.UTC(2024, 0, 1 + week * 3)),
        "Temperature Anomaly (°C)": Math.round(value * 100) / 100,
      };
    });
  });
})();

const config = {
  data: anomalies,
  groupBy: "city",
  time: "week",
  timeline: false,
  x: "week",
  y: "Temperature Anomaly (°C)",
  bands: 4,
  bandSize: 1,
  colors: {positive: "#e8590c", negative: "#5f3dc4"},
};
