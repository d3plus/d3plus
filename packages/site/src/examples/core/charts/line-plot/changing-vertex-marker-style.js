const config = {
  data: [
    {id: "alpha", x: 4, y: 9},
    {id: "alpha", x: 5, y: 17},
    {id: "alpha", x: 6, y: 13},
    {id: "beta", x: 4, y: 17},
    {id: "beta", x: 5, y: 8},
    {id: "beta", x: 6, y: 16},
    {id: "gamma", x: 4, y: 14},
    {id: "gamma", x: 5, y: 9},
    {id: "gamma", x: 6, y: 11},
  ],
  groupBy: "id",
  lineMarkers: true,
  lineMarkerConfig: {
    opacity: d => (d.x === 6 ? 1 : 0.25),
    r: d => (d.x === 6 ? 6 : 4),
  },
  x: "x",
  y: "y",
};
