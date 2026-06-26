/**
    `makeChart(def)` — produce a Viz-extending chart class from a
    ChartDefinition value.

    The class is identical for every chart: its constructor runs
    `applyDefinition(this, def)`, its `_draw` runs the shared Viz pipeline
    then the chart's own layout stage via `runChartDraw`, and its
    `_thresholdFunction` delegates to `def.thresholdFunction` if present.

    A chart's `index.ts` becomes literally `export default makeChart(def)`.
*/

import {applyDefinition} from "./applyDefinition.js";
import {runChartDraw} from "../pipeline/runChartDraw.js";
import Viz from "../viz/Viz.js";
import type {ChartDefinition} from "./ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

// The generated chart class extends a runtime-chosen base and overrides
// `_draw`/`_thresholdFunction` with looser signatures, which a concrete
// `new () => VizInstance` constructor type can't express; `any` is the factory
// escape hatch (call sites still get the real `Viz` API via the class itself).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyViz = any;
type VizCtor = new () => AnyViz;

/**
    `makeChart(def, Base?)` — produce a chart class from a def value.

    `Base` defaults to `Viz`; pass an existing chart class to inherit a
    specialization (e.g. `makeChart(donutDef, Pie)` for Donut).
*/
export function makeChart(def: ChartDefinition, Base: VizCtor = Viz): VizCtor {
  class Chart extends (Base as VizCtor) {
    constructor() {
      super();
      applyDefinition(this as unknown as VizInstance, def);
    }

    _draw(callback?: () => void) {
      (super._draw as (...args: unknown[]) => unknown)(callback);
      if (def.layoutStage) {
        runChartDraw(this as unknown as VizInstance, def, def.layoutStage, def.chartTransform);
      }
      return this;
    }

    _thresholdFunction(data: unknown[]) {
      return def.thresholdFunction
        ? def.thresholdFunction(this as unknown as VizInstance, data)
        : data;
    }
  }
  Object.defineProperty(Chart, "name", {value: def.name});
  return Chart;
}
