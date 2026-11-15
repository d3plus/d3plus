const data = [];
[2023, 2024].forEach((year, y) =>
  ["Q1", "Q2", "Q3", "Q4"].forEach((quarter, q) =>
    data.push({
      id: "Revenue",
      year: new Date(year, 0, 1),
      quarter,
      revenue: 40 + y * 10 + q * 3,
    }),
  ),
);

const config = {
  data,
  groupBy: "id",
  legend: false,
  x: ["year", "quarter"],
  xConfig: {
    levelFormat: value => `FY${String(value.getFullYear()).slice(2)}`,
  },
  xDomain: [
    [new Date(2023, 0, 1), "Q3"],
    [new Date(2023, 0, 1), "Q4"],
    [new Date(2024, 0, 1), "Q1"],
    [new Date(2024, 0, 1), "Q2"],
  ],
  y: "revenue",
};
