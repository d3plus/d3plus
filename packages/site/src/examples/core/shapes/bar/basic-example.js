const config = {
  data: [
    {id: "a", x: 90, top: 90, width: 70, fill: "#5d6d7e"},
    {id: "b", x: 210, top: 40, width: 70, fill: "#cc4b4b"},
    {id: "c", x: 330, top: 150, width: 70, fill: "#3a7ca5"},
  ],
  x: "x",
  y: 250,
  y1: d => d.top,
  width: "width",
  fill: d => d.fill,
};
