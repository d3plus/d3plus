const config = {
  data: [
    {id: "North", x: 95, y: 150, width: 150, height: 150, fill: "#5d6d7e"},
    {id: "South", x: 260, y: 150, width: 150, height: 110, fill: "#cc4b4b"},
    {id: "East", x: 425, y: 150, width: 150, height: 190, fill: "#3a7ca5"},
  ],
  fill: d => d.fill,
  height: "height",
  label: d => `${d.id}\n${d.width}×${d.height}`,
  labelConfig: {
    fontColor: "#fff",
    fontSize: 14,
    textAnchor: "middle",
    verticalAlign: "middle",
  },
  width: "width",
  x: "x",
  y: "y",
};
