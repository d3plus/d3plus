const config = {
  data: ["North", "South", "East"].flatMap((region, r) =>
    ["Hardware", "Software", "Services"].flatMap((product, p) =>
      ["Q1", "Q2", "Q3", "Q4"].map((quarter, q) => ({
        region,
        product,
        quarter,
        sales: (r + 1) * (20 + ((r * 17 + p * 29 + q * 13) % 45)),
      })),
    ),
  ),
  groupBy: "product",
  metric: "quarter",
  value: "sales",
  facet: "region",
  facetConfig: {scales: "shared"},
};
