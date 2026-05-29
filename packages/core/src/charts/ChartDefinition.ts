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

import {colorContrast} from "@d3plus/color";
import {backgroundColor, date} from "@d3plus/dom";
import {merge as d3plusMerge, unique} from "@d3plus/data";
import * as scales from "d3-scale";
import * as d3Shape from "d3-shape";
import {deviation, extent, groups, max, mean, min, range, rollups, sum} from "d3-array";
import {textWidth as d3plusTextWidth} from "@d3plus/dom";
import discreteBufferFn from "./plotBuffers/discreteBuffer.js";

import {Circle, Path, Rect} from "../shapes/index.js";
import * as allShapes from "../shapes/index.js";
import accessor from "../utils/accessor.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "./features.js";
import type {FeatureModule} from "./features.js";
import {vizPreDrawStages} from "./stages.js";
import {absorbShapeIntoChartScene, collectComputed, shapeConfigFor} from "./emitHelpers.js";
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
import {merge as d3ArrayMerge, quantile} from "d3-array";
import {scaleLinear} from "d3-scale";
import {forceLink, forceManyBody, forceSimulation} from "d3-force";
import type {SimulationNodeDatum, SimulationLinkDatum} from "d3-force";
import {polygonHull} from "d3-polygon";
import {assign} from "@d3plus/dom";
import {nest} from "@d3plus/data";
import {largestRect, pointDistance, pointRotate} from "@d3plus/math";
import {pie} from "d3-shape";
import {pointer} from "d3-selection";
import {sankeyJustify} from "d3-sankey";
import {parseSides} from "@d3plus/dom";
import {feature as topojsonFeature} from "topojson-client";

import constant from "../utils/constant.js";

import matrixPrepData from "./helpers/matrixData.js";

// `tauRadar` is used by the Radar layout stage to compute per-axis radians.
// Originally a module-local in Radar.ts; moved here with the layout body.
const tauRadar = Math.PI * 2;

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
/**
    `plotShapesEmit` — for Plot-based charts. Plot._paint runs imperatively
    (axis production rendering + per-discrete-group shape emission via
    `absorbShapeIntoChartScene`) which populates `viz._chartScene` as a
    side effect. So the def's emit just returns that already-populated
    scene — the chart's "data" IS the chart-scene Plot produced.

    Consumers calling `barChartDef.emit({viz})` directly (without going
    through Plot.render) get an empty array (since `_chartScene` won't
    be populated yet). That's the right answer — they need to drive
    Plot's pipeline (or use `plotPaint(viz, pCtx)`) first.

    Future evolution: as plotPaint is decomposed into pure stages, the
    paint logic moves here and the side-effect-then-snapshot pattern
    inverts to a pure data → SceneNode[] transformation.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plotShapesEmit: ChartDefinition["emit"] = ({viz}: {viz: any}) =>
  Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [];

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
  emit: plotShapesEmit,
};

/* ----------------------- other Plot subclass defs ----------------------- */

/** Each of these is a configuration delta over `Plot`'s defaults. */

export const areaPlotDef: ChartDefinition = {
  name: "AreaPlot",
  defaults: {baseline: 0, discrete: "x", shape: constant("Area")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: plotShapesEmit,
};

export const linePlotDef: ChartDefinition = {
  name: "LinePlot",
  defaults: {discrete: "x", shape: constant("Line")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: plotShapesEmit,
};

export const stackedAreaDef: ChartDefinition = {
  name: "StackedArea",
  defaults: {stacked: true},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: plotShapesEmit,
};

export const boxWhiskerDef: ChartDefinition = {
  name: "BoxWhisker",
  defaults: {discrete: "x", shape: constant("Box")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: plotShapesEmit,
};

export const bumpChartDef: ChartDefinition = {
  name: "BumpChart",
  defaults: {discrete: "x", shape: constant("Line")},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: plotShapesEmit,
};

/* ----------------------- Pie/Donut/Pack defs ----------------------- */

/**
    `applyPieLayout` — Pie's chart-specific layout stage. Runs the d3-shape
    pie layout against `viz._filteredData`, tags each slice with
    `__d3plus__` + index, builds the arc generator from `_innerRadius`/
    `_padAngle`/`_padPixel`, and stashes `_pieData`/`_arcData`/`_pieWidth`/
    `_pieHeight` back on the viz for emit + the chart's _chartTransform.
*/
export const applyPieLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const height = v._height - v._margin.top - v._margin.bottom;
  const width = v._width - v._margin.left - v._margin.right;
  const outerRadius = Math.min(width, height) / 2;

  const pieData = (v._pieData = v._pie
    .padAngle(v._padAngle || v._padPixel / outerRadius)
    .sort(v._sort)
    .value(v._value)(v._filteredData));

  pieData.forEach((d: Record<string, unknown>, i: number) => {
    d.__d3plus__ = true;
    d.i = i;
  });

  v._arcData = d3Shape.arc()
    .innerRadius(v._innerRadius)
    .outerRadius(outerRadius);

  v._pieWidth = width;
  v._pieHeight = height;

  return {shapeData: pieData};
};

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
  stages: [...vizPreDrawStages, applyPieLayout],
  emit: pieEmit,
};

export const donutDef: ChartDefinition = {
  // Donut extends Pie. Its only purely-scalar override is `padPixel`. The
  // `innerRadius` closure depends on `this._width`/`_height`/`_margin` at
  // call time, so it stays imperative in the constructor. Same emit as
  // Pie (the slice data shape is identical).
  name: "Donut",
  defaults: {padPixel: 2},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: pieEmit,
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
    time interval at the assigned lane). The layout stage stashes
    `xScale`/`yScale`/`bandWidth` onto `viz._priestleyCtx` and returns the
    laid-out `data` as `shapeData`; emit consumes both. Same transient-
    shape pattern as treemapEmit.
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

/**
    `applyPriestleyLayout` — Priestley's chart-specific layout stage.

    Builds the per-row datum array from `_filteredData` (start/end coerced
    via `date()` when `_axisConfig.scale === "time"`), groups it by the
    nested `_groupBy` slice, then assigns each band a `lane` using a
    greedy first-fit packer. Runs `viz._axisTest.measure()` (pure layout,
    no DOM) and `viz._axis.renderMode("compute").render()` then absorbs
    its scene into `_chartScene`. Computes the band-scale (`yScale` via
    d3-scale.scaleBand) using the test-axis's measured padding, then
    stashes `xScale`/`yScale`/`bandWidth` on
    `viz._priestleyCtx` for `priestleyEmit` to consume.

    Returns the laid-out per-band data as `shapeData`; the chart class
    leaves `_chartTransform` undefined since Priestley positions in
    absolute scale coordinates.
*/
export const applyPriestleyLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;

  if (!v._filteredData) return {shapeData: []};

  const data = v._filteredData
    .map((datum: any, i: number) => ({
      __d3plus__: true,
      data: datum,
      end:
        v._axisConfig.scale === "time"
          ? date(v._end(datum, i))
          : v._end(datum, i),
      i,
      id: v._id(datum, i),
      start:
        v._axisConfig.scale === "time"
          ? date(v._start(datum, i))
          : v._start(datum, i),
    }))
    .filter((d: any) => d.end - d.start > 0)
    .sort((a: any, b: any) => a.start - b.start);

  let nestedData;
  if (v._groupBy.length > 1 && v._drawDepth > 0) {
    const keyFns = [];
    for (let i = 0; i < v._drawDepth; i++)
      keyFns.push((d: any) => v._groupBy[i](d.data, d.i));
    nestedData = nestGroups(data, keyFns);
  } else nestedData = [{values: data}];

  let maxLane = 0;
  nestedData.forEach((g: any) => {
    let track: any[] = [];
    g.values.forEach((d: any) => {
      track = track.map((t: any) => (t <= d.start ? false : t));
      const i = track.indexOf(false);
      if (i < 0) {
        d.lane = maxLane + track.length;
        track.push(d.end);
      } else {
        track[i] = d.end;
        d.lane = maxLane + i;
      }
    });
    maxLane += track.length;
  });

  const axisConfig = {
    domain: [
      min(data, (d: {start: number | Date; end: number | Date}) => d.start) || 0,
      max(data, (d: {start: number | Date; end: number | Date}) => d.end) || 0,
    ],
    height: v._height - v._margin.top - v._margin.bottom,
    width: v._width - v._margin.left - v._margin.right,
  };

  // Test axis: measure-only — populates _padding/outerBounds without DOM.
  v._axisTest.config(axisConfig).config(v._axisConfig).measure();

  // Production axis: compute-mode render → absorb the scene into
  // _chartScene wrapped in a group with the axis transform. Priestley's
  // _chartTransform is undefined, so the wrap transform is absolute.
  v._axis
    .config(axisConfig)
    .config(v._axisConfig)
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .render();
  const axisScene = v._axis.toScene();
  if (axisScene) {
    (v._chartScene ||= []).push({
      type: "group",
      key: "priestley-axis",
      transform: {x: v._margin.left, y: v._margin.top},
      children: axisScene.children || [],
    });
  }

  const axisPad = v._axisTest._padding;
  const xScale = v._axis._d3Scale;

  const yScale = (scales as any).scaleBand()
    .domain(range(0, maxLane, 1) as unknown as string[])
    .paddingInner(v._paddingInner)
    .paddingOuter(v._paddingOuter)
    .rangeRound([
      v._height -
        v._margin.bottom -
        v._axisTest.outerBounds().height -
        axisPad,
      v._margin.top + axisPad,
    ]);

  const bandWidth = yScale.bandwidth();

  v._priestleyCtx = {xScale, yScale, bandWidth};
  return {shapeData: data};
};

