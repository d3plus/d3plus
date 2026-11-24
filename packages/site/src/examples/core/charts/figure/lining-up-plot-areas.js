// Revenue and margin for six countries, 2019–2024.
const countries = ["Brazil", "Mexico", "France", "Germany", "India", "Japan"];
const data = countries.flatMap((country, c) =>
  [2019, 2020, 2021, 2022, 2023, 2024].map((year, y) => ({
    country,
    year,
    revenue: (20 + c * 6 + y * (c + 2)) * 1e6,
    margin: 0.08 + c * 0.015 + y * 0.006,
  })),
);

const config = {
  title: "Revenue and margin",
  layoutConfig: {columns: 1, align: true},
  charts: [
    {
      chart: "LinePlot",
      config: {
        data,
        groupBy: "country",
        x: "year",
        y: "revenue",
        yConfig: {title: "Revenue"},
        legend: false,
      },
    },
    {
      chart: "LinePlot",
      config: {
        data,
        groupBy: "country",
        x: "year",
        y: "margin",
        yConfig: {title: "Margin", tickFormat: d => `${Math.round(d * 100)}%`},
        legend: false,
      },
    },
  ],
};
