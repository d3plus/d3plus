/**
    Geomap — d3-geo projection + tile rendering + topojson paths.

    Implementation files in this folder:
      - `applyLayout.ts` — topojson + projection + path/point compute.
      - `emit.ts` — country Paths + point Circles.
*/

import {color} from "d3-color";
import {select} from "d3-selection";
import {zoomTransform} from "d3-zoom";
import {tile} from "d3-tile";
import * as d3GeoCore from "d3-geo";
import * as d3GeoProjection from "d3-geo-projection";
import * as d3CompositeProjections from "d3-composite-projections";

const d3Geo: Record<string, (...args: unknown[]) => unknown> = Object.assign(
  {},
  d3GeoCore,
  d3GeoProjection,
  d3CompositeProjections,
);

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {parseSides} from "@d3plus/dom";

import accessor from "../../utils/accessor.js";
import attributions from "../helpers/tileAttributions.js";
import constant from "../../utils/constant.js";
import {chartBounds} from "../features/chartGeometry.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {ensureZoomDom} from "../features/ensureZoomDom.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyGeomapLayout} from "./applyLayout.js";
import {geomapEmit} from "./emit.js";

type GeomapFluent = {
  fitFilter: (_?: unknown) => unknown;
  fitKey: (_?: unknown) => unknown;
  fitObject: (_?: unknown, f?: unknown) => unknown;
  point: (_?: unknown) => unknown;
  pointSize: (_?: unknown) => unknown;
  projection: (_?: unknown) => unknown;
  projectionPadding: (_?: unknown) => unknown;
  projectionRotate: (_?: unknown) => unknown;
  tiles: (_?: unknown) => unknown;
  tileUrl: (_?: unknown) => unknown;
  topojson: (_?: unknown, f?: unknown) => unknown;
  topojsonFill: (_?: unknown) => unknown;
  topojsonFilter: (_?: unknown) => unknown;
  topojsonKey: (_?: unknown) => unknown;
  topojsonId: (_?: unknown) => unknown;
};

function findAttribution(url: string): string | false {
  const a = attributions.find((d: {matches: string[]; text: string}) =>
    d.matches.some((m: string) => url.includes(m)),
  );
  return a ? a.text : false;
}