export const priestleyDef: ChartDefinition = {
  name: "Priestley",
  defaults: {paddingInner: 0.05, paddingOuter: 0.05},
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyPriestleyLayout],
  emit: priestleyEmit,
};

/**
    `radarDef.emit` — Path SceneNodes for each radar polygon. The layout
    stage stashes `groupData` + `pathConfig` on `viz._radarCtx`. The
    Radar's circle/rect/path axis decorations are still drawn imperatively
    (they don't fit the chart-data shape; addressed later when axis-grid
    emit lands).
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

/**
    `applyRadarLayout` — Radar's chart-specific layout stage.

    Computes the polar geometry for the radar: per-axis (`nestedAxisData`)
    angular positions, per-group (`nestedGroupData`) polygon vertices, the
    max value for radius normalization, and the per-polygon `pathConfig`
    (including event-handler wrappers that translate cursor → nearest
    vertex). Stashes `groupData` + `pathConfig` on `viz._radarCtx` for
    `radarEmit` to consume; returns `shapeData = groupData`.

    The Circle/Rect/Path axis decorations (background grid, axis labels,
    spokes) are emitted in compute mode and absorbed into `_chartScene`
    alongside the polygons. All three share the chart-center origin via
    `_chartTransform` — fixes a long-standing pre-v4 offset bug where the
    decoration group's transform didn't account for chart margins.
*/
export const applyRadarLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const height = v._height - v._margin.top - v._margin.bottom;
  const width = v._width - v._margin.left - v._margin.right;

  const radius = min([height, width])! / 2 - v._outerPadding;

  const nestedAxisData = groups(v._filteredData, v._metric);
  const nestedGroupData = groups(v._filteredData, v._id, v._metric);

  const maxValue = max(
    nestedGroupData
      .map(([, innerEntries]) =>
        innerEntries.map(([, vals]) =>
          sum(vals, (x, i) => v._value(x, i)),
        ),
      )
      .flat(),
  );

  const circularAxis = Array.from(Array(v._levels).keys()).map(d => ({
    id: d,
    r: radius * ((d + 1) / v._levels),
  }));

  const circleConfig = shapeConfigFor(v, "Circle", v._axisConfig.shapeConfig);
  delete circleConfig.label;

  // Axis decoration: concentric background circles. v4: absorb into
  // _chartScene at chart-center origin (which is exactly what
  // _chartTransform provides via Viz.toScene). The legacy DOM group was
  // at (width/2, height/2) — slightly different from the polygon center
  // — so this also fixes a long-standing decoration/polygon-offset bug.
  const radarCircles = new Circle()
    .renderMode("compute")
    .data(circularAxis)
    .config(circleConfig);
  absorbShapeIntoChartScene(v, radarCircles, {key: "radar-radial-circles"});

  const totalAxis = nestedAxisData.length;
  const polarAxis = nestedAxisData
    .map(([key, values], i) => {
      const d = {key, values};
      const ww = v._outerPadding;
      const fontSize =
        (v._shapeConfig.labelConfig.fontSize &&
          v._shapeConfig.labelConfig.fontSize(d, i)) ||
        11;

      const lineHeight = fontSize * 1.4;
      const hh = lineHeight * 2;
      const padding = 10,
        quadrant =
          (parseInt(String(360 - ((360 / totalAxis) * i) / 90), 10) % 4) + 1,
        radians = (tauRadar / totalAxis) * i;

      let angle = (360 / totalAxis) * i;

      let textAnchor = "start";
      let x = padding;

      if (quadrant === 2 || quadrant === 3) {
        x = -ww - padding;
        textAnchor = "end";
        angle += 180;
      }

      const labelBounds = {
        x,
        y: -hh / 2,
        width: ww,
        height: hh,
      };

      return {
        __d3plus__: true,
        data: merge(d.values as DataPoint[], v._aggs),
        i,
        id: d.key,
        key: d.key,
        angle,
        textAnchor,
        labelBounds,
        rotateAnchor: [-x, hh / 2],
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
      };
    })
    .sort((a, b) => (a.key as number) - (b.key as number));

  // Axis decoration: per-axis labels (Rect-mounted text). Absorbed into
  // _chartScene at chart-center origin (same as the polygons).
  const radarLabels = new Rect()
    .renderMode("compute")
    .data(polarAxis as unknown as DataPoint[])
    .rotate((d: any) => d.angle || 0)
    .width(0)
    .height(0)
    .x((d: any) => d.x)
    .y((d: any) => d.y)
    .label((d: any) => d.id)
    .labelBounds((d: any) => d.labelBounds as unknown as Record<string, unknown>)
    .labelConfig(v._axisConfig.shapeConfig.labelConfig);
  absorbShapeIntoChartScene(v, radarLabels, {key: "radar-axis-labels"});

  // Axis decoration: radial spoke lines.
  const radarSpokes = new Path()
    .renderMode("compute")
    .data(polarAxis as unknown as DataPoint[])
    .d((d: any) => `M${0},${0} ${-d.x},${-d.y}`)
    .config(shapeConfigFor(v, "Path", v._axisConfig.shapeConfig));
  absorbShapeIntoChartScene(v, radarSpokes, {key: "radar-axis-spokes"});

  const groupData = nestedGroupData.map(([hKey, innerEntries]) => {
    const q = innerEntries.map(([, vals], i) => {
      const value = sum(vals, (x, i) => v._value(x, i));
      const r = (value / maxValue!) * radius,
        radians = (tauRadar / totalAxis) * i;
      return {
        x: r * Math.cos(radians),
        y: r * Math.sin(radians),
      };
    });

    const pathD = `M ${q[0].x} ${q[0].y} ${q
      .map(l => `L ${l.x} ${l.y}`)
      .join(" ")} L ${q[0].x} ${q[0].y}`;

    return {
      arr: innerEntries.map(([, vals]) =>
        merge(vals as DataPoint[], v._aggs),
      ),
      id: hKey,
      points: q,
      d: pathD,
      __d3plus__: true,
      data: merge(
        innerEntries.map(([, vals]) =>
          merge(vals as DataPoint[], v._aggs),
        ) as DataPoint[],
        v._aggs,
      ),
    };
  });

  const pathConfig = shapeConfigFor(v, "Path");
  // Event-handler wrappers: translate the cursor coordinate (in chart-group
  // space) to the nearest polygon vertex so the click/mousemove resolves
  // to a single datum out of the polygon's flattened `arr`. Stays in the
  // layout stage (not the constructor) because the wrapper closes over
  // `width`/`height` from this render pass.
  const events = Object.keys((pathConfig.on as Record<string, unknown>) ?? {});
  pathConfig.on = {};
  for (const eventName of events) {
    pathConfig.on[eventName] = (d: any, i: any, s: any, evt: any) => {
      const xs = d.points.map((p: any) => p.x + width / 2);
      const ys = d.points.map((p: any) => p.y + height / 2);
      const cursor = pointer(evt, v._select.node());
      const xDist = xs.map((p: any) => Math.abs(p - cursor[0]));
      const yDist = ys.map((p: any) => Math.abs(p - cursor[1]));
      const dists = xDist.map((dd: any, ii: any) => dd + yDist[ii]);
      v._on[eventName].bind(v)(d.arr[dists.indexOf(min(dists))], i, s, evt);
    };
  }

  v._radarCtx = {groupData, pathConfig};
  return {shapeData: groupData};
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
  stages: [...vizPreDrawStages, applyRadarLayout],
  emit: radarEmit,
};

