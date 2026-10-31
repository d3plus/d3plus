const config = {
  data: [
    {id: "alpha", value: 300},
    {id: "alpha", value: 20},
    {id: "alpha", value: 180},
    {id: "alpha", value: 40},
    {id: "alpha", value: 170},
    {id: "alpha", value: 125},
    {id: "alpha", value: 74},
    {id: "alpha", value: 80},
    {id: "beta", value: 180},
    {id: "beta", value: 30},
    {id: "beta", value: 120},
    {id: "beta", value: 50},
    {id: "beta", value: 140},
    {id: "beta", value: 115},
    {id: "beta", value: 14},
    {id: "beta", value: 30},
  ],
  groupBy: ["id", "value"],
  discrete: "y",
  shapeConfig: {
    Box: {
      orient: "horizontal",
    },
  },
  x: "value",
  y: "id",
};
