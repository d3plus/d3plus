// Weekly trading volume; zooming either chart zooms both to the same dates.
const data = [];
for (let i = 0; i < 100; i++) {
  data.push({
    id: "ACME",
    date: new Date(2023, 0, 1 + i * 7),
    volume: Math.round(
      12000 + Math.abs(Math.sin(i / 3)) * 8000 + (i % 4) * 900,
    ),
  });
}

const config = {
  data,
  groupBy: "id",
  x: "date",
  time: "date",
  timeline: false,
  y: "volume",
  legend: false,
  zoomAxes: "x",
  link: {group: "line-plot-market", zoom: true},
};
