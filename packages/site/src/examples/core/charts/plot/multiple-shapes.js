const config = {
  data: [
    {value: 100, weight: 0.45, name: "alpha"},
    {value: 70, weight: 0.6, name: "beta"},
    {value: 40, weight: -0.2, name: "gamma"},
    {value: 15, weight: 0.1, name: "delta"},
    {value: 5, weight: -0.43, name: "epsilon"},
    {value: 1, weight: 0, name: "zeta"},
  ],
  groupBy: "name",
  shape: d =>
    d.name === "alpha" || d.name === "delta" || d.name === "epsilon"
      ? "Rect"
      : "Circle",
  size: "value",
  x: "value",
  y: "weight",
};
