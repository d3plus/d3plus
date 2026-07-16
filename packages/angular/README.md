# @d3plus/angular

[![NPM version](https://img.shields.io/npm/v/@d3plus/angular.svg)](https://www.npmjs.com/package/@d3plus/angular)

Angular components for d3plus visualizations. Published in the [Angular Package Format](https://angular.dev/tools/libraries/angular-package-format) (partial-Ivy), so it works in your app's ahead-of-time (AOT) production builds.

## Installing

`npm install @d3plus/angular`. Requires `@angular/core` and `@angular/common` (v20+) as peer dependencies.

## Usage

`D3plusVizComponent` is a standalone component (`selector: d3plus-viz`). Import it, pass the d3plus class via the `viz` input and its config via `config`:

```ts
import {Component} from "@angular/core";
import {D3plusVizComponent} from "@d3plus/angular";
import {Treemap} from "@d3plus/core";

@Component({
  selector: "app-chart",
  imports: [D3plusVizComponent],
  template: `<d3plus-viz [viz]="Treemap" [config]="config" style="height: 400px" />`,
})
export class ChartComponent {
  readonly Treemap = Treemap;
  config = {
    data: [
      {parent: "Group 1", id: "alpha", value: 29},
      {parent: "Group 2", id: "beta", value: 10},
    ],
    groupBy: ["parent", "id"],
    sum: "value",
  };
}
```

The component instantiates the visualization on init and re-renders whenever an input changes. The instance is reused across changes so the chart tweens between states rather than restarting, and is destroyed when the component is torn down. Reassigning `config` to a structurally-identical value is a no-op; set `[forceUpdate]="true"` to render on every change.

## Inputs

| Input | Description |
| --- | --- |
| `viz` | **Required.** The d3plus visualization class to instantiate (e.g. `Treemap`). |
| `config` | Config object forwarded to the instance's `.config()` method. |
| `globalConfig` | Config merged ahead of `config` — a shared baseline across charts. |
| `callback` | A function invoked at the end of each render cycle. |
| `forceUpdate` | When `true`, re-renders on every change even if the config is unchanged. |
