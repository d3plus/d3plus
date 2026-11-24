const temps = [-4, -2, 3, 9, 15, 20, 23, 22, 17, 10, 4, -1];

const config = {
  data: temps.map((temp, i) => ({id: "Temperature", month: i + 1, temp})),
  groupBy: "id",
  x: "month",
  y: "temp",
  valueColors: {type: "gradient", colors: ["#1971c2", "#f08c00", "#c92a2a"]},
  shapeConfig: {Line: {strokeWidth: 4}},
};
