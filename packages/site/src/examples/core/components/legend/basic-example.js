const config = {
  data: [
    {color: "red", id: "alpha"},
    {color: "orange", id: "beta"},
    {color: "green", id: "gamma"},
    {color: "blue", id: "delta"},
    {color: "purple", id: "epsilon"},
  ],
  label: d => d.id,
  shapeConfig: {
    fill: d => d.color,
    r: 10,
    height: 20,
    width: 20,
  },
  shape: "Rect",
  title: "A Basic Legend",
  height: 100,
  width: 500,
};
