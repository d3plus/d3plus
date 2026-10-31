const data = (() => {
  const regions = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  const products = ["Coffee", "Cocoa", "Tea"];
  const years = [2019, 2020, 2021, 2022, 2023];
  return regions.flatMap((region, r) =>
    products.flatMap((product, p) =>
      years.map((year, y) => ({
        region,
        product,
        year,
        exports: Math.round(
          (20 + ((r * 11 + p * 7 + y * 5) % 17) * 4) * (1 + r * 0.6),
        ),
      })),
    ),
  );
})();

const config = {
  data,
  groupBy: "product",
  sum: "exports",
  time: "year",
  facet: "region",
  facetConfig: {
    title: (region, rows) =>
      `${region}: ${rows.reduce((s, d) => s + d.exports, 0)}`,
    titleConfig: {fontSize: 13, textAnchor: "start"},
  },
};
