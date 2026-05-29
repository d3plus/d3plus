/**
    `runChartDraw(viz, def, stage, transform?)` — collapses the canonical
    chart-subclass `_draw` body into a single call.

    Every Viz-extending chart subclass (Tree, Pie, Pack, Treemap, Matrix,
    RadialMatrix, Priestley, Network, Rings, Geomap, Radar) has the same
    three-line sequence after `super._draw(callback)`:

      const {shapeData} = runStages({viz: this}, [layoutStage]);
      this._chartScene = def.emit({viz: this, shapeData});
      this._chartTransform = { ... };

    This helper inlines that. The chart's `_draw` becomes:

      _draw(callback) {
        super._draw(callback);
        runChartDraw(this, myDef, applyMyLayout);
        return this;
      }

    For charts that compute a non-default `_chartTransform` (Pie centers,
    Radar centers, etc.), pass a third arg that returns the transform.

    Doesn't reach into chart-specific stash patterns (e.g. Pack writes
    `_packOffsetX`/`_packOffsetY` from its stage; the transform fn can
    read those off `viz` if needed).

    @param viz The chart instance (`this` from `_draw`).
    @param def The chart's `ChartDefinition` (e.g. `treeDef`, `pieDef`).
    @param stage The chart-specific layout `TransformStage`.
    @param transformFn Optional builder for `_chartTransform`. Default:
                       margin-origin (`{x: margin.left, y: margin.top}`).
*/

import {runStages} from "./stages.js";
import {marginOriginTransform} from "./chartGeometry.js";

import type {Transform} from "@d3plus/render";
import type {ChartDefinition, TransformStage} from "./ChartDefinition.js";
import type {Viz} from "./vizTypes.js";

export function runChartDraw(
  viz: Viz,
  def: ChartDefinition,
  stage: TransformStage,
  transformFn?: (viz: Viz) => Transform | undefined,
): void {
  // Invariant: this helper OWNS `_chartScene` for the current draw — it
  // overwrites with `def.emit(ctx)`. The Plot family takes a different
  // flow (Plot._paint pushes into `_chartScene` imperatively, and its
  // def.emit is `plotShapesEmit` which returns a SNAPSHOT of the current
  // `_chartScene`). Calling `runChartDraw` on a Plot-family chart would
  // create a feedback loop (emit returns _chartScene → we overwrite
  // _chartScene with that same snapshot). Fail loud so future
  // contributors who try to "unify" Plot with runChartDraw can't silently
  // clobber the chart scene.
  if ((def.emit as unknown as {__isPlotShapesEmit__?: boolean}).__isPlotShapesEmit__) {
    throw new Error(
      `runChartDraw cannot drive ${def.name} — its emit is plotShapesEmit, ` +
      "which would create a feedback loop. Plot-family charts (BarChart, " +
      "AreaPlot, LinePlot, BumpChart, StackedArea, BoxWhisker, Donut, Plot) " +
      "rely on Plot._paint to populate _chartScene imperatively; their " +
      "_draw should NOT call runChartDraw.",
    );
  }
  const ctx = runStages({viz}, [stage]);
  viz._chartScene = def.emit(ctx);
  viz._chartTransform = transformFn
    ? transformFn(viz)
    : marginOriginTransform(viz);
}
