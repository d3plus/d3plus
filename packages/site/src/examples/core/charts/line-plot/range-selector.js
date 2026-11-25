// Three years of a daily closing price.
const data = [];
let close = 100;
for (let i = 0; i < 1100; i++) {
  close += Math.sin(i / 17) * 0.8 + Math.cos(i / 7.1) * 0.6 + 0.05;
  data.push({
    id: "ACME",
    date: new Date(2022, 0, 1 + i),
    close: Math.round(close * 100) / 100,
  });
}

const config = {
  data,
  groupBy: "id",
  x: "date",
  time: "date",
  timeline: false,
  y: "close",
  legend: false,
  rangeSelector: ["1M", "6M", "YTD", "1Y", "All"],
};