/** Installs `_renderTiles`, the per-instance method that mutates the tile group. */
function setupGeomapRenderTiles(viz: VizInstance): void {
  // `_renderTiles` is a per-instance method that mutates the tile group.
  viz._renderTiles = function(
    this: VizInstance,
    transform: ReturnType<typeof zoomTransform> = zoomTransform((this._zoomEventTarget || this._container)!.node()),
    duration: number = 0,
  ): void {
    // Under SSR the basemap is composited into the scene graph (see geomapEmit +
    // `_computeTileList`), so skip the imperative <image> tile layer entirely.
    // It wouldn't be serialized anyway, and its transform transition relies on
    // SVGGElement.transform.baseVal, which headless DOMs don't implement.
    if (this._ssr) return;
    let tileData: number[][] & {scale?: number; translate?: number[]} =
      [] as unknown as number[][] & {scale?: number; translate?: number[]};
    if (this.schema.tiles) {
      tileData = this._tileGen
        .extent(this._zoomBehavior.translateExtent())
        .scale(this.schema.projection.scale() * (2 * Math.PI) * transform.k)
        .translate(transform.apply(this.schema.projection.translate()))();
      this._tileGroup!.transition().duration(duration).attr("transform", transform);
    }
    const images = this._tileGroup!
      .selectAll("image.d3plus-geomap-tile")
      .data(tileData, ([x, y, z]: [number, number, number]) => `${x}-${y}-${z}`);
    images.exit().transition().duration(duration).attr("opacity", 0).remove();
    const scale = tileData.scale! / transform.k;
    const tileEnter = images.enter().append("image").attr("class", "d3plus-geomap-tile");
    tileEnter.attr("opacity", 0).transition().duration(duration).attr("opacity", 1);
    images.merge(tileEnter)
      .attr("width", scale)
      .attr("height", scale)
      .attr("xlink:href", ([x, y, z]: [number, number, number]) =>
        this.schema.tileUrl
          .replace("{s}", ["a", "b", "c"][(Math.random() * 3) | 0])
          .replace("{z}", `${z}`)
          .replace("{x}", `${x}`)
          .replace("{y}", `${y}`),
      )
      .attr("x", ([x]: [number]) =>
        x * scale + tileData.translate![0] * scale - transform.x / transform.k)
      .attr("y", ([, y]: [number, number]) =>
        y * scale + tileData.translate![1] * scale - transform.y / transform.k);
  };

  // Static (identity-transform) tile list for server-side rendering: the tile
  // URLs + their positions in projection pixel space, so @d3plus/ssr can fetch
  // them and geomapEmit can place them as scene image nodes (both SVG string and
  // canvas output then include the basemap, with no network at view time).
  // Deterministic `{s}` = "a" so tiles are cacheable across renders.
  viz._computeTileList = function(
    this: VizInstance,
  ): Array<{key: string; url: string; x: number; y: number; size: number}> {
    if (!this.schema.tiles) return [];
    const tileData = this._tileGen
      .extent(this._zoomBehavior.translateExtent())
      .scale(this.schema.projection.scale() * (2 * Math.PI))
      .translate(this.schema.projection.translate())();
    const size: number = tileData.scale;
    return (tileData as number[][]).map(([x, y, z]) => ({
      key: `${x}-${y}-${z}`,
      url: this.schema.tileUrl
        .replace("{s}", "a")
        .replace("{z}", `${z}`)
        .replace("{x}", `${x}`)
        .replace("{y}", `${y}`),
      x: x * size + tileData.translate![0] * size,
      y: y * size + tileData.translate![1] * size,
      size,
    }));
  };
}

/** Wraps `_draw` to ensure the DOM zoom group + zoom wiring exist before drawing. */
function setupGeomapDraw(viz: VizInstance): void {
  // Wrap _draw to ensure DOM zoom group + zoom wiring.
  const supDraw = viz._draw.bind(viz);
  viz._draw = function(callback?: () => void) {
    // SVG backend: the geography paints into the scene <svg>, which sits above
    // the imperative geomap <svg> that d3-zoom binds to by default — so wheel/
    // dblclick/pan over a shape never reach that target; only the transparent
    // ocean falls through. Bind zoom to the outer <svg> instead: it's an
    // ancestor of both, so it receives events over the geography (bubbling up
    // from the scene svg) and the ocean (from the geomap svg). Setting the
    // target before the wrapped draw lets `zoomEvents` bind it directly (with
    // its zoomScroll/zoomPan disabling); clear any stale handler on the geomap
    // svg so an ocean event isn't zoomed twice. (Canvas keeps its own target —
    // the <canvas>, set in `_drawSceneToTarget`.)
    if (viz._renderer !== "canvas" && viz._select) {
      viz._zoomEventTarget = viz._select;
      if (viz._container) viz._container.on(".zoom", null);
    }
    const result = supDraw(callback);
    const {width, height} = chartBounds(viz);
    ensureZoomDom(viz, {
      kind: "geomap",
      width,
      height,
      duration: viz.schema.duration,
      // On the canvas backend this imperative ocean rect lives in the compute
      // <svg>, which overlays the <canvas> and would hide the geography. Keep
      // it transparent there; geomapEmit paints the ocean into the scene (and
      // thus onto the canvas) beneath the geography instead.
      ocean: viz._renderer === "canvas" ? "transparent" : viz.schema.ocean,
    });
    if (!viz._zoomSet) {
      viz._zoomBehavior
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, viz.schema.zoomMax])
        .translateExtent([[0, 0], [width, height]]);
      viz._zoomSet = true;
    }
    return result;
  };

  // On the Canvas backend the geography is painted on the <canvas>, but the
  // compute <svg> (`_container`, holding the transparent ocean rect) is
  // absolutely positioned and paints above it — intercepting the pointer
  // events the canvas needs for hover/pick, so tooltips never fired. After the
  // scene is painted (when the canvas exists), make that svg transparent to
  // pointer events and move d3-zoom onto the canvas, so the canvas is the sole
  // interaction surface: CanvasRenderer's pick drives tooltips and d3-zoom
  // drives pan/zoom on the same element. (On SVG this is a no-op — the scene
  // svg already sits on top and handles both.)
  const supDrawScene = viz._drawSceneToTarget.bind(viz);
  viz._drawSceneToTarget = function(durationOverride?: number) {
    supDrawScene(durationOverride);
    if (
      viz._renderer === "canvas" &&
      // Under SSR the canvas is a headless native surface with no
      // addEventListener; there is no interaction to wire, so skip the
      // pointer/zoom rebind entirely.
      !viz._ssr &&
      viz._sceneRenderer &&
      typeof viz._sceneRenderer.toCanvas === "function"
    ) {
      const canvasNode = viz._sceneRenderer.toCanvas();
      if (canvasNode) {
        // The compute svg is absolutely positioned over the canvas; an svg root
        // hit-tests its whole box, so even an empty one swallows the canvas's
        // pointer events. The canvas is the sole render + interaction surface in
        // canvas mode, so make the entire compute svg transparent to events.
        if (viz._select) viz._select.style("pointer-events", "none");
        if (viz._container) viz._container.style("pointer-events", "none");
        viz._zoomEventTarget = select(canvasNode);
        if (viz.schema.zoom && !viz._brushing)
          viz._zoomEventTarget.call(viz._zoomBehavior);
      }
    }
  };
}

