/**
    The `legendFeature` FeatureModule, extracted from `features.ts` and
    re-exported there. The `layout` body is split into `buildLegendData`
    (rollup + sort + legend-depth) and `renderLegendFeature` (positioning,
    render, margin claim) so each stays a readable unit.
*/
import {rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import {configPrep} from "../../utils/index.js";
import type {VizContext as ConfigPrepContext} from "../../utils/configPrep.js";

import type {FeatureLayout, FeatureModule, MarginClaim} from "./features.js";
import {cornerInsets, sanitizePosition, topLeftControlsInset, zoomControlsInset} from "./features.js";
import {bottomRightClearance} from "../drawSteps/bottomRightControlsMarkup.js";
import {zoomControlsBox} from "../drawSteps/zoomControlsMarkup.js";
import {getTopLeftContributions} from "../drawSteps/topLeftControls.js";
import {topLeftControlsBox} from "../drawSteps/topLeftControlsMarkup.js";
import {resolveSpec} from "../pipeline/resolveSpec.js";
import type {VizContext} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {insetFrame, insetOrient, isInsetPending} from "./insetState.js";
import type {InsetOrient} from "./insetState.js";

interface LegendData {
  legendData: DataPoint[];
  legendKey: (d: DataPoint, i: number) => string;
  getAttr: (d: DataPoint, i: number, attr: string) => string;
}

/**
    Rolls filtered legend data up by paint attributes, sorts it, and computes
    `viz._legendDepth` (the lowest groupBy level whose values are unique).
    Returns the `legendData` array plus the `fill`/`getAttr` accessors the
    render step reuses.
*/
export function buildLegendData(viz: VizInstance): LegendData {
  // Source: `_legendData` from the rollupAndFilter pipeline stage — same
  // arg drawLegend received via `drawLegend.bind(this)(this._legendData)`.
  const data: DataPoint[] = viz._legendData || [];
  const legendData: DataPoint[] = [];

  const getAttr = (d: DataPoint, i: number, attr: string): string => {
    const shape = viz.schema.shape(d, i);
    if (attr === "fill" && shape === "Line") attr = "stroke";
    const value =
      viz.schema.shapeConfig[shape] && viz.schema.shapeConfig[shape][attr]
        ? viz.schema.shapeConfig[shape][attr]
        : viz.schema.shapeConfig[attr];
    return typeof value === "function" ? value.bind(viz)(d, i) : value;
  };

  // Legend grouping key. Historically this was the resolved paint string
  // (fill+opacity+texture): distinct categories that the ordinal color scale
  // recycled onto the same hex collapsed into one scrambled entry (#788). Key
  // on the color *encoding* input instead — categories keep their own entry
  // even when two resolve to the same hex — while opacity/texture still split
  // entries that differ on those secondary encodings. Falls back to the
  // resolved fill when there's no color accessor to key on (e.g. `.color(false)`
  // with a custom `shapeConfig.fill`).
  const legendKey = (d: DataPoint, i: number): string => {
    const c =
      typeof viz.schema.color === "function" ? viz.schema.color(d, i) : undefined;
    const colorKey =
      c === undefined || c === null
        ? getAttr(d, i, "fill")
        : typeof c === "string"
          ? c
          : JSON.stringify(c);
    return [colorKey, getAttr(d, i, "opacity"), getAttr(d, i, "texture")].join(
      "_",
    );
  };

  const rollupData = viz.schema.colorScale
    ? data.filter(
        (d: DataPoint, i: number) => viz.schema.colorScale(d, i) === undefined,
      )
    : data;
  rollup(
    rollupData,
    (leaves: DataPoint[]) =>
      legendData.push(merge(leaves, viz.schema.aggs) as unknown as DataPoint),
    legendKey,
  );

  legendData.sort(viz.schema.legendSort);

  const labels = legendData.map((d: DataPoint, i: number) =>
    viz._ids(d, i).slice(0, viz._drawDepth + 1),
  );
  // viz._legendDepth: the legend's drill-down depth (lowest unique
  // groupBy level). Computed and written here BEFORE the
  // `viz._legendClass!.render()` call below, because that render
  // invokes `legendLabel.bind(viz)` (Viz.ts:217) which reads
  // `viz._legendDepth` live to format each legend entry. The write
  // is INTRA-FEATURE state — it's owned by legendFeature, consumed
  // by legendFeature's own component instance. `FeatureLayout.vizUpdate`
  // is the CROSS-feature publishing channel (for state OTHER features
  // need); intra-feature writes that the same feature reads in its own
  // body legitimately live on viz directly, which is what's happening
  // here. Downstream consumers (BarChart.ts:28, Viz.ts:210, legendLabel)
  // observe the value after layout completes — same as before.
  viz._legendDepth = 0;
  for (let x = 0; x <= viz._drawDepth; x++) {
    const values = labels.map((l: string[]) => l[x]);
    if (
      !values.some((v: string | string[]) => Array.isArray(v)) &&
      Array.from(new Set(values)).length === legendData.length
    ) {
      viz._legendDepth = x;
      break;
    }
  }

  return {legendData, legendKey, getAttr};
}

/**
    How far a legend must inset/drop to clear the zoom-controls panel
    (top-right) and/or the shared top-left controls panel (back/table-view/
    search). A top legend (centered) insets both sides via the shared
    `cornerInsets` helper (the same one `textBlockLayout` uses), staying
    centered on the chart; a right legend drops below the zoom panel, a left
    legend below the top-left panel. Against the bottom-right panel, a
    bottom legend pulls its right edge in (`insetRight`) and a side legend
    shortens to end above it (`shorten`). Extracted from `renderLegendFeature` to
    keep it under the per-function line budget.
*/
function legendCornerClearance(
  viz: VizInstance,
  position: string | false,
  layoutMargin: Required<MarginClaim>,
  padding: {top: number; right: number; bottom: number; left: number},
): {inset: number; drop: number; insetRight: number; shorten: number} {
  const inset =
    position === "top"
      ? cornerInsets(
          viz,
          layoutMargin.top,
          layoutMargin.left + padding.left,
          layoutMargin.right + padding.right,
        ).symmetric
      : 0;
  const dropRight =
    position === "right" && zoomControlsInset(viz, layoutMargin.top, layoutMargin.right)
      ? zoomControlsBox(viz as never)!.height - layoutMargin.top
      : 0;
  const dropLeft =
    position === "left" && topLeftControlsInset(viz, layoutMargin.top, layoutMargin.left)
      ? topLeftControlsBox(viz as never, getTopLeftContributions(viz as never))!.height - layoutMargin.top
      : 0;
  // The bottom-right corner panel (size legend): a bottom legend pulls its
  // right edge in beside it, a left/right legend stops short above it.
  const corner = bottomRightClearance(
    viz, position, layoutMargin.bottom + padding.bottom, layoutMargin.right + padding.right,
  );
  return {inset, drop: dropRight || dropLeft, insetRight: corner.inset, shorten: corner.drop};
}

/** Where and how the legend lays itself out for one render. */
interface LegendFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  align: string;
  direction: "row" | "column";
  verticalAlign: string;
  visible: boolean;
}

