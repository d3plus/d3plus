const sales = (() => {
  const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"];
  const regions = {
    "North America": [62, 24, 1, 1, 9],
    "Latin America": [6, 14, 7, 3, 8],
    Europe: [38, 30, 12, 6, 14],
    "Middle East & Africa": [8, 12, 6, 5, 16],
    "Asia Pacific": [70, 34, 40, 38, 58],
  };
  const units = {
    "North America": 150,
    "Latin America": 130,
    Europe: 190,
    "Middle East & Africa": 190,
    "Asia Pacific": 640,
  };
  return Object.entries(regions).flatMap(([region, values]) =>
    values.map((revenue, i) => ({
      Region: region,
      Brand: brands[i],
      Revenue: revenue,
      "Units Sold": units[region],
    })),
  );
})();

const config = {
  data: sales,
  discrete: "y",
  groupBy: "Brand",
  x: "Revenue",
  y: "Region",
};
