import {select} from "d3-selection";
import {stylize} from "@d3plus/dom";

stylize(select("rect"), {
  fill: "#1c7ed6",
  stroke: "#1864ab",
  "stroke-width": 3,
  opacity: 0.85,
});
