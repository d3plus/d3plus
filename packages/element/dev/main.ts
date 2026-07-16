import {defineElements, D3plusElement} from "../index.ts";

// Register <d3plus-treemap>, <d3plus-bar-chart>, … as custom elements.
defineElements();

const data = [
  {parent: "Group 1", id: "alpha", value: 29},
  {parent: "Group 1", id: "beta", value: 10},
  {parent: "Group 1", id: "gamma", value: 2},
  {parent: "Group 2", id: "delta", value: 29},
  {parent: "Group 2", id: "eta", value: 25},
];

const viz = document.getElementById("viz") as D3plusElement;
viz.config = {
  data,
  groupBy: ["parent", "id"],
  sum: "value",
};