/** Installs the imperative fluent accessors on the Geomap instance. */
function setupGeomapFluent(viz: VizInstance): void {
  // Imperative fluent accessors. Parameter type is `unknown` since each
  // method accepts a function or a value (or for fitFilter/topojsonFilter,
  // also an array of ids). Each branch narrows with typeof / instanceof.
  setupGeomapFitFluent(viz);
  setupGeomapProjectionFluent(viz);
  setupGeomapTileFluent(viz);
  setupGeomapTopojsonFluent(viz);
}

/** Installs the fit/point fluent accessors. */
function setupGeomapFitFluent(viz: VizInstance): void {
  const v = viz as VizInstance & GeomapFluent;
  v.fitFilter = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") {
        this.schema.fitFilter = _ as (d: Record<string, unknown>) => boolean;
        return this;
      }
      const ids = (_ instanceof Array ? _ : [_]) as string[];
      this.schema.fitFilter = (d: Record<string, unknown>) => ids.includes(d.id as string);
      return this;
    }
    return this.schema.fitFilter;
  };
  v.fitKey = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this.schema.fitKey = _ as string | undefined;
      this._zoomSet = false;
      return this;
    }
    return this.schema.fitKey;
  };
  v.fitObject = function(this: VizInstance, _?: unknown, f?: unknown) {
    if (arguments.length) {
      (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(_, f, "fitObject");
      this._zoomSet = false;
      return this;
    }
    return this.schema.fitObject;
  };
  v.point = function(this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.point = typeof _ === "function" ? (_ as (...a: unknown[]) => unknown) : constant(_)), this)
      : this.schema.point;
  };
  v.pointSize = function(this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.pointSize = typeof _ === "function" ? (_ as (...a: unknown[]) => unknown) : constant(_)), this)
      : this.schema.pointSize;
  };
}

