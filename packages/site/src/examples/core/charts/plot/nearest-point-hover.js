const config = {
  data: Array.from({length: 120}, (_, i) => ({
    id: `Point ${i + 1}`,
    x: Math.round((50 + 30 * Math.sin(i * 1.7) * Math.cos(i * 0.31)) * 10) / 10,
    y: Math.round((50 + 30 * Math.cos(i * 2.3) * Math.sin(i * 0.17)) * 10) / 10,
  })),
  groupBy: "id",
  x: "x",
  y: "y",
  legend: false,
  hoverDistance: 20,
  shapeConfig: {Circle: {r: 3}},
};
