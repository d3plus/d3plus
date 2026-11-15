// Average monthly rainfall (mm).
const rain = {
  Seattle: [142, 96, 94, 69, 48, 38, 18, 23, 38, 89, 155, 150],
  London: [55, 41, 42, 44, 49, 45, 45, 50, 49, 69, 59, 55],
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
  data: Object.keys(rain).flatMap(city =>
    months.map((month, m) => ({city, month, rainfall: rain[city][m]})),
  ),
  groupBy: "city",
  x: "month",
  y: "rainfall",
};
