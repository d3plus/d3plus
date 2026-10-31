const config = {
  data: ["Africa", "Americas", "Asia", "Europe"].flatMap((region, r) =>
    [
      {id: "Revenue", base: 240, target: 250, ranges: [150, 225]},
      {id: "Profit", base: 24, target: 27, ranges: [20, 25]},
      {id: "Orders", base: 1500, target: 1800, ranges: [1200, 1700]},
    ].map((m, k) => ({
      id: m.id,
      region,
      value: Math.round(m.base * (0.75 + ((r * 3 + k * 5) % 7) / 10)),
      target: m.target,
      ranges: m.ranges,
    })),
  ),
  bands: d => d.ranges,
  facet: "region",
};