/**
    `matrixDef.emit` — Rect cells for a Matrix chart. The layout stage stashes
    the column/row scales + cell dims on `viz._matrixCtx`.
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

/**
    `applyMatrixLayout` — Matrix's chart-specific layout stage.

    Runs `matrixData.prepData` to derive `rowValues`/`columnValues` plus the
    cartesian-product `shapeData`, then performs a two-pass Axis render: a
    hidden first pass to measure `_rowAxis.outerBounds().width` and
    `_columnAxis.outerBounds().height`, then a visible second pass that
    consumes the computed `_padding`. Each Axis (`viz._rowAxis`/
    `viz._columnAxis`) is `.measure()`-d on the hidden pass and rendered
    in compute mode on the production pass, then its scene is absorbed
    into `_chartScene` wrapped with the axis's relative transform
    (delta from `_chartTransform`).

    Side effects on the viz:
      - `_padding.left += rowPadding` (row-axis outer width)
      - `_padding.top  += columnPadding` (column-axis outer height)
      - `_matrixCtx = {columnScale, rowScale, cellWidth, cellHeight}` for
        `matrixEmit` to consume.

    The padding mutation mirrors the legacy `_draw` body byte-for-byte;
    `_chartTransform` (`{x: 0, y: _margin.top}`) is still set by the chart
    class after this stage returns.
*/
export const applyMatrixLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const {rowValues, columnValues, shapeData} = matrixPrepData.bind(v)(
    v._filteredData,
  );

  if (!rowValues.length || !columnValues.length) return {shapeData: []};

  const height = v._height - v._margin.top - v._margin.bottom;
  const width = v._width - v._margin.left - v._margin.right;

  const columnRotation = width / columnValues.length < 120;

  // First pass: measure-only — populates outerBounds for padding compute.
  v._rowAxis
    .domain(rowValues)
    .height(
      height - v._margin.top - v._margin.bottom - v._padding.bottom - v._padding.top,
    )
    .maxSize(width / 4)
    .width(width)
    .config(v._rowConfig)
    .measure();

  const rowPadding = v._rowAxis.outerBounds().width;
  v._padding.left += rowPadding;

  v._columnAxis
    .domain(columnValues)
    .range([
      v._margin.left + v._padding.left,
      width - v._margin.right + v._padding.right,
    ])
    .height(height)
    .maxSize(height / 4)
    .width(width)
    .labelRotation(columnRotation)
    .config(v._columnConfig)
    .measure();

  const columnPadding = v._columnAxis.outerBounds().height;
  v._padding.top += columnPadding;

  // Production pass: compute-mode render → absorb each axis into
  // _chartScene wrapped with its transform. _chartTransform is set by
  // the chart class to `{x: 0, y: _margin.top}`, so the absorbed groups
  // get an OFFSETTING transform that lands their content at the legacy
  // absolute position.
  const chartTransformY = v._margin.top; // matches Matrix._draw's _chartTransform
  v._rowAxis
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .height(height - v._margin.top - v._margin.bottom - v._padding.bottom)
    .maxSize(rowPadding)
    .range([columnPadding + v._columnAxis.padding(), undefined])
    .render();
  const rowScene = v._rowAxis.toScene();
  if (rowScene) {
    (v._chartScene ||= []).push({
      type: "group",
      key: "matrix-row-axis",
      transform: {x: v._margin.left, y: 0}, // (margin.left, margin.top) absolute - (0, margin.top) chartTransform
      children: rowScene.children || [],
    });
  }

  v._columnAxis
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .range([
      v._margin.left + v._padding.left + v._rowAxis.padding(),
      width - v._margin.right + v._padding.right,
    ])
    .maxSize(columnPadding)
    .render();
  const colScene = v._columnAxis.toScene();
  if (colScene) {
    (v._chartScene ||= []).push({
      type: "group",
      key: "matrix-column-axis",
      transform: {x: 0, y: 0}, // legacy (0, margin.top) - chartTransform (0, margin.top) = (0,0)
      children: colScene.children || [],
    });
  }
  void chartTransformY;

  const rowScale = v._rowAxis._getPosition.bind(v._rowAxis);
  const columnScale = v._columnAxis._getPosition.bind(v._columnAxis);
  const cellHeight =
    rowValues.length > 1
      ? rowScale(rowValues[1]) - rowScale(rowValues[0])
      : v._rowAxis.height();
  const cellWidth =
    columnValues.length > 1
      ? columnScale(columnValues[1]) - columnScale(columnValues[0])
      : v._columnAxis.width();

  v._matrixCtx = {columnScale, rowScale, cellWidth, cellHeight};
  return {shapeData};
};

