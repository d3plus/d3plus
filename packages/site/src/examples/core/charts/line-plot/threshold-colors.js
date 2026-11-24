const sales = [58, 64, 61, 47, 39, 42, 55, 68, 72, 49, 44, 63];
const returns = [41, 44, 52, 57, 54, 48, 45, 50, 53, 56, 51, 46];

const config = {
  data: sales.flatMap((value, i) => [
    {id: "Sales", month: i + 1, value},
    {id: "Returns", month: i + 1, value: returns[i]},
  ]),
  groupBy: "id",
  x: "month",
  y: "value",
  valueColors: {values: [50], colors: ["#c92a2a", null]},
  lineMarkers: true,
  referenceLines: [{y: 50, label: "Target"}],
};
