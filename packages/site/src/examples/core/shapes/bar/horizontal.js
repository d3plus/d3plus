const config = {
  data: [
    {id: "a", y: 70, right: 420, fill: "#5d6d7e"},
    {id: "b", y: 160, right: 260, fill: "#cc4b4b"},
    {id: "c", y: 250, right: 560, fill: "#3a7ca5"},
  ],
  fill: d => d.fill,
  x: 80,
  x1: d => d.right,
  y: "y",
};
