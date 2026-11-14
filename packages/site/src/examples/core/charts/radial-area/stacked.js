// A household's energy use (kWh) through the day, by source.
const sources = {
  Base: () => 30,
  Heating: h => 25 + 20 * Math.cos(((h - 6) / 24) * Math.PI * 2),
  Lighting: h => (h >= 17 || h < 7 ? 22 : 4),
  Appliances: h =>
    8 +
    30 * Math.exp(-((h - 8) ** 2) / 2) +
    40 * Math.exp(-((h - 19) ** 2) / 3),
};

const config = {
  data: Object.keys(sources).flatMap(source =>
    Array.from({length: 24}, (_v, hour) => ({
      source,
      hour,
      kwh: Math.round(sources[source](hour)),
    })),
  ),
  groupBy: "source",
  x: "hour",
  y: "kwh",
  xDomain: [0, 24],
  stacked: true,
  lineLabels: true,
};