/**
    Configures and renders the chart's `_legendClass` Legend instance in
    compute mode (Legend contributes to the scene via its `toScene()`,
    collected on Viz.toScene) into `frame`.
*/
function paintLegend(viz: VizInstance, built: LegendData, frame: LegendFrame): void {
  const {legendData, legendKey, getAttr} = built;

  const hidden = (d: DataPoint, i: number): boolean => {
    let id = viz._id(d, i);
    if (Array.isArray(id)) id = id[0];
    return (
      viz._hidden.includes(id) ||
      (viz._solo.length > 0 && !viz._solo.includes(id))
    );
  };

  const transform = {transform: `translate(${frame.x}, ${frame.y})`};

  // The Legend instance renders into a `g.d3plus-viz-legend` group as a
  // child of the chart's svg. This group is created via the `elem` helper
  // so the Legend has a DOM `_select` (its `toScene()` walks from there).
  // Once Legend is fully compute-only the elem wrapper can go.
  const legendGroup = elem("g.d3plus-viz-legend", {
    condition: frame.visible && !viz.schema.legendConfig.select,
    enter: transform,
    parent: viz._select as unknown as D3Selection,
    duration: viz.schema.duration,
    update: transform,
  }).node();

  viz._legendClass!
    .renderMode("compute")
    .id(legendKey)
    .align(frame.align)
    .direction(frame.direction)
    .duration(viz.schema.duration)
    .data(frame.visible ? legendData : [])
    .height(frame.height)
    .locale(viz.schema.locale)
    .parent(viz)
    .select(legendGroup)
    .shape((d: DataPoint, i: number) => {
      const shape = viz.schema.shape(d, i);
      return shape === "Circle" || shape === "Line" ? shape : "Rect";
    })
    .verticalAlign(frame.verticalAlign)
    .width(frame.width)
    .shapeConfig(configPrep.bind(viz as unknown as ConfigPrepContext)(viz.schema.shapeConfig, "legend"))
    .shapeConfig({
      fill: (d: DataPoint, i: number) =>
        hidden(d, i) ? viz.schema.hiddenColor(d, i) : getAttr(d, i, "fill"),
      labelConfig: {
        fontOpacity: (d: DataPoint, i: number) =>
          hidden(d, i) ? viz.schema.hiddenOpacity(d, i) : 1,
      },
    })
    .config(viz.schema.legendConfig)
    .render();
}

/**
    Whether the legend shows at all: `position === false` forces it off so
    `.legendPosition(false)` is an actual hide signal (the legend's render
    runs against [] data, which exits any prior DOM and emits no scene).
*/
function legendVisible(viz: VizInstance, built: LegendData): boolean {
  const config = resolveSpec(viz);
  const position = sanitizePosition(viz.schema.legendPosition.bind(viz)(config));
  return position === false ? false : Boolean(viz.schema.legend.bind(viz)(config, built.legendData));
}

