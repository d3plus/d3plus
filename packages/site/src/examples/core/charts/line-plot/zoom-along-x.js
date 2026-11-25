// Three years of daily visitors.
const data = [];
for (let i = 0; i < 1100; i++) {
  const wave = Math.sin(i / 23) * 7 + Math.sin(i / 5.3) * 3;
  data.push({
    id: "Visitors",
    date: new Date(2022, 0, 1 + i),
    value: Math.round(120 + i / 6 + wave * (1 + i / 400)),
  });
}

const config = {
  data,
  groupBy: "id",
  x: "date",
  time: "date",
  timeline: false,
  y: "value",
  legend: false,
  zoomAxes: ["x"],
  zoomDrag: "brush",
};
