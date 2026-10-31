const config = {
  data: ["Coal", "Gas", "Solar"].flatMap((source, k) =>
    [2018, 2019, 2020, 2021, 2022, 2023].map((year, i) => ({
      source,
      year,
      value: 10 + k * 5 + i * (k + 1),
    })),
  ),
  discrete: "y",
  groupBy: "source",
  stacked: true,
  x: "value",
  y: "year",
  yConfig: {reverse: true},
};
