const config = {
  data: [
    ["Jan", -3, -12],
    ["Feb", -1, -11],
    ["Mar", 5, -5],
    ["Apr", 13, 2],
    ["May", 20, 8],
    ["Jun", 25, 14],
    ["Jul", 28, 17],
    ["Aug", 27, 16],
    ["Sep", 22, 11],
    ["Oct", 14, 5],
    ["Nov", 6, -1],
    ["Dec", -1, -8],
  ].flatMap(([month, high, low]) => [
    {id: "High", month, temperature: high},
    {id: "Low", month, temperature: low},
  ]),
  groupBy: "id",
  color: d => (d.id === "High" ? "#e8590c" : "#1c7ed6"),
  fillBetween: true,
  fillBetweenConfig: {
    fill: d => (d.above === "High" ? "#868e96" : "#e03131"),
    fillOpacity: 0.2,
  },
  x: "month",
  y: "temperature",
};
