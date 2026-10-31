const heatmapData = [];

["North", "South", "East", "West", "Central"].forEach((row, i) => {
  ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"].forEach((column, j) => {
    heatmapData.push({
      row,
      column,
      value: (i + 1) * (j + 1) * 10 + ((i * 7 + j * 13) % 9) * 4,
      change: ((i * 17 + j * 29) % 61) - 30,
    });
  });
});

const config = {
  data: heatmapData,
  groupBy: ["row", "column"],
  row: "row",
  column: "column",
  colorScale: "value",
  colorScalePosition: "right",
  theme: "dark",
};
