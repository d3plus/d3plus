const thresholdSizes = {
  Alpha: 40,
  Bravo: 30,
  Charlie: 25,
  Delta: 20,
  Echo: 15,
  Fox: 1.2,
  Golf: 0.8,
  Hotel: 0.6,
  India: 0.9,
  Juliet: 0.4,
};

const thresholdData = Object.entries(thresholdSizes).flatMap(([id, base], s) =>
  [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(year => ({
    id,
    year,
    value: Math.round(base * (1 + 0.15 * Math.sin(year + s)) * 100) / 100,
  })),
);

const config = {
  data: thresholdData,
  groupBy: "id",
  threshold: 0.05,
  x: "year",
  y: "value",
};
