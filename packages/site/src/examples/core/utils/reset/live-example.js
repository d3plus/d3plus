import {Legend, RESET} from "@d3plus/core";

const data = [
  {id: "North", color: "#1c7ed6"},
  {id: "South", color: "#e67700"},
  {id: "East", color: "#2f9e44"},
];

const legend = new Legend()
  .select("#legend")
  .data(data)
  .shape("Circle")
  .render();

// The swatches go back to the default rectangles; nothing else changes.
legend.shape(RESET).render();
