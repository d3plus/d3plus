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
import type {ChartDefinition} from "./ChartDefinition.js";
import {isPaintDriven} from "./ChartDefinition.js";
import type {TransformStage} from "./stages.js";
import type {VizInstance as Viz} from "./vizTypes.js";

export function runChartDraw(
  viz: Viz,
  def: ChartDefinition,
  stage: TransformStage,
  transformFn?: (viz: Viz) => Transform | undefined,
): void {
  // Invariant: this helper OWNS `_chartScene` for the current draw — it
  // overwrites with `def.emit(ctx)`. The Plot family takes a different
  // flow: `Plot._paint` populates `_chartScene` directly from `plotPaint`
  // (which builds the scene from its paint context), and paint-driven defs
  // carry no `emit`. Calling `runChartDraw` on a paint-driven chart would
  // clobber that scene. The ChartDefinition.paintDriven discriminant is the
  // structural signal — failing loud so future contributors who try to
  // "unify" Plot with runChartDraw can't silently clobber the chart scene.
  if (isPaintDriven(def)) {
    throw new Error(
      `runChartDraw cannot drive ${def.name} — it's a paint-driven chart ` +
      "(ChartDefinition.paintDriven=true). Paint-driven charts (BarChart, " +
      "AreaPlot, LinePlot, BumpChart, StackedArea, BoxWhisker, Plot) rely " +
      "on Plot._paint to populate _chartScene imperatively; their _draw " +
      "should NOT call runChartDraw.",
    );
  }
  // Reset _chartScene BEFORE the stage so its body has a known starting
  // point for any decoration nodes it pushes (axes, grids, spokes).
  viz._chartScene = [];
  const ctx = runStages({viz}, [stage]);
  if (!Array.isArray(viz._chartScene)) {
    // A stage reassigned `viz._chartScene` to a non-array (or replaced
    // it with undefined). Without this guard, the silent `[]` fallback
    // would discard the stage's intent — and the comment at the
    // concat below promises "decorations are preserved". Fail loud so
    // accidental reassignment surfaces instead of stealth-dropping
    // axis/grid nodes.
    throw new Error(
      `runChartDraw: stage for ${def.name} replaced viz._chartScene with ` +
      `a non-array value (got ${typeof viz._chartScene}). Stages should ` +
      "use `(v._chartScene ||= []).push(...)` rather than reassigning.",
    );
  }
  const stagePushed = viz._chartScene.slice();
  const emitted = def.emit(ctx);
  // Preserve decorations the stage pushed (Matrix/Priestley/Radar/
  // RadialMatrix push axis/grid groups via `(v._chartScene ||= []).push`)
  // by concatenating them with the emit output. Without this, the
  // overwrite at the line below would silently discard every
  // decoration — Matrix renders bare cells with no row/column axes.
  // Stage decorations come FIRST so emit shapes paint on top.
  viz._chartScene = [...stagePushed, ...emitted];
  viz._chartTransform = transformFn
    ? transformFn(viz)
    : marginOriginTransform(viz);
}
