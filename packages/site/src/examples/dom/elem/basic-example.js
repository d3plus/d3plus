import {select} from "d3-selection";
import {elem} from "@d3plus/dom";

elem("div.demo-box", {
  parent: select(container),
  enter: {"data-state": "entered", title: "created by elem()"},
  update: {"data-updated": "true"},
});