export const matrixDef: ChartDefinition = {
  name: "Matrix",
  defaults: {
    cellPadding: 2,
    column: accessor("column"),
    row: accessor("row"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyMatrixLayout],
  emit: matrixEmit,
};

/**
    `radialMatrixDef.emit` — Path SceneNodes for each arc cell. The layout
    stage stashes the arc generator on `viz._radialMatrixCtx`.
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

/**
    `applyRadialMatrixLayout` — RadialMatrix's chart-specific layout stage.

    Runs `matrixData.prepData` for `rowValues`/`columnValues`/`shapeData`,
    then computes the polar geometry: a label-anchored outer radius, the
    per-column label positions (`labelData` with angle/quadrant + xy), and
    the d3-shape arc generator (`arcData`) that maps each row/column pair
    onto its annular wedge. `viz._columnLabels` (a TextBox built once in
    the constructor) runs in compute mode and its scene is absorbed into
    `_chartScene` — chart-center origin via `_chartTransform`.

    Writes back on the viz:
      - `_radialMatrixCtx = {arcData}` for `radialMatrixEmit`.
      - `_radialMatrixWidth`/`_radialMatrixHeight` so the chart class can
        compute `_chartTransform` (`{x: width/2 + _margin.left, y: ...}`)
        using the same width/height the stage measured.

    A local `tauRMConst` mirrors the legacy module-local `tau = Math.PI*2`
    so the stage doesn't depend on a module-level constant shared with
    other charts.
*/
export const applyRadialMatrixLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const tauRMConst = Math.PI * 2;

  const {rowValues, columnValues, shapeData} = matrixPrepData.bind(v)(
    v._filteredData,
  );

  if (!rowValues.length || !columnValues.length) {
    v._radialMatrixWidth = v._width - v._margin.left - v._margin.right;
    v._radialMatrixHeight = v._height - v._margin.top - v._margin.bottom;
    return {shapeData: []};
  }

  const height = v._height - v._margin.top - v._margin.bottom,
    width = v._width - v._margin.left - v._margin.right;

  v._radialMatrixWidth = width;
  v._radialMatrixHeight = height;

  const labelHeight = 50,
    labelWidth = 100;
  const radius = min([height - labelHeight * 2, width - labelWidth * 2])! / 2;

  const flippedColumns = columnValues.slice().reverse();
  flippedColumns.unshift(flippedColumns.pop()!);
  const total = flippedColumns.length;

  const labelData = flippedColumns.map((key: any, i: number) => {
    const radians = (i / total) * tauRMConst;
    const angle = Math.round((radians * 180) / Math.PI);
    const quadrant = Math.floor((((angle + 90) / 90) % 4) + 1);

    const xMod = [0, 180].includes(angle)
      ? -labelWidth / 2
      : [2, 3].includes(quadrant)
        ? -labelWidth
        : 0;
    const yMod = [90, 270].includes(angle)
      ? -labelHeight / 2
      : [2, 1].includes(quadrant)
        ? -labelHeight
        : 0;

    return {
      key,
      angle,
      quadrant,
      radians,
      x: radius * Math.sin(radians + Math.PI) + xMod,
      y: radius * Math.cos(radians + Math.PI) + yMod,
    };
  });

  // Extracts the axis config "labels" Array, if it exists, it filters
  // the column labels by the values included in the Array.
  const displayLabels =
    v._columnConfig.labels instanceof Array
      ? labelData.filter((d: any) => v._columnConfig.labels.includes(d.key))
      : labelData;

  // v4: column labels are a TextBox absorbed into _chartScene at the
  // chart-center origin (which is what _chartTransform provides via
  // Viz.toScene). The legacy DOM group's transform = chart-center too,
  // so this is a behavior-preserving migration.
  v._columnLabels
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .data(displayLabels)
    .x((d: any) => d.x)
    .y((d: any) => d.y)
    .text((d: any) => d.key)
    .width(labelWidth)
    .height(labelHeight)
    .config(v._columnConfig.shapeConfig.labelConfig)
    .render();
  const labelsScene = v._columnLabels.toScene();
  if (labelsScene) {
    (v._chartScene ||= []).push({
      type: "group",
      key: "radialmatrix-columns",
      children: labelsScene.children || [],
    });
  }

  const innerRadius = v._innerRadius(radius);
  const rowHeight = (radius - innerRadius) / rowValues.length;
  const columnWidth =
    labelData.length > 1
      ? labelData[1].radians - labelData[0].radians
      : tauRMConst;
  const flippedRows = rowValues.slice().reverse();

  const arcData = (d3Shape.arc as any)()
    .padAngle(v._cellPadding / radius)
    .innerRadius(
      (d: any) =>
        innerRadius +
        flippedRows.indexOf(d.row) * rowHeight +
        v._cellPadding / 2,
    )
    .outerRadius(
      (d: any) =>
        innerRadius +
        (flippedRows.indexOf(d.row) + 1) * rowHeight -
        v._cellPadding / 2,
    )
    .startAngle(
      (d: any) =>
        labelData[columnValues.indexOf(d.column)].radians - columnWidth / 2,
    )
    .endAngle(
      (d: any) =>
        labelData[columnValues.indexOf(d.column)].radians + columnWidth / 2,
    );

  v._radialMatrixCtx = {arcData};
  return {shapeData};
};

export const radialMatrixDef: ChartDefinition = {
  name: "RadialMatrix",
  defaults: {
    cellPadding: 2,
    column: accessor("column"),
    row: accessor("row"),
  },
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyRadialMatrixLayout],
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

  return {shapeData: treeData};
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

/** Force-simulation node interface for `applyNetworkLayout`. */
interface NetworkLayoutNode extends SimulationNodeDatum {
  id: string;
  size?: number;
  shape?: string;
}

/** Force-simulation link interface for `applyNetworkLayout`. */
interface NetworkLayoutLink extends SimulationLinkDatum<NetworkLayoutNode> {
  size?: number;
}

