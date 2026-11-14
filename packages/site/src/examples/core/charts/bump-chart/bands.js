// Illustrative streaming hours (millions) by platform.
const hours = {
  Flix: [120, 150, 170, 180, 185, 190],
  Prime: [80, 95, 120, 140, 150, 160],
  Tube: [100, 140, 160, 175, 200, 230],
  Hulu: [60, 70, 75, 72, 70, 68],
  Plus: [0.5, 30, 60, 85, 110, 125],
};
const years = [2019, 2020, 2021, 2022, 2023, 2024];

// Rank the platforms by hours within each year.
const data = [];
years.forEach((year, y) => {
  Object.keys(hours)
    .sort((a, b) => hours[b][y] - hours[a][y])
    .forEach((platform, r) =>
      data.push({
        platform,
        year,
        rank: r + 1,
        "Hours (M)": hours[platform][y],
      }),
    );
});

const config = {
  data,
  groupBy: "platform",
  x: "year",
  y: "rank",
  size: "Hours (M)",
};
