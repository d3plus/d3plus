const highs = {
  Oslo: [-1, 0, 4, 10, 16, 20, 22, 21, 16, 9, 4, 0],
  Cairo: [19, 21, 24, 28, 32, 34, 35, 35, 33, 30, 25, 21],
  "Buenos Aires": [30, 29, 26, 23, 19, 16, 15, 17, 19, 22, 25, 28],
};
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const config = {
  data: Object.keys(highs).flatMap(city =>
    months.map((month, m) => ({city, month, high: highs[city][m]})),
  ),
  groupBy: "city",
  x: "month",
  y: "high",
  levelFormat: d => `${d}°`,
};
