/**
    `ChartDefinition` — charts as *values*, not classes.

    A chart in v4 is the def value `{name, fields?, ctx?, features, stages,
    layoutStage?, emit, chartTransform?, setup?, thresholdFunction?}`. Each
    chart's def lives next to its applyLayout + emit in `./<ChartName>/`;
    `makeChart(def, Base?)` produces the chart class from the def.
*/

import type {SceneNode} from "@d3plus/render";

import type {FeatureModule} from "./features.js";
import type {TransformStage, VizContext} from "./stages.js";
import type {VizInstance} from "./vizTypes.js";

interface ChartDefinitionBase {
  /** Stable name for tagging and class generation. */
  name: string;
  /** Chart-internal scratch seeded onto `viz.ctx.<key>` at construction. */
  ctx?: Record<string, unknown>;
  /**
      Scalar defaults seeded onto `viz._<key>` at construction. Defs that
      need instance slots keep them here; user-facing values otherwise go
      in `fields[].default` and chart-internal scratch in `ctx`.
  */
  defaults?: Record<string, unknown>;
  /** Fluent accessor declarations; `makeChart` installs each as `viz.<key>()`. */
  fields?: import("../fluent.js").ConfigField[];
  /** Chart-level features composed in; order is layout order. */
  features: FeatureModule[];
  /**
      Chart-specific layout stage run in `_draw` after the shared chart-shell
      prep (`vizPreDrawPure`). If absent, `makeChart` doesn't invoke
      `runChartDraw` — the chart relies on its parent's `_draw` only.
  */
  layoutStage?: TransformStage;
  /** Optional pure threshold algorithm (replaces `Viz._thresholdFunction`). */
  thresholdFunction?: (viz: VizInstance, data: unknown[]) => unknown[];
  /**
      Optional chart-specific `_chartTransform` builder. Receives the viz
      after the layout stage runs; returns the transform applied to the
      chart scene. Default: margin-origin translation.
  */
  chartTransform?: (viz: VizInstance) => import("@d3plus/render").Transform | undefined;
  /**
      Imperative per-instance setup hook — runs once after `applyDefinition`
      seeds the chart. Use for event handler overrides and shadowed methods
      that don't fit the declarative `fields`/`ctx` surface.
  */
  setup?: (viz: VizInstance) => void;
}

/** Data-driven chart: `emit(ctx)` produces the scene nodes. */
export interface DataDrivenChartDefinition extends ChartDefinitionBase {
  paintDriven?: false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (ctx: VizContext & {shapeData?: any[]}) => SceneNode[];
}

/**
    Paint-driven chart: `Plot._paint` populates `viz._chartScene`
    imperatively, and `emit` returns a snapshot of that array.
    `runChartDraw` refuses to drive paint-driven defs (see runChartDraw.ts).
*/
export interface PaintDrivenChartDefinition extends ChartDefinitionBase {
  paintDriven: true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (ctx: VizContext & {shapeData?: any[]}) => SceneNode[];
}

/** Discriminated union; use `isPaintDriven` to narrow. */
export type ChartDefinition =
  | DataDrivenChartDefinition
  | PaintDrivenChartDefinition;

/** Type guard for the paint-driven variant. */
export function isPaintDriven(
  def: ChartDefinition,
): def is PaintDrivenChartDefinition {
  return def.paintDriven === true;
}