/**
    `applyNetworkLayout` — Network's chart-specific layout stage.

    Resolves the `_nodes`/`_links`/`_data` triple into a single laid-out
    node array (running a d3-force simulation only when fx/fy coordinates
    are missing), computes the per-node radius scale, normalizes link
    stroke sizes, and stashes per-node + per-link lookups on the viz for
    the click/hover event handlers registered in Network's constructor.
    Writes `_networkCtx` (read by `networkEmit`) with the link/node data,
    `linkConfig`/`linkD`, and `nodeShapeConfig`/`nodeGroups`.
*/
export const applyNetworkLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const height = v._height - v._margin.top - v._margin.bottom;
  const width = v._width - v._margin.left - v._margin.right;

  // Inlined `getNodeId` (kept as a local closure so the stage doesn't have
  // to import Network's helper — the constructor's event handlers still use
  // their own bound copy).
  const nodeId = (d: Record<string, unknown>, i: number) =>
    `${v._id(d, i) || v._nodeGroupBy[min([v._drawDepth, v._nodeGroupBy.length - 1])](d, i)}`;

  const data = v._filteredData.reduce((obj: any, d: any, i: any) => {
    obj[v._id(d, i)] = d;
    return obj;
  }, {});

  let nodes = v._nodes.reduce((obj: any, d: any, i: any) => {
    obj[nodeId(d, i)] = d;
    return obj;
  }, {});

  nodes = Array.from(new Set(Object.keys(data).concat(Object.keys(nodes))))
    .map((id, i) => {
      const d = data[id],
        n = nodes[id];

      if (n === undefined) return false;

      // Prefer the value from `d` (the linked data point) when it's defined
      // and the accessor returns something meaningful; otherwise fall back
      // to the node's own value. The previous double-nested ternaries made
      // the read order hard to scan.
      const pickFrom = <T,>(
        accessor: (x: any) => T,
        validate: (x: T) => boolean = v => v !== undefined,
      ): T =>
        d !== undefined && validate(accessor(d)) ? accessor(d) : accessor(n);

      return {
        __d3plus__: true,
        data: d || n,
        i,
        id,
        fx: pickFrom(v._x, (val: number) => !isNaN(val)),
        fy: pickFrom(v._y, (val: number) => !isNaN(val)),
        node: n,
        r: v._size ? pickFrom(v._size) : v._sizeMin,
        shape: pickFrom(v._shape),
      };
    })
    .filter((n: any): n is Exclude<typeof n, false> => !!n);

  const nodeLookup = (v._nodeLookup = nodes.reduce((obj: any, d: any) => {
    obj[d.id] = d;
    return obj;
  }, {}));

  const nodeIndices = nodes.map((n: any) => n.node);
  const links = v._links.map((l: any) => {
    const referenceType = typeof l.source;
    return {
      size: v._linkSize(l),
      source:
        referenceType === "number"
          ? nodes[nodeIndices.indexOf(v._nodes[l.source])]
          : referenceType === "string"
            ? nodeLookup[l.source]
            : nodeLookup[l.source.id],
      target:
        referenceType === "number"
          ? nodes[nodeIndices.indexOf(v._nodes[l.target])]
          : referenceType === "string"
            ? nodeLookup[l.target]
            : nodeLookup[l.target.id],
    };
  });

  v._linkLookup = links.reduce((obj: any, d: any) => {
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  const missingCoords = nodes.some(
    (n: any) => n.fx === undefined || n.fy === undefined,
  );

  if (missingCoords) {
    const linkStrength = scales
      .scaleLinear()
      .domain(
        extent(links, (d: {size: number}) => d.size) as [number, number],
      )
      .range([0.1, 0.5]);

    const simulation = forceSimulation()
      .force(
        "link",
        forceLink(links as unknown as NetworkLayoutLink[])
          .id((d: SimulationNodeDatum) => (d as NetworkLayoutNode).id)
          .distance(1)
          .strength((d: NetworkLayoutLink) => linkStrength(d.size as number))
          .iterations(4),
      )
      .force("charge", forceManyBody().strength(-1))
      .stop();

    const iterations = 100;
    const alphaMin = 0.001;
    const alphaDecay = 1 - Math.pow(alphaMin, 1 / iterations);
    simulation.velocityDecay(0);
    simulation.alphaMin(alphaMin);
    simulation.alphaDecay(alphaDecay);
    simulation.alphaDecay(0);

    simulation.nodes(nodes);
    simulation.tick(iterations).stop();

    const nodePositions = nodes.map(
      (n: any) => [n.vx, n.vy] as [number, number],
    );
    let angle = 0,
      cx = 0,
      cy = 0;
    if (nodePositions.length === 2) {
      angle = 100;
    } else if (nodePositions.length > 2) {
      const hull = polygonHull(nodePositions) || [];
      const rect = largestRect(hull, {verbose: true})!;
      angle = rect.angle;
      cx = rect.cx;
      cy = rect.cy;
    }

    nodes.forEach((n: any) => {
      const p = pointRotate([n.vx, n.vy], -1 * ((Math.PI / 180) * angle), [
        cx,
        cy,
      ]);
      n.fx = p[0];
      n.fy = p[1];
    });
  }

  const xExtent = extent(nodes.map((n: any) => n.fx)) as unknown as [
      number,
      number,
    ],
    yExtent = extent(nodes.map((n: any) => n.fy)) as unknown as [
      number,
      number,
    ];

  const x = scales.scaleLinear().domain(xExtent).range([0, width]),
    y = scales.scaleLinear().domain(yExtent).range([0, height]);

  const nodeRatio =
      (xExtent[1] - xExtent[0]) / (yExtent[1] - yExtent[0]) || 1,
    screenRatio = width / height;

  if (nodeRatio > screenRatio) {
    const h = (height * screenRatio) / nodeRatio;
    y.range([(height - h) / 2, height - (height - h) / 2]);
  } else {
    const w = (width * nodeRatio) / screenRatio;
    x.range([(width - w) / 2, width - (width - w) / 2]);
  }

  nodes.forEach((n: any) => {
    n.x = x(n.fx);
    n.y = y(n.fy);
  });

  const rExtent = extent(nodes.map((n: any) => n.r)) as unknown as [
    number,
    number,
  ];
  let rMax =
    v._sizeMax ||
    (max([
      1,
      (min(
        d3ArrayMerge(
          nodes.map((n1: any) =>
            nodes.map((n2: any) =>
              n1 === n2 ? null : pointDistance([n1.x, n1.y], [n2.x, n2.y]),
            ),
          ),
        ),
      ) as unknown as number) / 2,
    ]) as unknown as number);

  const r = (scales as any)[
      `scale${v._sizeScale.charAt(0).toUpperCase()}${v._sizeScale.slice(1)}`
    ]()
      .domain(rExtent)
      .range([
        rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, v._sizeMin]),
        rMax,
      ]),
    xDomain = x.domain(),
    yDomain = y.domain();

  const xOldSize = xDomain[1] - xDomain[0],
    yOldSize = yDomain[1] - yDomain[0];

  nodes.forEach((n: any) => {
    const size = r(n.r);
    if (xDomain[0] > x.invert(n.x - size)) xDomain[0] = x.invert(n.x - size);
    if (xDomain[1] < x.invert(n.x + size)) xDomain[1] = x.invert(n.x + size);
    if (yDomain[0] > y.invert(n.y - size)) yDomain[0] = y.invert(n.y - size);
    if (yDomain[1] < y.invert(n.y + size)) yDomain[1] = y.invert(n.y + size);
  });

  const xNewSize = xDomain[1] - xDomain[0],
    yNewSize = yDomain[1] - yDomain[0];

  rMax *= min([xOldSize / xNewSize, yOldSize / yNewSize])!;
  r.range([
    rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, v._sizeMin]),
    rMax,
  ]);
  x.domain(xDomain);
  y.domain(yDomain);

  const fallbackRadius = (nodeRatio > screenRatio ? width : height) / 2;
  nodes.forEach((n: any) => {
    n.x = x(n.fx);
    n.fx = n.x;
    n.y = y(n.fy);
    n.fy = n.y;
    n.r = r(n.r) || fallbackRadius;
    n.width = n.r * 2;
    n.height = n.r * 2;
  });

  // Link stroke scaling (depends on the final node radius range).
  const strokeExtent = extent(links, (d: {size: number}) => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const strokeScale = (scales as any)[
      `scale${v._linkSizeScale.charAt(0).toUpperCase()}${v._linkSizeScale.slice(1)}`
    ]()
      .domain(strokeExtent)
      .range([v._linkSizeMin, r.range()[0]]);
    links.forEach((link: any) => {
      link.size = strokeScale(link.size);
    });
  }

  const linkConfig = shapeConfigFor(v, "Path", v._shapeConfig, "edge");
  delete linkConfig.on;

  const nodeShapeConfig = {
    label: (d: any) =>
      nodes.length <= v._dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
  };
  const linkD = (d: any) =>
    `M${(d.source as DataPoint).x},${(d.source as DataPoint).y} ${(d.target as DataPoint).x},${(d.target as DataPoint).y}`;
  const nodeGroups = Array.from(
    groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ),
  );
  v._networkCtx = {links, linkConfig, linkD, nodeGroups, nodeShapeConfig};

  return {shapeData: nodes};
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
  stages: [...vizPreDrawStages, applyNetworkLayout],
  emit: networkEmit,
};

