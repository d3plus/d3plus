// The whole price history as an overview: drag its band (or focus it and use
// the arrow keys, Home/End, and + / −) to set the window the charts above show.
const data = [];
let close = 100;
for (let i = 0; i < 700; i++) {
  close += Math.sin(i / 17) * 0.8 + Math.cos(i / 7.1) * 0.6 + 0.05;
  data.push({
    id: "ACME",
    date: new Date(2023, 0, 1 + i),
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
  zoomControls: false,
  yConfig: {title: false, ticks: []},
  link: {group: "line-plot-market", zoom: "overview"},
};
