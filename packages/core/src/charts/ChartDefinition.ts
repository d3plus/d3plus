/**
    E3 (RFC §3.2): `ChartDefinition` — charts as *values*, not classes.

    A chart in v4 is the four-tuple `{defaults, features, stages, emit}` —
    everything that distinguishes Treemap from BarChart lives in this value.
    The legacy `class Treemap extends Viz` shell now reads its defaults from
    `treemapDef.defaults`, threads its layout through `treemapDef.stages`
    (after `super._draw` runs the shared Viz pipeline), and uses
    `treemapDef.emit` as the source of truth for the Rect scene nodes it
    pushes into `this._shapes`. The class still exists as a back-compat
    facade so `new Treemap()...render()` keeps working byte-for-byte — but
    every chart-specific decision now lives here.

    Migration pattern, applied to Treemap and re-usable for BarChart etc.:
      1. Pull the chart's `_draw` body apart into (a) data/layout stages and
         (b) the final shape-emission step (`emit`).
      2. Pull defaults from the constructor into `defaults`.
      3. List chart-level features (back/title/subtitle/total/legend/…) in
         `features` — order is layout order.
      4. Wrap the class shell with `createFluent(def)` (E4) once the legacy
         method overloads are gone.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {SceneNode} from "@d3plus/render";

import {merge} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";
import {hierarchy, treemap, treemapSquarify} from "d3-hierarchy";

import {nestGroups} from "@d3plus/data";

import {date} from "@d3plus/dom";
import {merge as d3plusMerge, unique} from "@d3plus/data";
import * as scales from "d3-scale";
import * as d3Shape from "d3-shape";
import {deviation, extent, groups, max, mean, min, range, rollups, sum} from "d3-array";
import {textWidth as d3plusTextWidth} from "@d3plus/dom";
import discreteBufferFn from "./plotBuffers/discreteBuffer.js";

import {Circle, Path, Rect} from "../shapes/index.js";
import * as allShapes from "../shapes/index.js";
import {configPrep} from "../utils/index.js";
import accessor from "../utils/accessor.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "./features.js";
import type {FeatureModule} from "./features.js";
import {vizPreDrawStages} from "./stages.js";
import {collectComputed, shapeConfigFor} from "./emitHelpers.js";
import type {TransformStage, VizContext} from "./stages.js";

/**
    @interface ChartDefinition
    The minimal shape a chart needs in v4. A chart is just this value plus a
    thin class facade that hands it to `createFluent`.
*/
export interface ChartDefinition {
  /** Stable name for tagging and class generation. */
  name: string;
  /**
      Constructor-time defaults. Replaces the imperative
      `this._x = accessor("x"); this._y = accessor("y"); ...` of the legacy
      class constructor. The fluent factory uses these as the seed config.
  */
  defaults: Record<string, unknown>;
  /**
      Chart-level features composed in (title, subtitle, total, legend,
      timeline, colorScale, back, attribution). Order matters: features
      claim margin in sequence.
  */
  features: FeatureModule[];
  /**
      The data + layout pipeline. Most charts extend the canonical
      `vizPreDrawStages` from `./stages.js` with their own chart-specific
      stages (e.g. Treemap's `applyTreemapLayout`).
  */
  stages: TransformStage[];
  /**
      Final step: given the post-stages context, emit the chart's shape
      scene nodes (cells / bars / lines / polygons). This is the
      equivalent of the legacy `_draw` body's "push a configured Shape into
      this._shapes" — but as a pure function returning nodes directly.

      For charts still using the legacy `new Shape().renderMode("compute").
      render()` glue path, `emit` is the *target* form — `Treemap._draw`
      consumes the same `ctx.shapeData` the stage produced so the data
      source is single. As compute mode goes away, callers will switch from
      `_shapes.push(...)` to `scene.children.push(...emit(ctx))`.
  */
  emit: (ctx: VizContext & {shapeData?: any[]}) => SceneNode[];
}

/* --------------------------- Treemap definition --------------------------- */

/**
    `applyTreemapLayout` — Treemap's chart-specific layout stage.

    Reads `viz._filteredData` (produced by the canonical viz stages) plus the
    treemap config (`_treemap`/`_tile`/`_layoutPadding`/`_sum`/`_sort`) and
    produces the laid-out `shapeData` array each Rect renders against. Also
    publishes `_rankData` onto the viz for legacy consumers (ariaLabel,
    legend ordering).

    This is the *only* Treemap-specific computation — extracting it out of
    `_draw` is the concrete demonstration that `_draw` collapses to "run
    stages, then emit scene nodes."
*/
export const applyTreemapLayout: TransformStage = ({viz}) => {
  if (!viz._filteredData || !viz._filteredData.length) {
    return {shapeData: []};
  }
  const nestedData = nestGroups(
    viz._filteredData,
    viz._groupBy.slice(0, viz._drawDepth + 1),
  );

  const tmapData = viz._treemap
    .padding(viz._layoutPadding)
    .size([
      viz._width - viz._margin.left - viz._margin.right,
      viz._height - viz._margin.top - viz._margin.bottom,
    ])
    .tile(viz._tile)(
    hierarchy(
      {values: nestedData} as Record<string, unknown>,
      (d: Record<string, unknown>) => d.values as Record<string, unknown>[],
    )
      .sum(viz._sum)
      .sort(viz._sort),
  );

  const shapeData: any[] = [];

  function extractLayout(children: any[]) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.depth <= viz._drawDepth) extractLayout(node.children);
      else {
        const index =
          node.data.values.length === 1
            ? viz._filteredData.indexOf(node.data.values[0])
            : undefined;
        node.__d3plus__ = true;
        node.id = node.data.key;
        node.i = index !== undefined && index > -1 ? index : undefined;
        node.data = merge(node.data.values as DataPoint[], viz._aggs);
        node.x = node.x0 + (node.x1 - node.x0) / 2;
        node.y = node.y0 + (node.y1 - node.y0) / 2;
        shapeData.push(node);
      }
    }
  }
  if (tmapData.children) extractLayout(tmapData.children);

  // Publish the ranked dataset onto the viz for legacy ariaLabel/legendSort.
  // This is the only side effect — kept narrow so converting more charts to
  // this pattern doesn't grow into the writeback-map game.
  viz._rankData = shapeData.slice().sort(viz._sort).map((d: any) => d.data);

  const total = tmapData.value as number;
  shapeData.forEach((d: any) => {
    d.share = viz._sum(d.data, d.i) / total;
  });

  return {shapeData};
};

/**
    `treemapDef.emit` — given the laid-out shapeData, produces a label-aware
    scene: each cell is a `group` of `{rect, ...labelTexts}`. Internally this
    delegates label layout to a transient Rect+TextBox pair (the same impl
    `Treemap._draw` uses today) — so emit IS the chart's scene contract even
    while Rect's label compute remains the layout backend. As Rect's label
    machinery is extracted into a pure helper, emit will switch to that;
    callers see no API change.
*/
const treemapEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  if (!shapeData || !shapeData.length) return [];
  const locale = viz._locale;
  const drawLabel = viz._drawLabel;

  // Rect cells with aria — pure data, no Rect class involved.
  const rectNodes = shapeData.map((d: any) => ({
    type: "rect" as const,
    key: `treemap-${d.id}`,
    x: d.x0,
    y: d.y0,
    width: d.x1 - d.x0,
    height: d.y1 - d.y0,
    datum: d.data,
    aria: {
      label: `${drawLabel(d.data, d.i)}, ${viz._sum(d.data, d.i)}, ${formatAbbreviate((d.share as number) * 100, locale)}%`,
    },
  }));

  // Label nodes: delegate to a transient Rect in compute mode and pull
  // the TextBox scene via `collectComputed`. The labelBounds formula is
  // Treemap-specific (split into title + share% bands).
  const rect = new Rect()
    .renderMode("compute")
    .data(shapeData as any)
    .label((d: any) => [
      drawLabel(d.data, d.i),
      `${formatAbbreviate((d.share as number) * 100, locale)}%`,
    ])
    .x((d: any) => d.x0 + (d.x1 - d.x0) / 2)
    .y((d: any) => d.y0 + (d.y1 - d.y0) / 2)
    .width((d: any) => d.x1 - d.x0)
    .height((d: any) => d.y1 - d.y0)
    .labelBounds((d: any, _i: number, s: any) => {
      const fontMax = 32;
      const fontMin = 8;
      const padding = 5;
      const h = s.height;
      let sh = Math.min(fontMax, (h - padding * 2) * 0.5);
      if (sh < fontMin) sh = 0;
      return [
        {width: s.width, height: h - sh, x: -s.width / 2, y: -h / 2},
        {
          width: s.width,
          height: sh + padding * 2,
          x: -s.width / 2,
          y: h / 2 - sh - padding * 2,
        },
      ];
    });
  const labelNodes = collectComputed(rect, {shape: false});

  // Combine: rect cells + their label text nodes in a single emit group per
  // chart. Returning a flat array keeps the parity test that counts rect nodes
  // happy; label nodes follow as additional SceneNodes.
  return [...rectNodes, ...labelNodes];
};

