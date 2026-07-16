import {Component} from "@angular/core";
import {Treemap} from "@d3plus/core";
import {D3plusVizComponent} from "../src/public-api";

const data = [
  {parent: "Group 1", id: "alpha", value: 29},
  {parent: "Group 1", id: "beta", value: 10},
  {parent: "Group 1", id: "gamma", value: 2},
  {parent: "Group 2", id: "delta", value: 29},
  {parent: "Group 2", id: "eta", value: 25},
];

@Component({
  selector: "app-root",
  imports: [D3plusVizComponent],
  template: "<d3plus-viz [viz]=\"Treemap\" [config]=\"config\" style=\"display:block;height:75vh\"></d3plus-viz>",
})
export class AppComponent {
  readonly Treemap = Treemap;
  config = {data, groupBy: ["parent", "id"], sum: "value"};
}
