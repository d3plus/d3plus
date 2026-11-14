const config = {
  data: ["Lisbon", "Denver", "Osaka"].flatMap((city, c) =>
    ["Mobile", "Desktop"].flatMap((device, v) =>
      Array.from({length: 24}, (_x, hour) => ({
        city,
        device,
        hour,
        visits: Math.round(
          (c + 1) *
            (v ? 60 : 40) *
            (1 + Math.sin(((hour - 6 - c * 2) / 24) * Math.PI * 2)),
        ),
      })),
    ),
  ),
  groupBy: "device",
  x: "hour",
  y: "visits",
  xDomain: [0, 24],
  facet: "city",
  facetConfig: {scales: "shared"},
};
