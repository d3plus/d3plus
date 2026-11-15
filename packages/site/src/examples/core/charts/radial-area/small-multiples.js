const sources = {
  Base: () => 30,
  Heating: h => 25 + 20 * Math.cos(((h - 6) / 24) * Math.PI * 2),
  Appliances: h =>
    8 +
    30 * Math.exp(-((h - 8) ** 2) / 2) +
    40 * Math.exp(-((h - 19) ** 2) / 3),
};

const config = {
  data: ["North", "South", "Coast"].flatMap((region, r) =>
    Object.keys(sources).flatMap(source =>
      Array.from({length: 24}, (_v, hour) => ({
        region,
        source,
        hour,
        kwh: Math.round(sources[source](hour) * (1 + r * 0.5)),
      })),
    ),
  ),
  groupBy: "source",
  x: "hour",
  y: "kwh",
  xDomain: [0, 24],
  stacked: true,
  facet: "region",
  facetConfig: {scales: "shared"},
};
