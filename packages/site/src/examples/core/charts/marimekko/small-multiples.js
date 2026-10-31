const byYear = [2020, 2022, 2024].flatMap((year, y) =>
  [
    ["North America", [62, 24, 1, 1, 9]],
    ["Latin America", [6, 14, 7, 3, 8]],
    ["Europe", [38, 30, 12, 6, 14]],
    ["Asia Pacific", [70, 34, 40, 38, 58]],
  ].flatMap(([region, values]) =>
    values.map((revenue, i) => ({
      Year: year,
      Region: region,
      Brand: ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"][i],
      Revenue: Math.round(revenue * (0.5 + 0.25 * y + ((i * 7) % 5) * 0.04)),
    })),
  ),
);

const config = {
  data: byYear,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  facet: "Year",
};