/**
    `applyRingsLayout` — Rings' chart-specific layout stage. Mirrors the
    other apply* stages: pure transformation of viz state into the
    shapeData + chart-data structures `ringsDef.emit` consumes.

    Resolves nodes/links from the filtered data + user-provided node/link
    arrays, places the focal `center` and lays out primary + secondary
    rings around it, sizes nodes via an extent-derived linear scale,
    builds the bezier/straight link `d` accessor and per-node label
    bounds, and finally stashes `edges`/`nodeGroups`/`linkConfig`/`linkD`/
    `nodeShapeConfig` on `viz._ringsCtx` for `ringsEmit` to consume.
    Also writes `_nodeLookup`/`_linkLookup` back on the viz for legacy
    hover/event consumers.
*/
export const applyRingsLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;

  const data = v._filteredData.reduce((obj: any, d: any, i: any) => {
    obj[v._id(d, i)] = d;
    return obj;
  }, {});

  let nodes = v._nodes;

  if (!v._nodes.length && v._links.length) {
    const nodeIds = Array.from(
      new Set(
        v._links.reduce(
          (ids: any, link: any) => ids.concat([link.source, link.target]),
          [],
        ),
      ),
    );
    nodes = nodeIds.map((node: any) =>
      typeof node === "object" ? node : {id: node},
    );
  }

  nodes = nodes.reduce((obj: any, d: any, i: any) => {
    obj[
      v._nodeGroupBy
        ? v._nodeGroupBy[v._drawDepth](d, i)
        : v._id(d, i)
    ] = d;
    return obj;
  }, {});

  nodes = Array.from(new Set(Object.keys(data).concat(Object.keys(nodes))))
    .map((id, i) => {
      const d = data[id],
        n = nodes[id];

      if (n === undefined) return false;

      return {
        __d3plus__: true,
        data: d || n,
        i,
        id,
        node: n,
        shape:
          d !== undefined && v._shape(d) !== undefined
            ? v._shape(d)
            : v._shape(n),
      };
    })
    .filter((n: any) => n);

  const nodeLookup = (v._nodeLookup = nodes.reduce((obj: any, d: any) => {
    obj[d.id] = d;
    return obj;
  }, {}));

  const links = v._links.map((link: any) => {
    const check = ["source", "target"];
    const edge = check.reduce((result: any, check: any) => {
      result[check] =
        typeof link[check] === "number"
          ? nodes[link[check]]
          : nodeLookup[link[check].id || link[check]];
      return result;
    }, {} as Record<string, any>);
    edge.size = v._linkSize(link);
    return edge;
  });

  const linkMap = links.reduce((map: any, link: any) => {
    if (!map[link.source.id]) {
      map[link.source.id] = [];
    }
    map[link.source.id].push(link);
    if (!map[link.target.id]) {
      map[link.target.id] = [];
    }
    map[link.target.id].push(link);
    return map;
  }, {});

  const height = v._height - v._margin.top - v._margin.bottom,
    width = v._width - v._margin.left - v._margin.right;

  const edges: any[] = [],
    radius = (min([height, width]) || 0) / 2,
    ringWidth = radius / 3;

  const primaryRing = ringWidth,
    secondaryRing = ringWidth * 2;

  const center = nodeLookup[v._center];

  center.x = width / 2;
  center.y = height / 2;
  center.r = v._sizeMin
    ? max([v._sizeMin, primaryRing * 0.65])
    : v._sizeMax
      ? min([v._sizeMax, primaryRing * 0.65])
      : primaryRing * 0.65;

  const claimed = [center],
    primaries: any[] = [];

  linkMap[v._center].forEach((edge: any) => {
    const node = edge.source.id === v._center ? edge.target : edge.source;
    node.edges = linkMap[node.id].filter(
      (link: any) =>
        link.source.id !== v._center || link.target.id !== v._center,
    );
    node.edge = edge;

    claimed.push(node);
    primaries.push(node);
  });

  primaries.sort((a, b) => a.edges.length - b.edges.length);

  const secondaries: any[] = [];
  let totalEndNodes = 0;

  primaries.forEach(p => {
    const primaryId = p.id;

    p.edges = p.edges.filter(
      (edge: any) =>
        (!claimed.includes(edge.source) && edge.target.id === primaryId) ||
        (!claimed.includes(edge.target) && edge.source.id === primaryId),
    );

    totalEndNodes += p.edges.length || 1;

    p.edges.forEach((edge: any) => {
      const {source, target} = edge;
      const claim = target.id === primaryId ? source : target;
      claimed.push(claim);
    });
  });

  const tau = Math.PI * 2;
  let offset = 0;

  primaries.forEach((p, i) => {
    const children = p.edges.length || 1;
    const space = (tau / totalEndNodes) * children;

    if (i === 0) {
      offset -= space / 2;
    }

    const angle = offset + space / 2 - tau / 4;

    p.radians = angle;
    p.x = width / 2 + primaryRing * Math.cos(angle);
    p.y = height / 2 + primaryRing * Math.sin(angle);

    offset += space;

    p.edges.forEach((edge: any, i: any) => {
      const node = edge.source.id === p.id ? edge.target : edge.source;
      const s = tau / totalEndNodes;
      const a = angle - (s * children) / 2 + s / 2 + s * i;

      node.radians = a;
      node.x = width / 2 + secondaryRing * Math.cos(a);
      node.y = height / 2 + secondaryRing * Math.sin(a);

      secondaries.push(node);
    });
  });

  const primaryDistance = ringWidth / 2;
  const secondaryDistance = ringWidth / 4;

  let primaryMax = primaryDistance / 2 - 4;
  if (primaryDistance / 2 - 4 < 8) {
    primaryMax = min([primaryDistance / 2, 8]) || 0;
  }

  let secondaryMax = secondaryDistance / 2 - 4;
  if (secondaryDistance / 2 - 4 < 4) {
    secondaryMax = min([secondaryDistance / 2, 4]) || 0;
  }

  if (secondaryMax > ringWidth / 10) {
    secondaryMax = ringWidth / 10;
  }

  if (secondaryMax > primaryMax && secondaryMax > 10) {
    secondaryMax = primaryMax * 0.75;
  }
  if (primaryMax > secondaryMax * 1.5) {
    primaryMax = secondaryMax * 1.5;
  }

  primaryMax = Math.floor(primaryMax);
  secondaryMax = Math.floor(secondaryMax);

  let radiusFn: any;

  if (v._size) {
    const domain = extent(data, (d: {size: number}) => d.size) as [
      number,
      number,
    ];

    if (domain[0] === domain[1]) {
      domain[0] = 0;
    }

    radiusFn = scales
      .scaleLinear()
      .domain(domain)
      .rangeRound([3, min([primaryMax, secondaryMax]) as number]);

    const val = center.size;
    center.r = radiusFn(val);
  } else {
    radiusFn = scales
      .scaleLinear()
      .domain([1, 2])
      .rangeRound([primaryMax, secondaryMax]);
  }

  secondaries.forEach(s => {
    s.ring = 2;
    const val = v._size ? s.size : 2;
    s.r = v._sizeMin
      ? max([v._sizeMin, radiusFn(val)])
      : v._sizeMax
        ? min([v._sizeMax, radiusFn(val)])
        : radiusFn(val);
  });

  primaries.forEach(p => {
    p.ring = 1;
    const val = v._size ? p.size : 1;
    p.r = v._sizeMin
      ? max([v._sizeMin, radiusFn(val)])
      : v._sizeMax
        ? min([v._sizeMax, radiusFn(val)])
        : radiusFn(val);
  });

  nodes = ([center] as any[]).concat(primaries).concat(secondaries);

  primaries.forEach(p => {
    const check = ["source", "target"];
    const {edge} = p;

    check.forEach((node: any) => {
      edge[node] = nodes.find((n: any) => n.id === edge[node].id);
    });

    edges.push(edge);

    linkMap[p.id].forEach((edge: any) => {
      const node = edge.source.id === p.id ? edge.target : edge.source;

      if (node.id !== center.id) {
        let target = secondaries.find(s => s.id === node.id);

        if (!target) {
          target = primaries.find(s => s.id === node.id);
        }

        if (target) {
          edge.spline = true;

          const centerX = width / 2;
          const centerY = height / 2;
          const middleRing =
            primaryRing + (secondaryRing - primaryRing) * 0.5;

          const check = ["source", "target"];

          check.forEach((node: any, i: any) => {
            edge[`${node}X`] =
              edge[node].x +
              Math.cos(
                edge[node].ring === 2
                  ? edge[node].radians + Math.PI
                  : edge[node].radians,
              ) *
                edge[node].r;
            edge[`${node}Y`] =
              edge[node].y +
              Math.sin(
                edge[node].ring === 2
                  ? edge[node].radians + Math.PI
                  : edge[node].radians,
              ) *
                edge[node].r;
            edge[`${node}BisectX`] =
              centerX + middleRing * Math.cos(edge[node].radians);
            edge[`${node}BisectY`] =
              centerY + middleRing * Math.sin(edge[node].radians);

            edge[node] = nodes.find((n: any) => n.id === edge[node].id);

            if (edge[node].edges === undefined) edge[node].edges = {};

            const oppId = i === 0 ? edge.target.id : edge.source.id;

            if (edge[node].id === p.id) {
              edge[node].edges[oppId] = {
                angle: p.radians + Math.PI,
                radius: ringWidth / 2,
              };
            } else {
              edge[node].edges[oppId] = {
                angle: target.radians,
                radius: ringWidth / 2,
              };
            }
          });

          edges.push(edge);
        }
      }
    });
  });

  nodes.forEach((node: any) => {
    if (node.id !== v._center) {
      const fontSize =
        (v._shapeConfig.labelConfig.fontSize &&
          v._shapeConfig.labelConfig.fontSize(node)) ||
        11;
      const lineHeight = fontSize * 1.4;
      const height = lineHeight * 2;
      const padding = 5;
      const width = ringWidth - node.r;

      let angle = node.radians * (180 / Math.PI);
      let x = node.r + padding;
      let textAnchor = "start";

      if (angle < -90 || angle > 90) {
        x = -node.r - width - padding;
        textAnchor = "end";
        angle += 180;
      }

      node.labelBounds = {
        x,
        y: -lineHeight / 2,
        width,
        height,
      };

      node.rotate = angle;
      node.textAnchor = textAnchor;
    } else {
      node.labelBounds = {
        x: -primaryRing / 2,
        y: -primaryRing / 2,
        width: primaryRing,
        height: primaryRing,
      };
    }
  });

  v._linkLookup = links.reduce((obj: any, d: any) => {
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  const strokeExtent = extent(links, (d: {size: number}) => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const radius = min(nodes as {r: number}[], (d: {r: number}) => d.r);
    const strokeScale = (scales as any)[
      `scale${v._linkSizeScale.charAt(0).toUpperCase()}${v._linkSizeScale.slice(1)}`
    ]()
      .domain(strokeExtent)
      .range([v._linkSizeMin, radius]);
    links.forEach((link: any) => {
      link.size = strokeScale(link.size);
    });
  }

  const linkConfig = shapeConfigFor(v, "Path", v._shapeConfig, "edge");
  delete linkConfig.on;

  const linkD = (d: any) =>
    d.spline
      ? `M${d.sourceX},${d.sourceY}C${d.sourceBisectX},${d.sourceBisectY} ${d.targetBisectX},${d.targetBisectY} ${d.targetX},${d.targetY}`
      : `M${(d.source as DataPoint).x},${(d.source as DataPoint).y} ${(d.target as DataPoint).x},${(d.target as DataPoint).y}`;

  const shapeConfig = {
    label: (d: any) =>
      nodes.length <= v._dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
    labelBounds: (d: any) => d.labelBounds,
    labelConfig: {
      fontColor: (d: any) =>
        d.id === v._center
          ? (shapeConfigFor(v, d.key) as any).labelConfig.fontColor(d)
          : colorContrast(
              v._select ? backgroundColor(v._select.node()) : "rgb(255, 255, 255)",
            ),
      fontResize: (d: any) => d.id === v._center,
      padding: 0,
      textAnchor: (d: any) =>
        nodeLookup[d.id].textAnchor ||
        (shapeConfigFor(v, d.key) as any).labelConfig.textAnchor,
      verticalAlign: (d: any) => (d.id === v._center ? "middle" : "top"),
    },
    rotate: (d: any) => nodeLookup[d.id].rotate || 0,
  };

  const nodeGroups = Array.from(groups(
    nodes as Record<string, unknown>[],
    (d: Record<string, unknown>) => d.shape as string,
  ));
  v._ringsCtx = {edges, nodeGroups, linkConfig, linkD, nodeShapeConfig: shapeConfig};

  return {shapeData: nodes};
};

/**
    `ringsDef.emit` — links + nodes for the Rings chart. The layout stage
    populates `viz._ringsCtx` with `edges`, `nodeGroups`, `linkConfig`,
    `linkD`, `nodeShapeConfig`.
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
  stages: [...vizPreDrawStages, applyRingsLayout],
  emit: ringsEmit,
};

/**
    `applySankeyLayout` — Sankey's chart-specific layout stage. Mirrors the
    other apply*Layout stages: pure transformation of viz state into the
    chart-data structures `sankeyDef.emit` consumes.

    Resolves the nodes list (from `viz._nodes` or by walking `viz._links`),
    builds the `_nodeLookup` index, normalizes link source/target through
    the lookup, runs the d3-sankey layout against the resulting node+link
    graph, then groups the laid-out nodes by their shape type. Stashes
    `links`/`nodeGroups`/`pathFn` on `viz._sankeyCtx` for emit; also
    publishes `_nodeLookup`/`_linkLookup` for legacy event handlers.
*/
export const applySankeyLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const height = v._height - v._margin.top - v._margin.bottom;
  const width = v._width - v._margin.left - v._margin.right;

  const _nodes = Array.isArray(v._nodes)
    ? v._nodes
    : v._links
        .reduce((all: any, d: any) => {
          if (!all.includes(d[v._linksSource]))
            all.push(d[v._linksSource]);
          if (!all.includes(d[v._linksTarget]))
            all.push(d[v._linksTarget]);
          return all;
        }, [])
        .map((id: any) => ({id}));

  const nodes = _nodes.map((n: any, i: any) => ({
    __d3plus__: true,
    data: n,
    i,
    id: v._nodeId(n, i),
    node: n,
    shape: "Rect",
  }));

  const nodeLookup = (v._nodeLookup = nodes.reduce(
    (obj: any, d: any, i: any) => {
      obj[d.id] = i;
      return obj;
    },
    {},
  ));

  const links = v._links.map((link: any, i: any) => {
    const check = [v._linksSource, v._linksTarget];
    const linkLookup = check.reduce((result: any, item: any) => {
      result[item] = nodeLookup[link[item]];
      return result;
    }, {});
    return {
      source: linkLookup[v._linksSource],
      target: linkLookup[v._linksTarget],
      value: v._value(link, i),
    };
  });

  v._linkLookup = links.reduce((obj: any, d: any) => {
    if (!obj[d.source]) obj[d.source] = [];
    obj[d.source].push(d.target);
    if (!obj[d.target]) obj[d.target] = [];
    obj[d.target].push(d.source);
    return obj;
  }, {});

  v._sankey
    .nodeAlign(v._nodeAlign)
    .nodePadding(v._nodePadding)
    .nodeWidth(v._nodeWidth)
    .nodes(nodes)
    .nodeSort(v._nodeSort)
    .links(links)
    .linkSort(v._linkSort)
    .iterations(v._iterations)
    .size([width, height])();

  const nodeGroups = Array.from(
    groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ),
  );
  v._sankeyCtx = {links, nodeGroups, pathFn: v._path};

  return {shapeData: nodes};
};

