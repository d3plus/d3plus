const bridges = [2023, 2024, 2025].flatMap((year, y) => [
  {year, driver: "Start", value: 100 + y * 20, subtotal: true},
  {year, driver: "Price", value: 12 - y * 9},
  {year, driver: "Volume", value: -6 + y * 8},
  {year, driver: "Mix", value: 4 - y * 3},
  {year, driver: "FX", value: -3 - y},
  {year, driver: "End", subtotal: true},
]);

const config = {
  data: bridges,
  facet: "year",
  x: "driver",
  y: "value",
  subtotal: "subtotal",
};
