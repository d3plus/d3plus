const config = {
  data: [
    {color: "#cc4b4b", id: "alpha"},
    {color: "#e0913a", id: "beta"},
    {color: "#5d9e6e", id: "gamma"},
    {color: "#3a7ca5", id: "delta"},
    {color: "#b07cc6", id: "epsilon"},
  ],
  label: d => d.id,
  shapeConfig: {fill: d => d.color, height: 20, width: 20},
  shape: "Rect",
  direction: "column",
  title: "Vertical Legend",
  height: 240,
  width: 220,
};
