const streamData = [4, 5, 6, 7, 8, 9].flatMap(x => [
  {id: "alpha", x, y: 12 + 8 * Math.sin(x)},
  {id: "beta", x, y: 18 + 6 * Math.cos(x)},
  {id: "gamma", x, y: 10 + 5 * Math.sin(x + 1)},
  {id: "delta", x, y: 14 + 7 * Math.cos(x + 2)},
]);

const config = {
  data: streamData,
  groupBy: "id",
  stackOffset: "silhouette",
  stackOrder: "insideOut",
  x: "x",
  y: "y",
};
