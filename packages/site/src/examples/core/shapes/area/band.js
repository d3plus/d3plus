const config = {
  data: [
    {id: "range", x: 40, top: 60, bottom: 120},
    {id: "range", x: 160, top: 120, bottom: 220},
    {id: "range", x: 280, top: 70, bottom: 150},
    {id: "range", x: 400, top: 150, bottom: 240},
    {id: "range", x: 520, top: 50, bottom: 130},
    {id: "range", x: 640, top: 110, bottom: 200},
  ],
  fill: "#3a7ca5",
  fillOpacity: 0.35,
  y0: d => d.top,
  y1: d => d.bottom,
};