/** Installs the projection fluent accessors. */
function setupGeomapProjectionFluent(viz: VizInstance): void {
  const v = viz as VizInstance & GeomapFluent;
  v.projection = function(this: VizInstance, _?: unknown) {
    if (arguments.length && _ !== "geoMercator") v.tiles(false);
    return arguments.length
      ? ((this.schema.projection =
          typeof _ === "string"
            ? d3Geo[_]
              ? d3Geo[_]()
              : d3Geo.geoMercator()
            : _),
        this)
      : this.schema.projection;
  };
  v.projectionPadding = function(this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.projectionPadding = parseSides(_ as Parameters<typeof parseSides>[0])), this)
      : this.schema.projectionPadding;
  };
  v.projectionRotate = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this.schema.projection.rotate(_);
      v.tiles(false);
      this._zoomSet = false;
      return this;
    }
    return this.schema.projectionRotate;
  };
}

/** Installs the tile fluent accessors. */
function setupGeomapTileFluent(viz: VizInstance): void {
  const v = viz as VizInstance & GeomapFluent;
  v.tiles = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this.schema.tiles = _ as boolean;
      const attribution = findAttribution(this.schema.tileUrl);
      if (_ && this.schema.attribution === "") this.schema.attribution = attribution as string;
      else if (!_ && this.schema.attribution === attribution) this.schema.attribution = "";
      return this;
    }
    return this.schema.tiles;
  };
  v.tileUrl = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this.schema.tileUrl = _ as string;
      if (this.schema.tiles) this.schema.attribution = findAttribution(_ as string) as string;
      if (this._tileGroup) this._renderTiles!.bind(this)();
      return this;
    }
    return this.schema.tileUrl;
  };
}

/** Installs the topojson fluent accessors. */
function setupGeomapTopojsonFluent(viz: VizInstance): void {
  const v = viz as VizInstance & GeomapFluent;
  v.topojson = function(this: VizInstance, _?: unknown, f?: unknown) {
    if (arguments.length) {
      (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(_, f, "topojson");
      this._zoomSet = false;
      return this;
    }
    return this.schema.topojson;
  };
  v.topojsonFill = function(this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.topojsonFill = typeof _ === "function" ? (_ as (...a: unknown[]) => unknown) : constant(_)), this)
      : this.schema.topojsonFill;
  };
  v.topojsonFilter = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") {
        this.schema.topojsonFilter = _ as (d: Record<string, unknown>) => boolean;
        return this;
      }
      const ids = (_ instanceof Array ? _ : [_]) as string[];
      this.schema.topojsonFilter = (d: Record<string, unknown>) => ids.includes(d.id as string);
      return this;
    }
    return this.schema.topojsonFilter;
  };
  v.topojsonKey = function(this: VizInstance, _?: unknown) {
    if (arguments.length) {
      this.schema.topojsonKey = _ as string | undefined;
      this._zoomSet = false;
      return this;
    }
    return this.schema.topojsonKey;
  };
  v.topojsonId = function(this: VizInstance, _?: unknown) {
    return arguments.length
      ? ((this.schema.topojsonId = typeof _ === "function" ? (_ as (...a: unknown[]) => unknown) : accessor(_ as string)), this)
      : this.schema.topojsonId;
  };
}

