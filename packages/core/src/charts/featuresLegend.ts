/**
    The `legendFeature` FeatureModule, extracted from `features.ts` and
    re-exported there. The `layout` body is split into `buildLegendData`
    (rollup + sort + legend-depth) and `renderLegendFeature` (positioning,
    render, margin claim) so each stays a readable unit.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {elem} from "@d3plus/dom";

import {configPrep} from "../utils/index.js";

import type {FeatureLayout, FeatureModule, MarginClaim} from "./features.js";
import {sanitizePosition} from "./features.js";
import {resolveSpec} from "./resolveSpec.js";
import type {VizContext} from "./stages.js";

const legendAttrs = ["fill", "opacity", "texture"];

interface LegendData {
  legendData: DataPoint[];
  fill: (d: DataPoint, i: number) => string;
  getAttr: (d: DataPoint, i: number, attr: string) => string;
}

/**
    Rolls filtered legend data up by paint attributes, sorts it, and computes
    `viz._legendDepth` (the lowest groupBy level whose values are unique).
    Returns the `legendData` array plus the `fill`/`getAttr` accessors the
    render step reuses.
*/
function buildLegendData(viz: any): LegendData {
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

  const fill = (d: DataPoint, i: number): string =>
    legendAttrs.map(a => getAttr(d, i, a)).join("_");

  const rollupData = viz.schema.colorScale
    ? data.filter(
        (d: DataPoint, i: number) => viz.schema.colorScale(d, i) === undefined,
      )
    : data;
  rollup(
    rollupData,
    (leaves: DataPoint[]) =>
      legendData.push(merge(leaves, viz.schema.aggs) as unknown as DataPoint),
    fill,
  );

  legendData.sort(viz.schema.legendSort);

  const labels = legendData.map((d: DataPoint, i: number) =>
    viz._ids(d, i).slice(0, viz._drawDepth + 1),
  );
  // viz._legendDepth: the legend's drill-down depth (lowest unique
  // groupBy level). Computed and written here BEFORE the
  // `viz._legendClass.render()` call below, because that render
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

  return {legendData, fill, getAttr};
}

/**
    Positions, configures, and renders the chart's `_legendClass` Legend
    instance (compute mode — Legend contributes to the scene via its
    `toScene()` collected on Viz.toScene), then returns the margin claim
    derived from the previous render's outerBounds.
*/
function renderLegendFeature(viz: any, built: LegendData): FeatureLayout {
  const {legendData, fill, getAttr} = built;

  const hidden = (d: DataPoint, i: number): boolean => {
    let id = viz._id(d, i);
    if (Array.isArray(id)) id = id[0];
    return (
      viz._hidden.includes(id) ||
      (viz._solo.length && !viz._solo.includes(id))
    );
  };

  // The margin *claim* uses the previous render's outerBounds; on first
  // render it's zero and the Legend re-flows on the second render with the
  // real space.
  const legendBounds = viz._legendClass.outerBounds();
  const config = resolveSpec(viz);
  const position = sanitizePosition(viz.schema.legendPosition.bind(viz)(config));
  const wide = ["top", "bottom"].includes(position as string);
  const padding = viz.schema.legendPadding()
    ? viz._padding
    : {top: 0, right: 0, bottom: 0, left: 0};
  const transform = {
    transform: `translate(${
      wide ? viz._margin.left + padding.left : viz._margin.left
    }, ${wide ? viz._margin.top : viz._margin.top + padding.top})`,
  };
  // `visible` gates the legend group's DOM presence + data binding.
  // `position === false` forces it off so `.legendPosition(false)` is
  // an actual hide signal: the legend's render runs against [] data,
  // which exits any prior DOM and emits no scene.
  const visible =
    position === false ? false : viz.schema.legend.bind(viz)(config, legendData);

  // The Legend instance renders into a `g.d3plus-viz-legend` group as a
  // child of the chart's svg. This group is created via the `elem` helper
  // so the Legend has a DOM `_select` (its `toScene()` walks from there).
  // Once Legend is fully compute-only the elem wrapper can go.
  const legendGroup = elem("g.d3plus-viz-legend", {
    condition: visible && !viz.schema.legendConfig.select,
    enter: transform,
    parent: viz._select,
    duration: viz.schema.duration,
    update: transform,
  }).node();

  viz._legendClass
    .renderMode("compute")
    .id(fill)
    .align(wide ? "center" : position)
    .direction(wide ? "row" : "column")
    .duration(viz.schema.duration)
    .data(visible ? legendData : [])
    .height(
      wide
        ? viz.schema.height - (viz._margin.bottom + viz._margin.top)
        : viz.schema.height -
            (viz._margin.bottom + viz._margin.top + padding.bottom + padding.top),
    )
    .locale(viz.schema.locale)
    .parent(viz)
    .select(legendGroup)
    .shape((d: DataPoint, i: number) =>
      viz.schema.shape(d, i) === "Circle" ? "Circle" : "Rect",
    )
    .verticalAlign(!wide ? "middle" : position)
    .width(
      wide
        ? viz.schema.width -
            (viz._margin.left + viz._margin.right + padding.left + padding.right)
        : viz.schema.width - (viz._margin.left + viz._margin.right),
    )
    .shapeConfig((configPrep as any).bind(viz)(viz.schema.shapeConfig, "legend"))
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

  // Margin claim from the *previous* render's outerBounds:
  // `outerBounds()` reads stored state, so on the first render the claim
  // is zero and Legend overlaps the chart for one frame; the next render
  // flows with full margin.
  const margin: MarginClaim = {};
  if (!viz.schema.legendConfig.select && legendBounds.height) {
    if (wide)
      (margin as Record<string, number>)[position as string] =
        legendBounds.height + viz._legendClass.padding() * 2;
    else
      (margin as Record<string, number>)[position as string] =
        legendBounds.width + viz._legendClass.padding() * 2;
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
    // The `layoutMargin` argument is the cumulative claim from earlier features;
    // the runLayout engine will accumulate this feature's claim into it. We
    // don't read it here directly — drawLegend used `viz._margin.left` etc.,
    // which the engine already wrote through.
    void layoutMargin;
    return renderLegendFeature(viz, built);
  },
};
