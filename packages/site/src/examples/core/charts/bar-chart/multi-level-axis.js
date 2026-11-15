const data = [];
[2023, 2024, 2025].forEach((year, y) =>
  ["Q1", "Q2", "Q3", "Q4"].forEach((quarter, q) =>
    ["Online", "Retail"].forEach((channel, c) =>
      data.push({
        channel,
        year,
        quarter,
        sales: 20 + y * 6 + q * 2 + c * 9,
      }),
    ),
  ),
);

const config = {
  data,
  groupBy: "channel",
  stacked: true,
  x: ["year", "quarter"],
  xConfig: {levelConfig: {fontWeight: 600}},
  y: "sales",
};
