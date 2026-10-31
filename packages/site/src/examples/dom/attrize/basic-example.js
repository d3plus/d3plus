import {select} from "d3-selection";
import {attrize} from "@d3plus/dom";

attrize(select("rect"), {
  width: 120,
  height: 40,
  rx: 6,
  fill: "#1c7ed6",
  "data-label": "attrized",
});
