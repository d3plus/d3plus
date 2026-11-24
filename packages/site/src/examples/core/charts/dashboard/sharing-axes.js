// Revenue and margin for six countries in two regions, 2019–2024.
const countries = {
  Brazil: "Americas",
  Mexico: "Americas",
  Chile: "Americas",
  France: "Europe",
  Germany: "Europe",
  Spain: "Europe",
};
const data = Object.entries(countries).flatMap(([country, region], c) =>
  [2019, 2020, 2021, 2022, 2023, 2024].map((year, y) => ({
    country,
    region,
    year,
    revenue: 20 + c * 6 + y * (c + 2),
    margin: 0.08 + c * 0.015 + y * 0.006,
  })),
);
const americas = data.filter(d => d.region === "Americas");
const europe = data.filter(d => d.region === "Europe");
const chart = (rows, y, title) => ({
  chart: "LinePlot",
  config: {data: rows, groupBy: "country", x: "year", y, title},
});

const config = {
  title: "Americas and Europe",
  layoutConfig: {columns: 2, shareX: true, shareY: true},
  // Each line is labeled, so no legend is needed.
  legend: false,
  charts: [
    chart(americas, "revenue", "Americas"),
    chart(europe, "revenue", "Europe"),
    chart(americas, "margin"),
    chart(europe, "margin"),
  ],
};
