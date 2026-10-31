const config = {
  data: ["Africa", "Americas", "Asia", "Europe"].flatMap((region, r) =>
    ["Q1", "Q2", "Q3", "Q4"].flatMap((quarter, q) => [
      {region, quarter, year: "2024", sales: 20 + ((r * 7 + q * 5) % 17)},
      {region, quarter, year: "2025", sales: 24 + ((r * 5 + q * 9) % 19)},
    ]),
  ),
  groupBy: "year",
  facet: "region",
  x: "quarter",
  y: "sales",
};
