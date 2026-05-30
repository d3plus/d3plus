/**
    Geomap — d3-geo projection + tile rendering + topojson paths.

    Implementation files in this folder:
      - `applyLayout.ts` — topojson + projection + path/point compute.
      - `emit.ts` — country Paths + point Circles.
*/

import {color} from "d3-color";
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
import {chartBounds} from "../chartGeometry.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {ensureZoomDom} from "../ensureZoomDom.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applyGeomapLayout} from "./applyLayout.js";
import {geomapEmit} from "./emit.js";

function findAttribution(url: string): string | false {
  const a = attributions.find((d: {matches: string[]; text: string}) =>
    d.matches.some((m: string) => url.includes(m)),
  );
  return a ? a.text : false;
}

export const geomapDef: ChartDefinition = {
  name: "Geomap",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyGeomapLayout],
  layoutStage: applyGeomapLayout,
  emit: geomapEmit,

  // Geomap positions in absolute projection coordinates — no chart transform.
  chartTransform: () => undefined,

  setup: (viz: VizInstance) => {
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
    const v = viz as VizInstance & GeomapFluent;
    viz.schema.zoom = true;
    viz._zoomSet = false;
    viz.schema.tiles = true;
    viz._tileGen = tile();

    // `_renderTiles` is a per-instance method that mutates the tile group.
    viz._renderTiles = function(
      this: VizInstance,
      transform: ReturnType<typeof zoomTransform> = zoomTransform(this._container.node()),
      duration: number = 0,
    ): void {
      let tileData: number[][] & {scale?: number; translate?: number[]} =
        [] as unknown as number[][] & {scale?: number; translate?: number[]};
      if (this.schema.tiles) {
        tileData = this._tileGen
          .extent(this._zoomBehavior.translateExtent())
          .scale(this.schema.projection.scale() * (2 * Math.PI) * transform.k)
          .translate(transform.apply(this.schema.projection.translate()))();
        this._tileGroup.transition().duration(duration).attr("transform", transform);
      }
      const images = this._tileGroup
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

    // Wrap _draw to ensure DOM zoom group + zoom wiring.
    const supDraw = viz._draw.bind(viz);
    viz._draw = function(callback?: () => void) {
      const result = supDraw(callback);
      const {width, height} = chartBounds(viz);
      ensureZoomDom(viz, {
        kind: "geomap",
        width,
        height,
        duration: viz.schema.duration,
        ocean: viz.schema.ocean,
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

    // Imperative fluent accessors. Parameter type is `unknown` since each
    // method accepts a function or a value (or for fitFilter/topojsonFilter,
    // also an array of ids). Each branch narrows with typeof / instanceof.
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
    {key: "shape", default: constant("Circle")},
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
                if (viz._colorScaleClass._colorScale) return viz._colorScaleClass._colorScale(c);
                let col = viz._colorScaleClass.color();
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
            return color(c as string)!.darker();
          },
          strokeWidth: 1,
        },
      }),
    },
  ],
};

export default makeChart(geomapDef);
