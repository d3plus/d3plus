const config = {
  data: [
    {row: "R1", column: "C1", value: 10},
    {row: "R1", column: "C2", value: 25},
    {row: "R1", column: "C3", value: 15},
    {row: "R2", column: "C1", value: 30},
    {row: "R2", column: "C2", value: 20},
    {row: "R2", column: "C3", value: 5},
    {row: "R3", column: "C1", value: 18},
    {row: "R3", column: "C2", value: 12},
    {row: "R3", column: "C3", value: 28},
  ],
  groupBy: ["row", "column"],
  column: "column",
  row: "row",
  colorScale: "value",
  colorScaleConfig: {scale: "jenks"},
  colorScalePosition: "right",
};