/**
    `sankeyDef.emit` — link Paths + per-shape-type node groups (typically
    Rect). The layout stage stashes `links`/`nodeGroups`/`pathFn` on
    `viz._sankeyCtx`.
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
  stages: [...vizPreDrawStages, applySankeyLayout],
  emit: sankeyEmit,
};

/**
    Converts a topojson object into a feature collection for projection.
    Local helper for `applyGeomapLayout`.
*/
function topo2feature(
  topo: Record<string, unknown>,
  key?: string,
): {type: string; features: Record<string, unknown>[]} {
  const k =
    key && (topo.objects as Record<string, unknown>)[key]
      ? key
      : Object.keys(topo.objects as Record<string, unknown>)[0];
  return topojsonFeature(
    topo as unknown as Parameters<typeof topojsonFeature>[0],
    k,
  ) as unknown as {type: string; features: Record<string, unknown>[]};
}

/**
    `applyGeomapLayout` — Geomap's chart-specific layout stage. Mirrors the
    other apply* stages: pure transformation of viz state into the
    `_geomapCtx` (topoData/pathFn + pointData/pointR/pointX/pointY/pointSort)
    that `geomapDef.emit` consumes.

    Runs the topojson → feature conversion + topojson filter, builds the
    d3-geo path generator against `_projection`, computes the fit-extent
    bounds (`_extentBounds`) the first time through (gated by the class's
    `_zoomSet` flag — the class flips it after wiring `_zoomBehavior`),
    fits the projection, and stashes the per-row r/x/y accessors that
    emit's Circle reads. Zoom + tile rendering remain in the class
    (DOM/lifecycle); this stage is compute-only.
*/
export const applyGeomapLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const height = v._height - v._margin.top - v._margin.bottom;
  const width = v._width - v._margin.left - v._margin.right;

  const coordData: {type: string; features: Record<string, unknown>[]} =
    (v._coordData = v._topojson
      ? topo2feature(v._topojson, v._topojsonKey)
      : {type: "FeatureCollection", features: []});

  if (v._topojsonFilter)
    coordData.features = coordData.features.filter(v._topojsonFilter);

  const path = (v._path = (d3Geo.geoPath as any)().projection(v._projection));

  const pointData = v._filteredData.filter(
    (d: DataPoint, i: number) => v._point(d, i) instanceof Array,
  );

  const pathData = v._filteredData
    .filter((d: DataPoint, i: number) => !(v._point(d, i) instanceof Array))
    .reduce((obj: Record<string, DataPoint>, d: DataPoint) => {
      obj[v._id(d)] = d;
      return obj;
    }, {});

  const topoData = coordData.features.reduce(
    (arr: Record<string, unknown>[], feature: Record<string, unknown>) => {
      const id = v._topojsonId(feature);
      arr.push({
        __d3plus__: true,
        data: pathData[id],
        feature,
        id,
      });
      return arr;
    },
    [],
  );

  const scaleName = `scale${v._pointSizeScale.charAt(0).toUpperCase()}${v._pointSizeScale.slice(1)}`;
  const r = (scales as any)[scaleName]()
    .domain(extent(pointData, (d: DataPoint, i: number) => v._pointSize(d, i)))
    .range([v._pointSizeMin, v._pointSizeMax]);

  if (!v._zoomSet) {
    const fitData = v._fitObject
      ? topo2feature(v._fitObject, v._fitKey)
      : coordData;

    v._extentBounds = {
      type: "FeatureCollection",
      features: v._fitFilter
        ? fitData.features.filter(v._fitFilter)
        : fitData.features.slice(),
    };
    v._extentBounds.features = v._extentBounds.features.reduce(
      (
        arr: Record<string, unknown>[],
        d: {
          type: string;
          id: string;
          geometry: {type: string; coordinates: number[][][][]};
        },
      ) => {
        if (d.geometry) {
          const reduced: {
            type: string;
            id: string;
            geometry: {type: string; coordinates: number[][][][]};
          } = {
            type: d.type,
            id: d.id,
            geometry: {
              coordinates: d.geometry.coordinates,
              type: d.geometry.type,
            },
          };

          if (
            d.geometry.type === "MultiPolygon" &&
            d.geometry.coordinates.length > 1
          ) {
            const areas: number[] = [],
              distances: number[] = [];

            d.geometry.coordinates.forEach((c: number[][][]) => {
              reduced.geometry.coordinates = [c];
              areas.push(path.area(reduced));
            });

            reduced.geometry.coordinates = [
              d.geometry.coordinates[areas.indexOf(max(areas)!)],
            ];
            const center = path.centroid(reduced);

            d.geometry.coordinates.forEach((c: number[][][]) => {
              reduced.geometry.coordinates = [c];
              distances.push(pointDistance(path.centroid(reduced), center));
            });

            const distCutoff = quantile(
              areas.reduce((arr: number[], dist: number, i: number) => {
                if (dist) arr.push(areas[i] / dist);
                return arr;
              }, []),
              0.9,
            );

            reduced.geometry.coordinates = d.geometry.coordinates.filter(
              (c: number[][][], i: number) => {
                const dist = distances[i];
                return dist === 0 || areas[i] / dist >= distCutoff!;
              },
            );
          }

          arr.push(reduced);
        }
        return arr;
      },
      [],
    );

    if (!v._extentBounds.features.length && pointData.length) {
      const bounds: (number | undefined)[][] = [
        [undefined, undefined],
        [undefined, undefined],
      ];
      pointData.forEach((d: DataPoint, i: number) => {
        const point = v._projection(v._point(d, i));
        if (bounds[0][0] === void 0 || point[0] < bounds[0][0])
          bounds[0][0] = point[0];
        if (bounds[1][0] === void 0 || point[0] > bounds[1][0])
          bounds[1][0] = point[0];
        if (bounds[0][1] === void 0 || point[1] < bounds[0][1])
          bounds[0][1] = point[1];
        if (bounds[1][1] === void 0 || point[1] > bounds[1][1])
          bounds[1][1] = point[1];
      });

      v._extentBounds = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "MultiPoint",
              coordinates: bounds.map((b: (number | undefined)[]) =>
                v._projection.invert(b),
              ),
            },
          },
        ],
      };
      const maxSize = max(pointData, (d: DataPoint, i: number) =>
        r(v._pointSize(d, i)),
      );
      v._projectionPadding.top += maxSize;
      v._projectionPadding.right += maxSize;
      v._projectionPadding.bottom += maxSize;
      v._projectionPadding.left += maxSize;
    }
  }

  v._projection = v._projection.fitExtent(
    v._extentBounds.features.length
      ? [
          [v._projectionPadding.left, v._projectionPadding.top],
          [
            width - v._projectionPadding.right,
            height - v._projectionPadding.bottom,
          ],
        ]
      : [
          [0, 0],
          [width, height],
        ],
    v._extentBounds.features.length
      ? v._extentBounds
      : {type: "Sphere"},
  );

  // Stash dimensions for the class's zoom-extent setup.
  v._geomapWidth = width;
  v._geomapHeight = height;

  v._geomapCtx = {
    topoData,
    pathFn: (d: Record<string, unknown>) => path(d.feature),
    pointData,
    pointR: ((d: DataPoint, i: number) => r(v._pointSize(d, i))) as any,
    pointSort: (a: DataPoint, b: DataPoint) =>
      v._pointSize(b) - v._pointSize(a),
    pointX: ((d: DataPoint, i: number) =>
      v._projection(v._point(d, i))[0]) as any,
    pointY: ((d: DataPoint, i: number) =>
      v._projection(v._point(d, i))[1]) as any,
  };

  return {shapeData: topoData};
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
  stages: [...vizPreDrawStages, applyGeomapLayout],
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
  const barConfig = shapeConfigFor(viz, "Bar");
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

  const userConfig = shapeConfigFor(viz, "Line");
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
  emit: plotShapesEmit,
};