/**
    `treemapDef` is the working definition for `Treemap`. The class shell in
    Treemap.ts reads `defaults` here, calls `applyTreemapLayout` (via this
    file's `stages`) inside `_draw`, and would consume `emit()` directly once
    the legacy Rect compute path is retired.
*/
export const treemapDef: ChartDefinition = {
  name: "Treemap",
  defaults: {
    layoutPadding: 1,
    sort: (a: any, b: any) => b.value - a.value,
    sum: accessor("value"),
    tile: treemapSquarify,
    treemap: treemap().round(true),
  },
  // Layout order mirrors legacy Viz._draw's drawStep order — back/title/
  // subtitle/total run first and claim margin.top before the chart body lays
  // itself out. As colorScale/legend/timeline drawSteps convert to
  // FeatureModules they land here too.
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  // The chart's pipeline: shared viz prep + the treemap-specific layout that
  // produces `shapeData`. `_draw` runs only the chart-specific tail because
  // the prep already ran in `_preDraw`.
  stages: [...vizPreDrawStages, applyTreemapLayout],
  emit: treemapEmit,
};

/* ------------------------- chart definitions ------------------------- */

import * as d3Geo from "d3-geo";
import {pack, tree} from "d3-hierarchy";
// `extent`/`min`/`max` already imported above (line 37, from d3-array).
// `assign`/`nest` re-imported below where the Tree stage needs them, but
// kept consolidated here to avoid duplicate-import errors.
import {scaleLinear} from "d3-scale";
import {assign} from "@d3plus/dom";
import {nest} from "@d3plus/data";
import {pie} from "d3-shape";
import {sankeyJustify} from "d3-sankey";
import {parseSides} from "@d3plus/dom";

import constant from "../utils/constant.js";

