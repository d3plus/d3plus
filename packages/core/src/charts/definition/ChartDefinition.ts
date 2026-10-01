/**
    `ChartDefinition` — charts as *values*, not classes.

    A chart in v4 is the def value `{name, fields?, ctx?, features, stages,
    layoutStage?, emit, chartTransform?, setup?, thresholdFunction?}`. Each
    chart's def lives next to its applyLayout + emit in `./<ChartName>/`;
    `makeChart(def, Base?)` produces the chart class from the def.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {FeatureModule} from "../features/features.js";
import type {InsetRegion} from "../features/insetState.js";
import type {TransformStage, VizContext} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";

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
  fields?: import("../../fluent.js").ConfigField[];
  /** Chart-level features composed in; order is layout order. */
  features: FeatureModule[];
  /**
      Chart-specific layout stage run in `_draw` after the shared chart-shell
      prep (`vizPreDrawPure`). If absent, `makeChart` doesn't invoke
      `runChartDraw` — the chart relies on its parent's `_draw` only.
  */
  layoutStage?: TransformStage;
  /**
      Optional size-legend scale, called before layout so the bottom-right
      corner panel can reserve room: the value → pixel-radius scale the chart
      will draw with, for a chart area of `available` px (the area before the
      legend's own reservation, so any area-dependent radius only shrinks
      from here). Return null when nothing is sized. The chart's layout
      stores the scale it actually drew with on `viz._sizeLegendFinal`, which
      is what the legend paints.
  */
  sizeLegendScale?: (
    viz: VizInstance,
    available: {width: number; height: number},
  ) => SizeLegendScale | null;
  /**
      Optional region for drawing chart chrome (the size legend, legend, or
      colorScale) inside the chart's negative space, called after layout:
      the area chrome may occupy plus the boxes of the chart's marks, in
      surface coordinates (see `sceneInsetRegion`). Return null when the
      chart has no room to offer.
  */
  insetRegion?: (viz: VizInstance) => InsetRegion | null;
  /** Optional pure threshold algorithm (replaces `Viz._thresholdFunction`). */
  thresholdFunction?: (viz: VizInstance, data: unknown[]) => unknown[];
  /**
      Optional chart-specific `_chartTransform` builder. Receives the viz
      after the layout stage runs; returns the transform applied to the
      chart scene. Default: margin-origin translation.
  */
  chartTransform?: (viz: VizInstance) => import("@d3plus/render").Transform | undefined;
  /**
      Optional fixed clip region for the chart-cells group (a window in absolute
      scene coordinates that the chart content is clipped to). Geomap uses this to
      contain projected geography within the map rectangle so it can't spill under
      the legend/timeline; the clip stays put while pan/zoom moves content beneath
      it. The chart-cells group is untransformed (`chartTransform` applies to a
      group inside it), so the clip is in surface coordinates. Zoomable charts
      without one are clipped to the chart area.
  */
  chartClip?: (viz: VizInstance) => import("@d3plus/render").ClipShape | undefined;
  /**
      Optional chart-specific "local body rect" — the box the drill-down morph
      transition (`enterFrom`/`exitTo`) measures its fractions against. Read
      directly off `def` by `runChartDraw` (same pattern as `chartClip`), after
      the layout stage runs. Default: the margin-adjusted chart area at local
      origin (0,0), i.e. `{x: 0, y: 0, ...chartBounds(viz)}` — correct for any
      chart whose emitted nodes sit inside the `chartTransform`-wrapped body
      group at that same local origin (Treemap; Pack overrides this, since its
      body is a diameter-sized square, not the full chart area).
  */
  chartBodyRect?: (viz: VizInstance) => {x: number; y: number; width: number; height: number};
  /**
      Imperative per-instance setup hook — runs once after `applyDefinition`
      seeds the chart. Use for event handler overrides and shadowed methods
      that don't fit the declarative `fields`/`ctx` surface.
  */
  setup?: (viz: VizInstance) => void;
}

/**
    A data-driven chart's emit: a pure function from a chart context (with
    optional laid-out `shapeData`) to the scene nodes for one frame.
*/
export type ChartEmit = (ctx: VizContext & {shapeData?: DataPoint[]}) => SceneNode[];

/** Data-driven chart: `emit(ctx)` produces the scene nodes. */
export interface DataDrivenChartDefinition extends ChartDefinitionBase {
  paintDriven?: false;
  emit: ChartEmit;
}

/**
    Paint-driven chart: `Plot._paint` populates `viz._chartScene` by calling
    `plotPaint`, which builds the scene from the paint context assembled in
    `drawPlot`. There is no `emit` step — `runChartDraw` refuses to drive
    paint-driven defs (see runChartDraw.ts), so the scene is produced entirely
    inside the Plot draw flow.
*/
export interface PaintDrivenChartDefinition extends ChartDefinitionBase {
  paintDriven: true;
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
