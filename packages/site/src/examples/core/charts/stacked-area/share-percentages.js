const config = {
  data: [
    {id: "alpha", x: 4, y: 7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta", x: 4, y: 17},
    {id: "beta", x: 5, y: 8},
    {id: "beta", x: 6, y: 13},
    {id: "gamma", x: 4, y: 10},
    {id: "gamma", x: 5, y: 18},
    {id: "gamma", x: 6, y: 5},
  ],
  groupBy: "id",
  stackOffset: "expand",
  x: "x",
  y: "y",
  yConfig: {
    tickFormat: d => `${formatAbbreviate(d * 100)}%`,
  },
};