export const geomapDef: ChartDefinition = {
  name: "Geomap",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyGeomapLayout,
  emit: geomapEmit,

  // Geomap positions in absolute projection coordinates — no chart transform.
  chartTransform: () => undefined,

  // Clip the geography to the map rectangle — the same box as the ocean rect and
  // the imperative inner <svg> viewport — so projected paths and points can't
  // spill past it (e.g. under the legend/timeline) when a `fitObject`/zoom pushes
  // features outside the fitted extent. The clip lives on the untransformed
  // chart-cells group, so it stays fixed while pan/zoom moves the map beneath it.
  chartClip: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    return {type: "rect", x: viz._margin.left, y: viz._margin.top, width, height};
  },

  setup: (viz: VizInstance) => {
    const v = viz as VizInstance & GeomapFluent;
    viz.schema.zoom = true;
    viz._zoomSet = false;
    viz.schema.tiles = true;
    viz._tileGen = tile();

    setupGeomapRenderTiles(viz);
    setupGeomapDraw(viz);
    setupGeomapFluent(viz);

    // Seed the default tile URL through the wrapped accessor so attribution is set.
    v.tileUrl(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png",
    );
  },

  ctx: {},

  fields: [
    {key: "fitObject", default: false},
    {key: "noDataMessage", default: false},
    {key: "ocean", default: "#d4dadc"},
    {key: "point", default: accessor("point")},
    {key: "pointSize", default: constant(1)},
    {key: "pointSizeMax", default: 10},
    {key: "pointSizeMin", default: 5},
    {key: "pointSizeScale", default: "linear"},
    {key: "projection", default: d3Geo.geoMercator()},
    {key: "projectionPadding", default: parseSides(20)},
    {key: "shape", default: constant("Circle"), coerce: "const"},
    {key: "topojson", default: false},
    {key: "topojsonFill", default: constant("#f5f5f3")},
    {
      key: "topojsonFilter",
      default: (d: Record<string, unknown>) => !["010"].includes(d.id as string),
    },
    {key: "topojsonId", default: accessor("id")},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) =>
          `${viz._drawLabel(d, i)}, ${(viz.schema.pointSize as (d: DataPoint, i: number) => unknown)(d, i)}`,
        hoverOpacity: 1,
        Path: {
          ariaLabel: (d: DataPoint, i: number) => {
            const cs = viz.schema.colorScale as ((d: DataPoint, i: number) => unknown) | undefined;
            const validColorScale = cs ? `, ${cs(d, i)}` : "";
            return `${viz._drawLabel(d, i)}${validColorScale}.`;
          },
          fill: (d: DataPoint, i: number) => {
            const coordFeatures = (viz.ctx.coordData as {features: DataPoint[]} | undefined)?.features ?? [];
            const cs = viz.schema.colorScale as ((d: DataPoint) => unknown) | undefined;
            if (cs && !coordFeatures.includes(d)) {
              const c = cs(d);
              if (c !== undefined && c !== null) {
                if (viz._colorScaleClass!._colorScale)
                  return viz._colorScaleClass!._colorScale(c as number);
                let col = viz._colorScaleClass!.color();
                if (col instanceof Array) col = col[col.length - 1];
                return col;
              }
            }
            return (viz.schema.topojsonFill as (d: DataPoint, i: number) => unknown)(d, i);
          },
          on: {
            mouseenter: (d: DataPoint, i: number, x: DataPoint, event: MouseEvent) => {
              const coordFeatures = (viz.ctx.coordData as {features: DataPoint[]} | undefined)?.features ?? [];
              return !coordFeatures.includes(d)
                ? viz.schema.on.mouseenter.bind(viz)(d, i, x, event)
                : null;
            },
            "mousemove.shape": (d: DataPoint, i: number, x: DataPoint, event: MouseEvent) => {
              const coordFeatures = (viz.ctx.coordData as {features: DataPoint[]} | undefined)?.features ?? [];
              return !coordFeatures.includes(d)
                ? viz.schema.on["mousemove.shape"].bind(viz)(d, i, x, event)
                : null;
            },
            mouseleave: (d: DataPoint, i: number, x: DataPoint, event: MouseEvent) => {
              const coordFeatures = (viz.ctx.coordData as {features: DataPoint[]} | undefined)?.features ?? [];
              return !coordFeatures.includes(d)
                ? viz.schema.on.mouseleave.bind(viz)(d, i, x, event)
                : null;
            },
          },
          stroke: (d: DataPoint, i: number) => {
            const sc = viz.schema.shapeConfig.Path as Record<string, unknown>;
            const c = typeof sc.fill === "function"
              ? (sc.fill as (d: DataPoint, i: number) => unknown)(d, i)
              : sc.fill;
            const col = color(c as string);
            return col ? col.darker() : (c as string);
          },
          strokeWidth: 1,
        },
        // Coordinate points (Circles) leave a motion trail when they move
        // between frames (e.g. Timeline play); opt out with Circle.trail: false.
        Circle: {trail: true},
      }),
    },
  ],
};

/**
    Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points.
*/
export default makeChart(geomapDef);
