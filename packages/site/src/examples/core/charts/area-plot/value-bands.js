const aqi = [
  42, 55, 78, 96, 120, 134, 112, 88, 64, 51, 47, 60, 85, 108, 92, 70,
];

const config = {
  data: aqi.map((value, i) => ({id: "Air quality", day: i + 1, value})),
  groupBy: "id",
  x: "day",
  y: "value",
  valueColors: {values: [50, 100], colors: ["#2b8a3e", "#f08c00", "#c92a2a"]},
};
