const data = [];
["Alpha", "Beta", "Gamma"].forEach((id, j) => {
  for (let x = 0; x < 40; x++)
    data.push({
      id,
      x,
      y: Math.round((Math.sin(x / 4 + j) * 10 + 20) * 10) / 10,
    });
});

const config = {
  data,
  groupBy: "id",
  x: "x",
  y: "y",
  zoomControls: false,
  zoomDrag: "brush",
  zoomDoubleClick: "reset",
};
