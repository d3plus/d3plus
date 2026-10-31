const config = {
  data: [
    {id: "alpha", time: 4, value: 240},
    {id: "beta", time: 5, value: 120},
    {id: "gamma", time: 6, value: 180},
    {id: "delta", time: 4, value: 240},
    {id: "delta", time: 5, value: 120},
    {id: "delta", time: 6, value: 180},
  ],
  groupBy: "id",
  shape: d => (d.id === "delta" ? "Line" : "Circle"),
  shapeConfig: {
    Line: {
      strokeLinecap: "round",
      strokeWidth: 5,
    },
  },
  shapeSort: (a, b) =>
    ["Circle", "Line"].indexOf(b) - ["Circle", "Line"].indexOf(a),
  sizeMin: 20,
  x: "time",
  y: "value",
};
