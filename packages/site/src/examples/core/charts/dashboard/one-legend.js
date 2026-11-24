// Revenue for six countries in three regions, 2019–2024.
const countries = {
  Brazil: "Americas",
  Mexico: "Americas",
  France: "Europe",
  Germany: "Europe",
  India: "Asia",
  Japan: "Asia",
};
const data = Object.entries(countries).flatMap(([country, region], c) =>
  [2019, 2020, 2021, 2022, 2023, 2024].map((year, y) => ({
    country,
    region,
    year,
    revenue: 20 + c * 6 + y * (c + 2),
  })),
);
const latest = data.filter(d => d.year === 2024);

const config = {
  title: "Revenue by region",
  legendChart: 1,
  legendPosition: "top",
  charts: [
    {
      chart: "BarChart",
      config: {
        data: latest,
        groupBy: "country",
        color: "region",
        x: "country",
        y: "revenue",
      },
    },
    {
      chart: "StackedArea",
      config: {data, groupBy: "region", x: "year", y: "revenue"},
    },
  ],
};