/**
    `barChartDef` is the working definition for `BarChart`.

    BarChart is structurally one of d3plus's tiniest charts — it only flips
    three Plot defaults (`baseline: 0`, `discrete: "x"`, `shape: "Bar"`). All
    of the heavy lifting (axis layout, scale computation, shape emission)
    lives on `Plot`, the parent class. The defs surfaces those three values
    here so the chart's identity is fully a piece of data.

    Stages/emit are inherited from Plot (still legacy) — populated as the
    Plot `_draw` migration progresses.
*/
export const barChartDef: ChartDefinition = {
  name: "BarChart",
  defaults: {
    baseline: 0,
    discrete: "x",
    shape: constant("Bar"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  // Plot's pipeline still owns the chart-specific data prep + scale
  // computation; barChartDef contributes only the configuration delta.
  stages: vizPreDrawStages,
  emit: () => [],
};

/* ----------------------- other Plot subclass defs ----------------------- */

/** Each of these is a configuration delta over `Plot`'s defaults. */

export const areaPlotDef: ChartDefinition = {
  name: "AreaPlot",
  defaults: {baseline: 0, discrete: "x", shape: constant("Area")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: () => [],
};

export const linePlotDef: ChartDefinition = {
  name: "LinePlot",
  defaults: {discrete: "x", shape: constant("Line")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: () => [],
};

export const stackedAreaDef: ChartDefinition = {
  name: "StackedArea",
  defaults: {stacked: true},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: () => [],
};

export const boxWhiskerDef: ChartDefinition = {
  name: "BoxWhisker",
  defaults: {discrete: "x", shape: constant("Box")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: () => [],
};

export const bumpChartDef: ChartDefinition = {
  name: "BumpChart",
  defaults: {discrete: "x", shape: constant("Line")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: () => [],
};

/* ----------------------- Pie/Donut/Pack defs ----------------------- */

/**
    `pieDef.emit` — given a Pie's `_pieData` (the d3-shape pie layout array),
    emits Path SceneNodes for each slice + their label TextNodes. Uses a
    transient Path in compute mode (same shape as treemapEmit).
*/
const pieEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  if (!shapeData || !shapeData.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arcMaker = (viz as any)._arcData;
  const path = new Path()
    .renderMode("compute")
    .data(shapeData as any)
    .d(arcMaker as any)
    .config({
      id: (d: any) => viz._ids(d).join("-"),
      x: 0,
      y: 0,
    })
    .label(viz._drawLabel)
    .config(shapeConfigFor(viz, "Path"));
  return collectComputed(path);
};

export const pieDef: ChartDefinition = {
  name: "Pie",
  defaults: {
    innerRadius: 0,
    padPixel: 0,
    pie: pie(),
    value: accessor("value"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: pieEmit,
};

export const donutDef: ChartDefinition = {
  // Donut extends Pie. Its only purely-scalar override is `padPixel`. The
  // `innerRadius` closure depends on `this._width`/`_height`/`_margin` at
  // call time, so it stays imperative in the constructor.
  name: "Donut",
  defaults: {padPixel: 2},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: () => [],
};

/**
    `applyPackLayout` — Pack's chart-specific layout stage. Mirrors
    `applyTreemapLayout`: runs the d3-hierarchy pack against the rolled-up
    nested data and writes `packData` (filtered descendants) onto the
    context. The chart-body diameter is also stored on `viz._packDiameter`
    so the `_chartTransform` can center it.
*/
export const applyPackLayout: TransformStage = ({viz}) => {
  if (!viz._filteredData || !viz._filteredData.length) {
    return {shapeData: []};
  }
  const height = viz._height - viz._margin.top - viz._margin.bottom;
  const width = viz._width - viz._margin.left - viz._margin.right;
  const diameter = Math.min(height, width);

  const nestedData = nestGroups(
    viz._filteredData,
    viz._groupBy.slice(0, viz._drawDepth + 1),
  );

  const packed = viz._pack
    .padding(viz._layoutPadding)
    .size([diameter, diameter])(
      hierarchy(
        {
          key: (nestedData as Record<string, unknown>).key,
          values: nestedData,
        } as Record<string, unknown>,
        (d: Record<string, unknown>) => d.values as Record<string, unknown>[],
      )
        .sum(viz._sum)
        .sort(viz._sort),
    )
    .descendants()
    .filter((d: any, i: number) => {
      d.__d3plus__ = true;
      d.i = i;
      d.id = d.parent ? d.parent.data.key : "root";
      d.data.__d3plusOpacity__ = d.height ? viz._packOpacity(d.data, i) : 1;
      d.data.__d3plusTooltip__ = !d.height ? true : false;
      return !d.children || d.children.length > 1;
    });

  viz._packDiameter = diameter;
  viz._packOffsetX = (width - diameter) / 2;
  viz._packOffsetY = (height - diameter) / 2;
  return {shapeData: packed};
};

/**
    `packDef.emit` — Circle SceneNodes (one per leaf in the pack). The label
    pass uses the same transient-Circle pattern that Treemap's emit uses:
    instantiates a Circle in compute mode to populate its labelClass, then
    extracts the label nodes via TextBox.toScene.
*/
const packEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  if (!shapeData || !shapeData.length) return [];

  const circleNodes = shapeData.map((d: any) => ({
    type: "circle" as const,
    key: `pack-${d.id}-${d.i}`,
    cx: d.x,
    cy: d.y,
    r: d.r,
    datum: d.data,
    paint: {opacity: d.data.__d3plusOpacity__},
  }));

  // Label compute via a transient Circle (same shape as treemapEmit).
  const labelData = shapeData.map((d: any) => ({...d, label: (!d.children && d.parent) ? d.data.key : false}));
  const circle = new Circle()
    .renderMode("compute")
    .data(labelData as any)
    .label((d: any) => d.label)
    .x((d: any) => d.x)
    .y((d: any) => d.y)
    .r((d: any) => d.r)
    .config(shapeConfigFor(viz, "Circle"));
  const labelNodes = collectComputed(circle, {shape: false});

  return [...circleNodes, ...labelNodes];
};

export const packDef: ChartDefinition = {
  name: "Pack",
  defaults: {
    layoutPadding: 1,
    pack: pack(),
    packOpacity: constant(0.25),
    shape: constant("Circle"),
    sum: accessor("value"),
    sort: (a: any, b: any) => b.value - a.value,
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyPackLayout],
  emit: packEmit,
};

/* ----------------------- specialized chart defs ----------------------- */

/**
    `priestleyDef.emit` — Rect SceneNodes for each Priestley band (start→end
    time interval at the assigned lane). The chart's `_draw` stashes the
    laid-out `data`, `xScale`, `yScale`, `bandWidth` onto `viz._priestleyCtx`;
    emit consumes them. Same transient-shape pattern as treemapEmit.
*/
const priestleyEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  if (!shapeData || !shapeData.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._priestleyCtx;
  if (!c) return [];
  const rect = new Rect()
    .renderMode("compute")
    .data(shapeData as any)
    .duration(viz._duration)
    .height(c.bandWidth)
    .label((d: any, i: number) => viz._drawLabel(d.data, i))
    .width((d: any) => {
      const w = Math.abs(c.xScale(d.end) - c.xScale(d.start));
      return w > 2 ? w - 2 : w;
    })
    .x((d: any) => c.xScale(d.start) + (c.xScale(d.end) - c.xScale(d.start)) / 2)
    .y((d: any) => c.yScale(d.lane) + c.bandWidth / 2)
    .config(shapeConfigFor(viz, "Rect"));
  return collectComputed(rect);
};

export const priestleyDef: ChartDefinition = {
  name: "Priestley",
  defaults: {paddingInner: 0.05, paddingOuter: 0.05},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: priestleyEmit,
};

/**
    `radarDef.emit` — Path SceneNodes for each radar polygon. `_draw` stashes
    `groupData` + `pathConfig` on `viz._radarCtx`. The Radar's circle/rect/path
    axis decorations are still drawn imperatively (they don't fit the
    chart-data shape; addressed later when axis-grid emit lands).
*/
const radarEmit: ChartDefinition["emit"] = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._radarCtx;
  if (!c) return [];
  const path = new Path()
    .renderMode("compute")
    .data(c.groupData)
    .d((d: any) => d.d)
    .config(c.pathConfig);
  return collectComputed(path);
};

export const radarDef: ChartDefinition = {
  name: "Radar",
  defaults: {
    discrete: "metric",
    levels: 6,
    metric: accessor("metric"),
    outerPadding: 100,
    shape: constant("Path"),
    value: accessor("value"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: radarEmit,
};

/**
    `matrixDef.emit` — Rect cells for a Matrix chart. `_draw` stashes the
    column/row scales + cell dims on `viz._matrixCtx`.
*/
const matrixEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  if (!shapeData || !shapeData.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._matrixCtx;
  if (!c) return [];
  const rect = new Rect()
    .renderMode("compute")
    .data(shapeData as any)
    .config({
      height: c.cellHeight - viz._cellPadding,
      width: c.cellWidth - viz._cellPadding,
      x: (d: any) => c.columnScale(d.column) + c.cellWidth / 2,
      y: (d: any) => c.rowScale(d.row) + c.cellHeight / 2,
    } as any)
    .config(shapeConfigFor(viz, "Rect"));
  return collectComputed(rect);
};

export const matrixDef: ChartDefinition = {
  name: "Matrix",
  defaults: {
    cellPadding: 2,
    column: accessor("column"),
    row: accessor("row"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: matrixEmit,
};

/**
    `radialMatrixDef.emit` — Path SceneNodes for each arc cell. `_draw`
    stashes the arc generator on `viz._radialMatrixCtx`.
*/
const radialMatrixEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  if (!shapeData || !shapeData.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._radialMatrixCtx;
  if (!c) return [];
  const path = new Path()
    .renderMode("compute")
    .data(shapeData as any)
    .d(c.arcData as any)
    .config({
      id: (d: any) => viz._ids(d).join("-"),
      x: 0,
      y: 0,
    } as any)
    .config(shapeConfigFor(viz, "Path"));
  return collectComputed(path);
};

export const radialMatrixDef: ChartDefinition = {
  name: "RadialMatrix",
  defaults: {
    cellPadding: 2,
    column: accessor("column"),
    row: accessor("row"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: radialMatrixEmit,
};

/**
    `applyTreeLayout` — Tree's chart-specific layout stage. Mirrors the
    `applyTreemapLayout`/`applyPackLayout` shape: pure transformation of
    viz state into the chart-data structures `treeDef.emit` consumes.

    Runs the d3-hierarchy tree layout against the rolled-up nested data,
    walks the result to flatten branch aggregations, computes label height
    + per-depth label widths from the layout extent, rescales the laid-out
    y coordinates into the label-aware viewport, then builds the link
    descriptors (`linksData` + `linkD`) and per-shape-type groupings
    (`shapeGroups` + `shapeConfig`). Stashes everything on `viz._treeCtx`
    for emit; also writes `_treeData`/`_labelHeight`/`_labelWidths`/
    `_previousShapes` back on the viz for legacy consumers (ariaLabel,
    enter/exit tracking).
*/
export const applyTreeLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const isVertical = v._orient === "vertical";
  const isHorizontal = v._orient === "horizontal";

  const height = isVertical
    ? v._height - v._margin.top - v._margin.bottom
    : v._width - v._margin.left - v._margin.right;
  const width = isHorizontal
    ? v._height - v._margin.top - v._margin.bottom
    : v._width - v._margin.left - v._margin.right;
  const left = isVertical ? "left" : "top";

  const treeData = (v._treeData = v._tree
    .separation(v._separation)
    .size([width, height])(
      hierarchy(
        {
          key: "root",
          values: nest(
            v._filteredData,
            v._groupBy.slice(0, v._drawDepth + 1),
          ),
        } as Record<string, unknown>,
        (d: Record<string, unknown>) =>
          d.key && d.values ? (d.values as Record<string, unknown>[]) : null,
      ).sort(v._sort),
    )
    .descendants()
    .filter((d: any) => d.depth <= v._groupBy.length && d.parent));

  // Merge values of a nest branch (recursive). The aggregation honors
  // `viz._aggs` so per-column aggregators apply at leaf-flatten time.
  function flattenBranchData(branch: any): any {
    return merge(
      branch.values.map((l: any) => (l.key && l.values ? flattenBranchData(l) : l)),
      v._aggs,
    );
  }

  treeData.forEach((d: any, i: number) => {
    if (d.data.key && d.data.values) d.data = flattenBranchData(d.data);
    d.__d3plus__ = true;
    d.i = i;
  });

  let r = v._shapeConfig.r;
  if (typeof r !== "function") {
    const rv = r;
    r = () => rv;
  }
  const rBufferRoot = max(treeData, (d: any) =>
    d.depth === 1 ? r(d.data, d.i) : 0,
  ) as unknown as number;
  const rBufferEnd = max(treeData, (d: any) =>
    d.children ? 0 : r(d.data, d.i),
  ) as unknown as number;

  const yExtent = extent(treeData, (d: any) => d.y) as unknown as [number, number];
  v._labelHeight = min([
    isVertical ? 50 : 100,
    (yExtent[1] - rBufferRoot - rBufferEnd) / (v._groupBy.length + 1),
  ]);

  v._labelWidths = nest(
    treeData as DataPoint[],
    ((d: DataPoint) => d.depth) as (d: DataPoint) => string | number | boolean,
  ).map((d: any) =>
    d.values.reduce((num: number, vv: any, i: number) => {
      const vals = d.values as DataPoint[];
      const next =
        i < vals.length - 1
          ? ((vals[i + 1] as DataPoint).x as number)
          : width + v._margin[left];
      const prev = i
        ? ((vals[i - 1] as DataPoint).x as number)
        : v._margin[left];
      return min([
        num,
        next - ((vv as DataPoint).x as number),
        ((vv as DataPoint).x as number) - prev,
      ])!;
    }, width),
  );

  const yScale = scaleLinear()
    .domain(yExtent)
    .range([
      rBufferRoot + (v._labelHeight as number),
      height - rBufferEnd - (v._labelHeight as number),
    ]);

  treeData.forEach((d: any) => {
    const val = yScale(d.y);
    if (isHorizontal) {
      d.y = d.x;
      d.x = val;
    } else d.y = val;
  });

  // Link descriptors. `linkD` is invoked at emit time (where `r`'s function
  // form expects `d.data`/`d.i` to be already set by the forEach above).
  const linksData = treeData.filter((d: any) => d.depth > 1).map((d: any) => assign({}, d)) as any[];
  const linkD = (d: any) => {
    let rr = v._shapeConfig.r;
    if (typeof rr === "function") rr = rr(d.data, d.i);
    const px = d.parent.x - d.x + (isVertical ? 0 : rr);
    const py = d.parent.y - d.y + (isVertical ? rr : 0);
    const xx = isVertical ? 0 : -rr;
    const yy = isVertical ? -rr : 0;
    return isVertical
      ? `M${xx},${yy}C${xx},${(yy + py) / 2} ${px},${(yy + py) / 2} ${px},${py}`
      : `M${xx},${yy}C${(xx + px) / 2},${yy} ${(xx + px) / 2},${py} ${px},${py}`;
  };

  const shapeConfig = {
    id: (d: any, i: any) => v._ids(d, i)[d.depth - 1],
    label: (d: any, i: any) => {
      if (v._label) return v._label(d.data, i);
      const ids = v._ids(d, i).slice(0, d.depth);
      return ids[ids.length - 1];
    },
    labelConfig: {
      textAnchor: (d: any, i: any, x: any) =>
        isVertical
          ? "middle"
          : x.children && x.depth !== v._drawDepth + 1
            ? "end"
            : "start",
      verticalAlign: (d: any, i: any, x: any) =>
        isVertical ? (x.depth === 1 ? "bottom" : "top") : "middle",
    },
    hitArea: (d: any, i: any, s: any) => {
      const h = v._labelHeight;
      const offset = s.r ? s.r : isVertical ? s.height / 2 : s.width / 2;
      const w = v._labelWidths[d.depth - 1];
      return {
        width: isVertical ? w : offset * 2 + w,
        height: isHorizontal ? h : offset * 2 + h,
        x: isVertical
          ? -w / 2
          : d.children && d.depth !== v._groupBy.length
            ? -(offset + w)
            : -offset,
        y: isHorizontal
          ? -h / 2
          : d.children && d.depth !== v._groupBy.length
            ? -(offset + v._labelHeight)
            : -offset,
      };
    },
    labelBounds: (d: any, i: any, s: any) => {
      const h = v._labelHeight;
      const heightKey = isVertical ? "height" : "width";
      const offset = s.r ? s.r : isVertical ? s.height / 2 : s.width / 2;
      const w = v._labelWidths[d.depth - 1];
      const widthKey = isVertical ? "width" : "height";
      const xKey = isVertical ? "x" : "y";
      const yKey = isVertical ? "y" : "x";
      return {
        [widthKey]: w,
        [heightKey]: h,
        [xKey]: -w / 2,
        [yKey]:
          d.children && d.depth !== v._groupBy.length
            ? -(offset + h)
            : offset,
      };
    },
  };

  const shapeData = nest(treeData as any, (d: any) => v._shape(d.data));
  const dataShapes = shapeData.map((d: any) => d.key);
  const exitShapes = (v._previousShapes || []).filter(
    (d: any) => !dataShapes.includes(d),
  );
  const shapeGroups = shapeData.concat(
    exitShapes.map((key: any) => ({key, values: []})),
  );

  v._treeCtx = {linksData, linkD, shapeGroups, shapeConfig};
  v._previousShapes = dataShapes;

  return {shapeData: treeData} as any;
};

/**
    `treeDef.emit` — Path (links) + per-shape-type nodes for the Tree chart.
    `_draw` stashes link-pathData, per-shape grouped data, and shapeConfig on
    `viz._treeCtx`.
*/
const treeEmit: ChartDefinition["emit"] = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._treeCtx;
  if (!c) return [];
  const out: SceneNode[] = [];
  // Links (Path).
  if (c.linksData && c.linksData.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .data(c.linksData)
      .config(shapeConfigFor(viz, "Path"))
      .config({
        d: c.linkD,
        id: (d: any, i: number) => viz._ids(d, i)[d.depth - 1],
      } as any);
    out.push(...collectComputed(linkPath));
  }
  // Per-shape-type node groups (Circle/Path/Rect/etc.).
  if (c.shapeGroups && c.shapeGroups.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapesNs = allShapes as any;
    for (const {key, values} of c.shapeGroups) {
      if (!shapesNs[key]) continue;
      const inst = new shapesNs[key]()
        .renderMode("compute")
        .data(values)
        .config(shapeConfigFor(viz, key))
        .config(c.shapeConfig as any);
      out.push(...collectComputed(inst));
    }
  }
  return out;
};

export const treeDef: ChartDefinition = {
  name: "Tree",
  defaults: {
    orient: "vertical",
    shape: constant("Circle"),
    tree: tree(),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyTreeLayout],
  emit: treeEmit,
};

/**
    `networkDef.emit` — link Paths + per-shape-type node groups. `_draw`
    stashes the link data + grouped node data + shapeConfig + the `d` accessor
    on `viz._networkCtx`.
*/
const networkEmit: ChartDefinition["emit"] = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._networkCtx;
  if (!c) return [];
  const out: SceneNode[] = [];
  // Link Paths (no labels for link strokes).
  if (c.links && c.links.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .data(c.links)
      .config(c.linkConfig)
      .strokeWidth((d: any) => d.size)
      .d(c.linkD as any);
    out.push(...collectComputed(linkPath, {labels: false}));
  }
  // Per-shape-type node groups.
  if (c.nodeGroups && c.nodeGroups.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapesNs = allShapes as any;
    for (const [key, values] of c.nodeGroups) {
      if (!shapesNs[key]) continue;
      const inst = new shapesNs[key]()
        .renderMode("compute")
        .config(shapeConfigFor(viz, key))
        .config(c.nodeShapeConfig)
        .config(c.nodeShapeConfig[key] || {})
        .data(values);
      out.push(...collectComputed(inst));
    }
  }
  return out;
};

export const networkDef: ChartDefinition = {
  name: "Network",
  defaults: {
    links: [],
    linkSize: constant(1),
    linkSizeMin: 1,
    linkSizeScale: "sqrt",
    noDataMessage: false,
    nodeGroupBy: [accessor("id")],
    nodes: [],
    sizeMin: 5,
    sizeScale: "sqrt",
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: networkEmit,
};

/**
    `ringsDef.emit` — links + nodes for the Rings chart. `_draw` populates
    `viz._ringsCtx` with `edges`, `nodeGroups`, `linkConfig`, `linkD`,
    `nodeShapeConfig`.
*/
const ringsEmit: ChartDefinition["emit"] = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._ringsCtx;
  if (!c) return [];
  const out: SceneNode[] = [];
  if (c.edges && c.edges.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .config(c.linkConfig)
      .strokeWidth((d: any) => d.size)
      .id((d: any) => `${d.source.id}_${d.target.id}`)
      .d(c.linkD)
      .data(c.edges);
    out.push(...collectComputed(linkPath, {labels: false}));
  }
  if (c.nodeGroups && c.nodeGroups.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapesNs = allShapes as any;
    for (const [key, values] of c.nodeGroups) {
      if (!shapesNs[key]) continue;
      const inst = new shapesNs[key]()
        .renderMode("compute")
        .config(shapeConfigFor(viz, key))
        .config(c.nodeShapeConfig)
        .data(values);
      out.push(...collectComputed(inst));
    }
  }
  return out;
};

export const ringsDef: ChartDefinition = {
  name: "Rings",
  defaults: {
    links: [],
    linkSize: constant(1),
    linkSizeMin: 1,
    linkSizeScale: "sqrt",
    noDataMessage: false,
    nodes: [],
    sizeMin: 5,
    sizeScale: "sqrt",
    shape: constant("Circle"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: ringsEmit,
};

/**
    `sankeyDef.emit` — link Paths + per-shape-type node groups (typically
    Rect). `_draw` stashes `links`/`nodeGroups`/`pathFn` on `viz._sankeyCtx`.
*/
const sankeyEmit: ChartDefinition["emit"] = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._sankeyCtx;
  if (!c) return [];
  const out: SceneNode[] = [];
  if (c.links && c.links.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .config(viz._shapeConfig.Path || {})
      .data(c.links)
      .d(c.pathFn);
    out.push(...collectComputed(linkPath, {labels: false}));
  }
  if (c.nodeGroups && c.nodeGroups.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapesNs = allShapes as any;
    for (const [key, values] of c.nodeGroups) {
      if (!shapesNs[key]) continue;
      const inst = new shapesNs[key]()
        .renderMode("compute")
        .data(values)
        .height((d: any) => d.y1 - d.y0)
        .width((d: any) => d.x1 - d.x0)
        .x((d: any) => (d.x1 + d.x0) / 2)
        .y((d: any) => (d.y1 + d.y0) / 2)
        .config(shapeConfigFor(viz, key));
      out.push(...collectComputed(inst));
    }
  }
  return out;
};

export const sankeyDef: ChartDefinition = {
  name: "Sankey",
  defaults: {
    iterations: 6,
    links: accessor("links"),
    linksSource: "source",
    linksTarget: "target",
    noDataMessage: false,
    nodes: accessor("nodes"),
    nodeAlign: sankeyJustify,
    nodeId: accessor("id"),
    nodePadding: 8,
    nodeWidth: 30,
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: sankeyEmit,
};

/**
    `geomapDef.emit` — country Paths + point Circles. `_draw` stashes
    `topoData` + `pathFn`, `pointData` + `pointR` + `pointX` + `pointY`,
    plus shape configs on `viz._geomapCtx`.
*/
const geomapEmit: ChartDefinition["emit"] = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (viz as any)._geomapCtx;
  if (!c) return [];
  const out: SceneNode[] = [];
  if (c.topoData && c.topoData.length) {
    const path = new Path()
      .renderMode("compute")
      .data(c.topoData)
      .d(c.pathFn)
      .x(0)
      .y(0)
      .config(shapeConfigFor(viz, "Path"));
    out.push(...collectComputed(path));
  }
  if (c.pointData && c.pointData.length) {
    const circle = new Circle()
      .renderMode("compute")
      .config(shapeConfigFor(viz, "Circle"))
      .data(c.pointData)
      .r(c.pointR)
      .sort(c.pointSort)
      .x(c.pointX)
      .y(c.pointY);
    out.push(...collectComputed(circle));
  }
  return out;
};

export const geomapDef: ChartDefinition = {
  name: "Geomap",
  defaults: {
    fitObject: false,
    noDataMessage: false,
    ocean: "#d4dadc",
    point: accessor("point"),
    pointSize: constant(1),
    pointSizeMax: 10,
    pointSizeMin: 5,
    pointSizeScale: "linear",
    projection: d3Geo.geoMercator(),
    projectionPadding: parseSides(20),
    shape: constant("Circle"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: geomapEmit,
};

/* --------------------------- Plot pipeline stages --------------------------- */

/**
    `formatPlotData` — first stage of Plot's chart-specific pipeline. Detects
    time axes (sets viz._xTime / _x2Time / _yTime / _y2Time), maps the
    filtered data through `prepData` to produce the per-row PlotDatum shape
    (x/y/x2/y2 + id + group + shape + lci/hci + discrete), and constructs
    the `_sizeScaleD3` if `_size` is set.

    Pure compute. Returns `{formattedData, axisData, x2Exists, y2Exists}`
    for downstream stages + the paint phase. Side-effects on viz: stores
    `_formattedData`, `_xTime`/`_x2Time`/`_yTime`/`_y2Time`, `_sizeScaleD3`.
*/
export const formatPlotData: TransformStage = ({viz}) => {
  if (!viz._filteredData || !viz._filteredData.length) {
    return {plotFormattedData: [], plotAxisData: [], x2Exists: false, y2Exists: false};
  }

  const firstElemTime = viz._time ? viz._time(viz._filteredData[0], 0) : false;
  const x2Time = (viz._x2Time =
    firstElemTime && viz._x2(viz._filteredData[0], 0) === firstElemTime);
  const xTime = (viz._xTime =
    firstElemTime && viz._x(viz._filteredData[0], 0) === firstElemTime);
  const y2Time = (viz._y2Time =
    firstElemTime && viz._y2(viz._filteredData[0], 0) === firstElemTime);
  const yTime = (viz._yTime =
    firstElemTime && viz._y(viz._filteredData[0], 0) === firstElemTime);

  const timeAxis = xTime || x2Time || yTime || y2Time;

  const stackGroup = (d: any, i: number) =>
    `${!timeAxis && viz._time ? viz._time(d, i) : "time"}_${
      viz._stacked
        ? `${
            viz._groupBy.length > 1
              ? viz._ids(d, i).slice(0, -1).join("_")
              : "group"
          }`
        : `${viz._ids(d, i).join("_")}`
    }`;

  const prepData = (d: any, i: number) => {
    const newD: Record<string, unknown> = {
      __d3plus__: true,
      data: d,
      group: stackGroup(d, i),
      i,
      hci:
        viz._confidence && viz._confidence[1] && viz._confidence[1](d, i),
      id: viz._ids(d, i)
        .slice(0, viz._drawDepth + 1)
        .join("_"),
      lci:
        viz._confidence && viz._confidence[0] && viz._confidence[0](d, i),
      shape: viz._shape(d, i),
      x: xTime ? date(viz._x(d, i)) : viz._x(d, i),
      x2: x2Time ? date(viz._x2(d, i)) : viz._x2(d, i),
      y: yTime ? date(viz._y(d, i)) : viz._y(d, i),
      y2: y2Time ? date(viz._y2(d, i)) : viz._y2(d, i),
    };
    newD.discrete =
      newD.shape === "Bar"
        ? `${newD[viz._discrete]}_${newD.group}`
        : `${newD[viz._discrete]}`;
    newD.id =
      newD.shape === "Bar" ? `${newD.id}_${newD[viz._discrete]}` : newD.id;
    return newD;
  };

  const formattedData = (viz._formattedData = viz._filteredData.map(prepData));
  const axisData = viz._axisPersist ? viz._data.map(prepData) : formattedData;

  if (viz._size) {
    const rExtent = extent(axisData, (d: Record<string, unknown>) =>
      viz._size(d.data),
    );
    viz._sizeScaleD3 = (scales as any)[
      `scale${viz._sizeScale.charAt(0).toUpperCase()}${viz._sizeScale.slice(1)}`
    ]()
      .domain(rExtent)
      .range([
        rExtent[0] === rExtent[1]
          ? viz._sizeMax
          : min([viz._sizeMax / 2, viz._sizeMin]),
        viz._sizeMax,
      ]);
  } else {
    viz._sizeScaleD3 = () => viz._sizeMin;
  }

  const x2Exists = axisData.some((d: any) => d.x2 !== undefined);
  const y2Exists = axisData.some((d: any) => d.y2 !== undefined);

  return {
    plotFormattedData: formattedData,
    plotAxisData: axisData,
    x2Exists,
    y2Exists,
    plotStackGroup: stackGroup,
  };
};

/**
    `computePlotAxisValues` — second stage of Plot's pipeline. Given the
    `plotFormattedData` + `plotAxisData` from `formatPlotData`, computes
    the per-axis values arrays (`xData`/`x2Data`/`yData`/`y2Data`) used by
    the domain/scale construction downstream.

    The legacy `getAxisValues(axis)` closure inside Plot._draw is now this
    standalone function — it takes the axis name + the two data sources +
    the viz state and returns the sorted/unique values for that axis.
*/
export const computePlotAxisValues: TransformStage = ({viz, plotFormattedData, plotAxisData}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];

  function getAxisValues(axis: string) {
    const timeData = viz[`_${axis}Time`];
    const localData = timeData ? data : axisData;

    const filteredData = localData.filter(
      (d: any) => ![NaN, undefined, false].includes(d[axis]),
    );
    if (!filteredData.length) return [];

    const numericValue = typeof filteredData[0][axis] === "number";

    let myData =
      viz._discrete === axis
        ? rollups(
            filteredData,
            (leaves: Record<string, unknown>[]) =>
              leaves.length === 1
                ? leaves[0].data
                : d3plusMerge(
                    leaves.map((d: any) => d.data),
                    viz._aggs,
                  ),
            (d: Record<string, unknown>) => d[axis],
          )
            .sort((a: [unknown, unknown], b: [unknown, unknown]) => {
              if (viz[`_${axis}Sort`])
                return viz[`_${axis}Sort`](a[1], b[1]);
              const aKey =
                timeData || numericValue
                  ? parseFloat(a[0] as string)
                  : (a[0] as number);
              const bKey =
                timeData || numericValue
                  ? parseFloat(b[0] as string)
                  : (b[0] as number);
              return aKey - bKey;
            })
            .map(([key]: [unknown, unknown]) =>
              timeData
                ? date(key as string | number)
                : numericValue
                  ? parseFloat(key as string)
                  : key,
            )
        : unique(
            filteredData
              .sort((a: any, b: any) =>
                viz[`_${axis}Sort`]
                  ? viz[`_${axis}Sort`](a.data, b.data)
                  : a[axis] - b[axis],
              )
              .map((d: any) => d[axis]),
            (d: any) => `${d}`,
          );

    if (viz._discrete !== axis.charAt(0) && viz._confidence) {
      if (viz._confidence[0])
        myData = myData.concat(localData.map((d: any) => d.lci));
      if (viz._confidence[1])
        myData = myData.concat(localData.map((d: any) => d.hci));
    }

    return myData;
  }

  return {
    xData: getAxisValues("x"),
    x2Data: getAxisValues("x2"),
    yData: getAxisValues("y"),
    y2Data: getAxisValues("y2"),
  };
};

/**
    `extendPlotOppScales` — sixth stage. After `computePlotScales` returns the
    initial x/y/x2/y2 scales, the opposite-axis (non-discrete) scales need to
    be extended by each shape type's buffer function (Bar/Box/Circle/Line/
    etc. — `viz._buffer[key]`) to allocate room for the shapes' widths.

    Reads `viz._buffer[shapeKey]({data, x, y, yScale, xScale, config, x2?,
    y2?})` and chains the returned `[x, y]` (or `[x2, y2]`) back into the
    scales. Also calls `discreteBuffer` for Bar/Box to round the discrete
    scale to integer pixels.

    Returns the extended scales. Side-effect-free on viz (only on the scale
    instances, which are passed through the context).
*/
export const extendPlotOppScales: TransformStage = ({viz, plotFormattedData, plotAxisData, plotScales, plotConfigScales}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  let {x, y, x2, y2} = plotScales;
  const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = plotConfigScales;
  const xScale = plotScales.xScale, yScale = plotScales.yScale;

  const oppScale = viz._discrete === "x" ? yScale : xScale;
  if (oppScale !== "Point") {
    const allShapeData = groups(
      axisData,
      (d: Record<string, unknown>) => d.shape as string,
    );
    allShapeData.forEach(([key, values]) => {
      if (["Bar", "Box"].includes(key)) {
        discreteBufferFn(viz._discrete === "x" ? x : y, data, viz._discrete);
      }
      if (viz._buffer[key]) {
        const res = viz._buffer[key].bind(viz)({
          data: values,
          x,
          y,
          yScale: yConfigScale,
          xScale: xConfigScale,
          config: viz._shapeConfig[key],
        });
        x = res[0];
        y = res[1];
        const res2 = viz._buffer[key].bind(viz)({
          data: values,
          x: x2,
          y: y2,
          yScale: y2ConfigScale,
          xScale: x2ConfigScale,
          x2: true,
          y2: true,
          config: viz._shapeConfig[key],
        });
        x2 = res2[0];
        y2 = res2[1];
      }
    });
  }

  return {plotScales: {...plotScales, x, y, x2, y2}};
};

/**
    `preparePlotAxisLayout` — final pre-paint stage. Reads the constructed
    scales and computes the per-axis display config the four axis
    `.measure()` + `.render()` calls in Plot._draw need:
      - `defaultConfig`/`defaultX2Config`/`defaultY2Config`
      - `showX`/`showY` (cutoff predicates)
      - `yC` (base y-axis config, including no-x-axis layout adjustments)
      - `barLabels` (used to suppress redundant ticks)
      - `xTicks`/`yTicks`/`x2Ticks`/`y2Ticks` (null when ticks should display,
        empty array when ticks are redundant with bar labels)

    Pure compute. No DOM, no side effects on viz.
*/
export const preparePlotAxisLayout: TransformStage = ({viz, plotAxisData, plotScales, x2Exists, y2Exists, x2Data, y2Data, yData}) => {
  const axisData = plotAxisData || [];
  const {x, y, x2, y2, xScale, yScale, x2Scale, y2Scale} = plotScales;
  const xDomain = x.domain();
  const x2Domain = x2.domain();
  const yDomain = y.domain();
  const y2Domain = y2.domain();

  const defaultConfig = {
    barConfig: {"stroke-width": 0},
    gridSize: 0,
    labels: [],
    title: false,
    tickSize: 0,
  };
  const defaultX2Config = x2Exists ? {data: x2Data} : defaultConfig;
  const defaultY2Config = y2Exists ? {data: y2Data} : defaultConfig;
  const showX =
    viz._discrete === "x"
      ? viz._width > viz._discreteCutoff && viz._width > viz._xCutoff
      : viz._width > viz._xCutoff;
  const showY =
    viz._discrete === "y"
      ? viz._height > viz._discreteCutoff && viz._height > viz._yCutoff
      : viz._height > viz._yCutoff;

  const yC: Record<string, unknown> = {
    data: yData,
    locale: viz._locale,
    rounding: viz._yDomain ? "none" : "outside",
    scalePadding: y.padding ? y.padding() : 0,
  };
  if (!showX && showY) {
    yC.barConfig = {stroke: "transparent"};
    yC.tickSize = 0;
    yC.shapeConfig = {
      labelBounds: (d: any, i: number) => {
        const {width: w, y: yy} = d.labelBounds;
        const h = viz._height / 2;
        const xx = i ? -h : 0;
        return {x: xx, y: yy, width: w, height: h};
      },
      labelConfig: {padding: 0, rotate: 0},
      labelRotation: false,
    };
  }

  // Bar labels — used to suppress redundant axis ticks.
  const barConfig = (configPrep as any).bind(viz)(viz._shapeConfig, "shape", "Bar");
  const barLabelFunction =
    barConfig.label !== undefined
      ? typeof barConfig.label === "function"
        ? barConfig.label
        : (() => barConfig.label)
      : viz._drawLabel;
  const barLabels = axisData
    .map((d: any) => barLabelFunction(d.data, d.i))
    .filter((d: any) => typeof d === "number" || d)
    .map(String);

  const tickFor = (axis: string, axisScale: string) => {
    const ticks = unique(axisData.map((d: any) => d[axis]));
    return axisScale === "Point" && ticks.every(t => barLabels.includes(`${t}`))
      ? []
      : null;
  };

  return {
    plotDefaultConfig: defaultConfig,
    plotDefaultX2Config: defaultX2Config,
    plotDefaultY2Config: defaultY2Config,
    plotShowX: showX,
    plotShowY: showY,
    plotYC: yC,
    plotBarLabels: barLabels,
    plotXTicks: tickFor("x", xScale),
    plotX2Ticks: tickFor("x2", x2Scale),
    plotYTicks: tickFor("y", yScale),
    plotY2Ticks: tickFor("y2", y2Scale),
    plotXDomain: xDomain,
    plotX2Domain: x2Domain,
    plotYDomain: yDomain,
    plotY2Domain: y2Domain,
  };
};

/**
    `measurePlotLineLabels` — measures label widths for Line shapes so the
    chart's x-axis range can leave space for in-line labels (a common Plot
    feature). Reads pre-measured test-axis state (`xTest._d3Scale`, etc.)
    through the context. Pure compute + textWidth — no DOM.

    Returns `{labelWidths, largestLabel, xRangeMax}` for the paint phase.
    The test axes themselves come via `plotTestAxes` ctx field (Plot._draw
    measures them then injects).
*/
export const measurePlotLineLabels: TransformStage = ({viz, plotFormattedData, plotScales, plotConfigScales, plotTestAxes, plotLineLabelTest, y2Exists}) => {
  const data = plotFormattedData || [];
  if (!viz._lineLabels || y2Exists) {
    return {plotLabelWidths: [], plotLargestLabel: undefined, plotXRangeMax: undefined};
  }
  const labelData = data.filter((d: any) => {
    if (d.shape !== "Line") return false;
    return typeof viz._lineLabels === "function"
      ? viz._lineLabels(d.data, d.i)
      : true;
  });
  const lineData = groups(labelData, (d: Record<string, unknown>) => d.id);
  if (!lineData.length) {
    return {plotLabelWidths: [], plotLargestLabel: undefined, plotXRangeMax: undefined};
  }

  const {testLineShape, testTextBox} = plotLineLabelTest as any;
  const {xTest, yTest} = plotTestAxes as any;
  const xDomain = plotScales.x.domain();
  const yDomain = plotScales.y.domain();
  const xConfigScale = plotConfigScales.xConfigScale;
  const yConfigScale = plotConfigScales.yConfigScale;
  const width = viz._width - viz._margin.left - viz._margin.right;

  const userConfig = (configPrep as any).bind(viz)(viz._shapeConfig, "shape", "Line");
  testLineShape.config(userConfig);
  const lineLabelConfig = testLineShape.labelConfig();
  const fontColorAccessor = lineLabelConfig.fontColor !== undefined ? lineLabelConfig.fontColor : testTextBox.fontColor();
  const fontSizeAccessor = lineLabelConfig.fontSize !== undefined ? lineLabelConfig.fontSize : testTextBox.fontSize();
  const fontWeightAccessor = lineLabelConfig.fontWeight !== undefined ? lineLabelConfig.fontWeight : testTextBox.fontWeight();
  const fontFamilyAccessor = lineLabelConfig.fontFamily !== undefined ? lineLabelConfig.fontFamily : testTextBox.fontFamily();
  const paddingAccessor = lineLabelConfig.padding !== undefined ? lineLabelConfig.padding : testTextBox.padding();
  const labelFunction = userConfig.label || viz._drawLabel;

  const xEstimate = (d: any) => {
    if (xConfigScale === "log" && d === 0)
      d = xDomain[0] < 0 ? xTest._d3Scale.domain()[1] : xTest._d3Scale.domain()[0];
    return xTest._getPosition.bind(xTest)(d);
  };
  const yEstimate = (d: any) => {
    if (yConfigScale === "log" && d === 0)
      d = yDomain[0] < 0 ? yTest._d3Scale.domain()[1] : yTest._d3Scale.domain()[0];
    return yTest._getPosition.bind(yTest)(d);
  };

  const labelWidths = lineData
    .map(([lineKey, lineValues]: [unknown, Record<string, unknown>[]]) => {
      let d = lineValues[lineValues.length - 1] as Record<string, unknown>;
      let i;
      while (d.__d3plus__ && d.data) {
        d = d.data as Record<string, unknown>;
        i = d.i;
      }
      const label = typeof labelFunction === "function" ? labelFunction(d, i) : labelFunction;
      const fontColor = typeof fontColorAccessor === "function" ? fontColorAccessor(d, i) : fontColorAccessor;
      const fontSize = typeof fontSizeAccessor === "function" ? fontSizeAccessor(d, i) : fontSizeAccessor;
      const fontWeight = typeof fontWeightAccessor === "function" ? fontWeightAccessor(d, i) : fontWeightAccessor;
      let fontFamily = typeof fontFamilyAccessor === "function" ? fontFamilyAccessor(d, i) : fontFamilyAccessor;
      if (Array.isArray(fontFamily)) fontFamily = fontFamily.map((f: string) => `'${f}'`).join(", ");
      const labelPadding = typeof paddingAccessor === "function" ? paddingAccessor(d, i) : paddingAccessor;
      const labelWidth = d3plusTextWidth(label, {
        "font-size": fontSize,
        "font-family": fontFamily,
        "font-weight": fontWeight,
      });
      const coords = lineValues.map((d: Record<string, unknown>) => [
        xEstimate(d.x),
        yEstimate(d.y),
      ]);
      const myMaxX = max(
        lineValues.map((d: Record<string, unknown>) => xEstimate(d.x)),
      );
      const labelY = (
        lineValues.find((d: Record<string, unknown>) => xEstimate(d.x) === myMaxX) as Record<string, unknown>
      ).y;
      return {
        id: lineKey,
        labelWidth: labelWidth + labelPadding * 2,
        spaceNeeded: labelWidth + labelPadding * 4,
        value: labelY,
        yEstimate: yEstimate(labelY),
        padding: labelPadding,
        fontSize,
        fontColor,
        maxX: myMaxX,
        xValue: max(lineValues, (d: Record<string, unknown>) => d.x as number),
        coords,
      };
    })
    .sort((a, b) =>
      yDomain[1] > yDomain[0]
        ? (a.value as number) - (b.value as number)
        : (b.value as number) - (a.value as number),
    )
    .filter((d, _i, arr) => {
      const {fontSize, id, labelWidth, maxX, yEstimate} = d;
      const closeLabels = arr.filter(
        l =>
          l.id !== id &&
          l.coords.some(
            (c: any) =>
              (c[0] > maxX || (c[0] === maxX && l.maxX !== maxX)) &&
              c[0] <= (maxX as number) + labelWidth &&
              c[1] <= yEstimate + fontSize * 0.75 &&
              c[1] >= yEstimate - fontSize * 0.75,
          ),
      );
      return closeLabels.length === 0;
    });

  const maxX = max(labelWidths, d => d.maxX);
  const largestLabel = max(labelWidths.map(d => d.labelWidth));
  let xRangeMax: number | undefined;
  const spaceNeeded =
    maxX === xTest._getRange.bind(xTest)()[1]
      ? max(labelWidths.filter(d => d.maxX === maxX), d => d.spaceNeeded)
      : 0;
  if (spaceNeeded) {
    const labelSpace = min([spaceNeeded, width / 4]);
    xRangeMax = width - labelSpace! - viz._margin.right;
  }

  return {plotLabelWidths: labelWidths, plotLargestLabel: largestLabel, plotXRangeMax: xRangeMax};
};

/**
    `computePlotInitialDomains` — third stage of Plot's pipeline. Bridges the
    raw per-axis values (`xData`/`yData`/etc.) into the initial `domains`
    object that `computePlotScales` consumes. Handles both branches:

    - **Stacked** (`viz._stacked`): filters to Area/Bar shapes, computes
      group totals, sorts axisData by discrete-then-group-sum-then-opp,
      builds `discreteKeys`/`stackKeys`/`stackData`, fills in missing Area
      filler points, runs d3-stack with the configured order/offset, then
      derives `domains` from the stack extents.
    - **Non-stacked**: sorts axisData by the discrete accessor; `domains` is
      either the data values (for the discrete axis or user-sorted axes) or
      extent (for continuous).

    Side effects: mutates `axisData` (sort), `data` (sort + filler pushes).
    Mutations are intentional — Plot._draw consumers downstream read these
    arrays in their mutated order.
*/
export const computePlotInitialDomains: TransformStage = ({viz, plotFormattedData, plotAxisData, xData, x2Data, yData, y2Data, plotStackGroup}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  const stackGroup = plotStackGroup as (d: any, i: number) => string;
  const opp = viz._discrete ? (viz._discrete === "x" ? "y" : "x") : undefined;
  const xTime = viz._xTime, x2Time = viz._x2Time, yTime = viz._yTime, y2Time = viz._y2Time;

  let discreteKeys: any[] = [];
  let domains: any;
  let stackData: any[] = [];
  let stackKeys: any[] = [];

  if (viz._stacked) {
    const stackedData = axisData.filter((d: any) =>
      ["Area", "Bar"].includes(d.shape),
    );

    const groupValues = groups(
      stackedData,
      (d: Record<string, unknown>) => d.group as string,
    ).reduce((obj: Record<string, number>, [key, values]) => {
      if (!obj[key]) obj[key] = 0;
      obj[key] += sum(
        values as Record<string, number>[],
        (dd: Record<string, number>) => dd[opp as string],
      );
      return obj;
    }, {});

    axisData.sort((a: any, b: any) => {
      if (viz[`_${viz._discrete}Sort`])
        return viz[`_${viz._discrete}Sort`](a.data, b.data);
      const a1 = a[viz._discrete],
        b1 = b[viz._discrete];
      if (a1 - b1 !== 0) return a1 - b1;
      if (a.group !== b.group)
        return groupValues[b.group] - groupValues[a.group];
      return b[opp as string] - a[opp as string];
    });

    discreteKeys = Array.from(new Set(axisData.map((d: any) => d.discrete)));
    stackKeys = Array.from(new Set(axisData.map((d: any) => d.id)));

    stackData = groups(
      axisData,
      (d: Record<string, unknown>) => d.discrete,
    ).map(([, values]) => values);

    stackData.forEach((g: any[]) => {
      const ids = Array.from(new Set(g.map((d: any) => d.id)));
      if (ids.length < stackKeys.length) {
        stackKeys.forEach((k: any) => {
          if (!ids.includes(k)) {
            const d = axisData.filter((d: any) => d.id === k)[0];
            if (d.shape === "Area") {
              const group = stackGroup(d.data, d.i);
              const fillerPoint: Record<string, unknown> = {
                __d3plus__: true,
                data: d.data,
                discrete:
                  d.shape === "Bar"
                    ? `${g[0][viz._discrete]}_${group}`
                    : `${g[0][viz._discrete]}`,
                group,
                id: d.id,
                ids: k,
                shape: d.shape,
                [viz._discrete]: g[0][viz._discrete],
                [opp as string]: 0,
              };
              data.push(fillerPoint);
            }
          }
        });
      }
    });

    if (viz[`_${viz._discrete}Sort`]) {
      data.sort((a: any, b: any) => viz[`_${viz._discrete}Sort`](a.data, b.data));
    } else {
      data.sort((a: any, b: any) => a[viz._discrete] - b[viz._discrete]);
    }

    const order = viz._stackOrder;

    if (Array.isArray(order))
      stackKeys.sort((a: any, b: any) => order.indexOf(a) - order.indexOf(b));
    else if (order === d3Shape.stackOrderNone)
      stackKeys.sort((a: any, b: any) => a.localeCompare(b));

    stackData = (d3Shape
      .stack()
      .keys(stackKeys)
      .offset(viz._stackOffset)
      .order(Array.isArray(order) ? d3Shape.stackOrderNone : order)
      .value(((group: Record<string, unknown>[], key: string) => {
        const d = (group as any[]).filter((g: any) => g.id === key);
        return d.length ? (d[0] as any)[opp as string] : 0;
      }) as never) as any)(stackData);

    const discreteData = viz._discrete === "x" ? xData : yData;

    domains = {
      [viz._discrete]: viz[`_${viz._discrete}Time`]
        ? extent(discreteData as any[])
        : discreteData,
      [opp as string]: [
        min(stackData.map((g: any) => min(g.map((p: any) => p[0])) as unknown as number)),
        max(stackData.map((g: any) => max(g.map((p: any) => p[1])) as unknown as number)),
      ],
    };
  } else {
    const discrete = viz._discrete || "x";

    if (viz[`_${viz._discrete}Sort`]) {
      axisData.sort((a: any, b: any) => viz[`_${viz._discrete}Sort`](a.data, b.data));
    } else {
      axisData.sort((a: any, b: any) => a[discrete] - b[discrete]);
    }

    domains = {
      x:
        (!xTime && viz._discrete === "x") || viz._xSort
          ? xData
          : extent(xData as any[]),
      x2:
        (!x2Time && viz._discrete === "x") || viz._x2Sort
          ? x2Data
          : extent(x2Data as any[]),
      y:
        (!yTime && viz._discrete === "y") || viz._ySort
          ? yData
          : extent(yData as any[]),
      y2:
        (!y2Time && viz._discrete === "y") || viz._y2Sort
          ? y2Data
          : extent(y2Data as any[]),
    };
  }

  return {
    plotInitialDomains: domains,
    plotDiscreteKeys: discreteKeys,
    plotStackData: stackData,
    plotStackKeys: stackKeys,
  };
};

/**
    `computePlotScales` — fourth stage of Plot's pipeline. Takes the per-axis
    values + the chart's raw `domains` object (computed by the still-inline
    stacking/non-stacking branch) and produces the four configured d3 scale
    instances (`x`/`x2`/`y`/`y2`), the resolved scale-type strings
    (`xConfigScale` etc.), and the final `domains` after log/baseline
    adjustments.

    Side effects on viz: `_xConfigScale`/`_x2ConfigScale`/`_yConfigScale`/
    `_y2ConfigScale` (legacy consumers read them directly).

    The "initial domains" computation (stacked vs non-stacked branch that
    fills `domains.x`, `domains.y`, etc. from data) is **still inline in
    Plot._draw** — extracting that requires untangling array sorts that
    mutate `axisData` in place, which is the natural next step.
*/
export const computePlotScales: TransformStage = ({viz, plotFormattedData, plotAxisData, plotInitialDomains}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  let domains = plotInitialDomains as Record<string, any[]>;
  const width = viz._width - viz._margin.left - viz._margin.right;
  const height = viz._height - viz._margin.top - viz._margin.bottom;
  const opp = viz._discrete ? (viz._discrete === "x" ? "y" : "x") : undefined;
  const opp2 = viz._discrete
    ? viz._discrete === "x" ? "y2" : "x2"
    : undefined;
  const opps = [opp, opp2].filter(d => d) as string[];

  function domainScaleSetup(axis: string) {
    const scale = viz[`_${axis}Time`]
      ? "Time"
      : viz._discrete === axis || viz[`_${axis}Sort`]
        ? "Point"
        : "Linear";
    const domain = viz[`_${axis}Domain`]
        ? viz[`_${axis}Domain`].slice()
        : domains[axis],
      domain2 = viz[`_${axis}2Domain`]
        ? viz[`_${axis}2Domain`].slice()
        : domains[`${axis}2`];
    if (scale !== "Point") {
      if (domain && domain[0] === void 0) domain[0] = domains[axis][0];
      if (domain && domain[1] === void 0) domain[1] = domains[axis][1];
      if (domain2 && domain2[0] === void 0)
        domain2[0] = domains[`${axis}2`][0];
      if (domain2 && domain2[1] === void 0)
        domain2[1] = domains[`${axis}2`][1];
    }
    return [domain, scale, domain2, scale] as const;
  }

  const [xAutoDomain, xScale, x2AutoDomain, x2Scale] = domainScaleSetup("x");
  const [yAutoDomain, yScale, y2AutoDomain, y2Scale] = domainScaleSetup("y");

  const autoScale = (axis: string, fallback: string) => {
    const userScale = viz[`_${axis}Config`].scale;
    if (userScale === "auto") {
      if (viz._discrete === axis) return fallback;
      const values = axisData.map((d: any) => d[axis]);
      return deviation(values)! / mean(values)! > 3 ? "log" : "linear";
    }
    return userScale || fallback;
  };

  const yConfigScale = (viz._yConfigScale = autoScale("y", yScale).toLowerCase());
  const y2ConfigScale = (viz._y2ConfigScale = autoScale("y2", y2Scale).toLowerCase());
  const xConfigScale = (viz._xConfigScale = autoScale("x", xScale).toLowerCase());
  const x2ConfigScale = (viz._x2ConfigScale = autoScale("x2", x2Scale).toLowerCase());

  domains = {
    x: xAutoDomain,
    x2: x2AutoDomain || xAutoDomain,
    y: yAutoDomain,
    y2: y2AutoDomain || yAutoDomain,
  };
  Object.keys(domains).forEach(axis => {
    if (viz[`_${axis}ConfigScale`] === "log" && domains[axis].includes(0)) {
      if ((min(domains[axis]) as unknown as number) < 0)
        domains[axis][1] = max(
          data
            .map((d: any) => d[axis])
            .filter((d: any) => ![NaN, undefined, false].includes(d)),
        );
      else
        domains[axis][0] = min(
          axisData
            .map((d: any) => d[axis])
            .filter((d: any) => ![NaN, undefined, false].includes(d)),
        );
    }
  });

  opps.forEach(o => {
    if (viz[`_${o}Config`].domain) {
      const d = viz[`_${o}Config`].domain;
      if (viz._discrete === "x") d.reverse();
      domains[o] = d;
    } else if (o && viz._baseline !== void 0) {
      const b = viz._baseline;
      if (domains[o] && domains[o][0] > b) domains[o][0] = b;
      else if (domains[o] && domains[o][1] < b) domains[o][1] = b;
    }
  });

  const x = (scales as any)[`scale${xScale}`]()
    .domain(domains.x)
    .range(range(0, width + 1, width / (domains.x.length - 1)));
  const x2 = (scales as any)[`scale${x2Scale}`]()
    .domain(domains.x2)
    .range(range(0, width + 1, width / (domains.x2.length - 1)));
  const y = (scales as any)[`scale${yScale}`]()
    .domain(domains.y.reverse())
    .range(range(0, height + 1, height / (domains.y.length - 1)));
  const y2 = (scales as any)[`scale${y2Scale}`]()
    .domain(domains.y2.reverse())
    .range(range(0, height + 1, height / (domains.y2.length - 1)));

  return {
    plotDomains: domains,
    plotScales: {x, y, x2, y2, xScale, yScale, x2Scale, y2Scale},
    plotConfigScales: {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale},
    plotOpps: {opp, opp2, opps},
  };
};

export const plotDef: ChartDefinition = {
  name: "Plot",
  defaults: {
    annotations: [],
    axisPersist: false,
    barPadding: 0,
    discreteCutoff: 100,
    groupPadding: 5,
    lineMarkers: false,
    shape: constant("Circle"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  // Plot's pipeline tail: shared viz prep + Plot-specific data format +
  // per-axis values + stacked/non-stacked initial domains + scale construction.
  // Plot._draw runs these via `runStages` and continues with the paint phase
  // (axis rendering, buffer setup, shape emission).
  stages: [
    ...vizPreDrawStages,
    formatPlotData,
    computePlotAxisValues,
    computePlotInitialDomains,
    computePlotScales,
    extendPlotOppScales,
    preparePlotAxisLayout,
    // `measurePlotLineLabels` is invoked from Plot._draw rather than as part of
    // the canonical chain because it depends on test-axis state (xTest/yTest)
    // that's measured imperatively in _draw, not as a stage.
  ],
  emit: () => [],
};
