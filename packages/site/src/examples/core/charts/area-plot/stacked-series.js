const seriesData = ["alpha", "beta", "gamma"].flatMap((id, s) =>
  [1, 2, 3, 4, 5, 6].map(x => ({id, x, y: 6 + ((x * 7 + s * 5) % 11) + s * 3})),
);

const config = {
  data: seriesData,
  groupBy: "id",
  stacked: true,
  x: "x",
  y: "y",
};
