// Average daily highs (°C) by month.
const highs = {
  Oslo: [-1, 0, 4, 10, 16, 20, 22, 21, 16, 9, 4, 0],
  Sydney: [26, 26, 25, 23, 20, 18, 17, 18, 20, 22, 24, 25],
  Cairo: [19, 21, 24, 28, 32, 34, 35, 35, 33, 30, 25, 21],
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
};
