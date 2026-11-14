// Correlations between seven measures of 32 cars (the mtcars dataset).
const measures = ["mpg", "cyl", "disp", "hp", "drat", "wt", "qsec"];
const upper = [
  [-0.852, -0.848, -0.776, 0.681, -0.868, 0.419],
  [0.902, 0.832, -0.7, 0.782, -0.591],
  [0.791, -0.71, 0.888, -0.434],
  [-0.449, 0.659, -0.708],
  [-0.712, 0.091],
  [-0.175],
];
const correlation = (i, j) =>
  i === j ? 1 : upper[Math.min(i, j)][Math.max(i, j) - Math.min(i, j) - 1];

const data = [];
measures.forEach((a, i) =>
  measures.forEach((b, j) =>
    data.push({x: a, y: b, correlation: correlation(i, j)}),
  ),
);

const config = {
  data,
  groupBy: ["x", "y"],
  column: "x",
  row: "y",
  size: "correlation",
  colorScale: "correlation",
  colorScalePosition: "right",
};
