// Monthly visitors over the first nine months of the year.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const visitors = {
  Museum: [12, 14, 18, 22, 25, 30, 41, 44, 28],
  Gardens: [3, 4, 9, 18, 30, 38, 42, 40, 26],
};

const config = {
  data: Object.keys(visitors).flatMap(site =>
    months.map((month, m) => ({site, month, visitors: visitors[site][m]})),
  ),
  groupBy: "site",
  x: "month",
  y: "visitors",
  xDomain: months.concat(["Oct", "Nov", "Dec"]),
  closed: false,
  innerRadius: 30,
  shapeConfig: {Line: {curve: "catmullRom"}, Circle: {r: 0}},
};