/**
    Lays the legend out to be drawn inside the chart (see
    `pipeline/insetPlacement.ts`): at the origin — Viz.toScene moves it into
    place — as a column or a row sized against the chart area `area`.
    Returns the legend's measured size, or null when it isn't showing or
    couldn't fit its labels.
*/
export function paintLegendInset(
  viz: VizInstance,
  orient: InsetOrient,
  area: {width: number; height: number},
  built: LegendData = buildLegendData(viz),
): {width: number; height: number} | null {
  const visible = legendVisible(viz, built) && !viz.schema.legendConfig.select;
  const frame = insetFrame(orient, area);
  paintLegend(viz, built, {
    x: 0,
    y: 0,
    ...frame,
    align: "left",
    direction: orient,
    verticalAlign: "top",
    visible,
  });
  if (!visible) return null;
  const legend = viz._legendClass!;
  const labelsFit = (legend._lineData || []).every((d: Record<string, unknown>) => (d.width as number) > 0);
  const {width, height} = legend.outerBounds();
  return labelsFit && width && height ? {width, height} : null;
}

/**
    Positions and renders the legend, then returns the margin claim derived
    from the previous render's outerBounds. Claims nothing while the legend
    is being laid out for the chart's interior.
*/
function renderLegendFeature(
  viz: VizInstance,
  built: LegendData,
  layoutMargin: Required<MarginClaim>,
): FeatureLayout {
  if (isInsetPending(viz, "legend")) {
    paintLegendInset(viz, insetOrient(viz, "legend"), {
      width: viz.schema.width - layoutMargin.left - layoutMargin.right,
      height: viz.schema.height - layoutMargin.top - layoutMargin.bottom,
    }, built);
    return {panel: null, margin: {}};
  }

  // The margin *claim* uses the previous render's outerBounds; on first
  // render it's zero and the Legend re-flows on the second render with the
  // real space.
  const legendBounds = viz._legendClass!.outerBounds();
  const config = resolveSpec(viz);
  const position = sanitizePosition(viz.schema.legendPosition.bind(viz)(config));
  const wide = ["top", "bottom"].includes(position as string);
  const padding = viz.schema.legendPadding(viz)
    ? viz._padding
    : {top: 0, right: 0, bottom: 0, left: 0};
  const {inset, drop, insetRight, shorten} = legendCornerClearance(viz, position, layoutMargin, padding);

  paintLegend(viz, built, {
    x: (wide ? layoutMargin.left + padding.left : layoutMargin.left) + inset,
    y: (wide ? layoutMargin.top : layoutMargin.top + padding.top) + drop,
    width:
      (wide
        ? viz.schema.width -
            (layoutMargin.left + layoutMargin.right + padding.left + padding.right)
        : viz.schema.width - (layoutMargin.left + layoutMargin.right)) - inset * 2 - insetRight,
    height:
      (wide
        ? viz.schema.height - (layoutMargin.bottom + layoutMargin.top)
        : viz.schema.height -
            (layoutMargin.bottom + layoutMargin.top + padding.bottom + padding.top)) - drop - shorten,
    align: wide ? "center" : (position as string),
    direction: wide ? "row" : "column",
    verticalAlign: !wide ? "middle" : (position as string),
    visible: legendVisible(viz, built),
  });

  // Margin claim from the *previous* render's outerBounds:
  // `outerBounds()` reads stored state, so on the first render the claim
  // is zero and Legend overlaps the chart for one frame; the next render
  // flows with full margin.
  const margin: MarginClaim = {};
  if (!viz.schema.legendConfig.select && legendBounds.height) {
    if (wide)
      (margin as Record<string, number>)[position as string] =
        legendBounds.height + viz._legendClass!.padding() * 2;
    else
      (margin as Record<string, number>)[position as string] =
        legendBounds.width + viz._legendClass!.padding() * 2;
  }
  return {panel: null, margin};
}

/**
    Converts `drawLegend.ts` to a FeatureModule.

    Layout responsibility: roll filtered data up by paint attributes, configure
    + render the chart's `_legendClass` Legend instance (compute mode — Legend
    contributes to the scene via its `toScene()` collected on Viz.toScene),
    and return the margin claim corresponding to its outerBounds + padding.
    No panel SceneNode is emitted — Legend is a component, not a panel; the
    scene composition for Legend happens via Viz.toScene's `components` array.
*/
export const legendFeature: FeatureModule = {
  name: "legend",
  configFields: ["legend", "legendConfig", "legendPadding", "legendPosition", "legendSort"],
  layout: ({viz, layoutMargin}: VizContext & {layoutMargin: Required<MarginClaim>}) => {
    const built = buildLegendData(viz);
    return renderLegendFeature(viz, built, layoutMargin);
  },
};
