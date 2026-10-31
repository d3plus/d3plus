const config = {
  data: [
    {color: "#cc4b4b", id: "alpha"},
    {color: "#3a7ca5", id: "beta"},
    {color: "#5d9e6e", id: "gamma"},
    {color: "#b07cc6", id: "delta"},
  ],
  label: d => d.id,
  shapeConfig: {fill: d => d.color, r: 12},
  shape: "Circle",
  title: "Circle Markers",
  height: 100,
  width: 500,
};
