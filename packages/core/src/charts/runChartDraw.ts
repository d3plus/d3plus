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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Viz = any;

export function runChartDraw(
  viz: Viz,
  def: ChartDefinition,
  stage: TransformStage,
  transformFn?: (viz: Viz) => Transform | undefined,
): void {
  const {shapeData} = runStages({viz} as any, [stage]) as unknown as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shapeData: any[];
  };
  viz._chartScene = def.emit({viz, shapeData} as any);
  viz._chartTransform = transformFn
    ? transformFn(viz)
    : marginOriginTransform(viz);
}
