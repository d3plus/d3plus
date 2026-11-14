const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const lows = [-3, -2, 2, 7, 12, 17];
const highs = [4, 6, 11, 17, 22, 27];

const config = {
  connector: "bar",
  data: months.flatMap((month, i) => [
    {month, stat: "Low", "°C": lows[i]},
    {month, stat: "High", "°C": highs[i]},
  ]),
  discrete: "x",
  groupBy: "stat",
  x: "month",
  y: "°C",
};
