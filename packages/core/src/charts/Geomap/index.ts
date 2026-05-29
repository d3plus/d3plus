/**
    Geomap — d3-geo projection + tile rendering + topojson paths.

    Implementation files in this folder:
      - `applyLayout.ts` — topojson + projection + path/point compute.
      - `emit.ts` — country Paths + point Circles.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

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
    viz._zoom = true;
    viz._zoomSet = false;
    viz._tiles = true;
    viz._tileGen = tile();

    // `_renderTiles` is a per-instance method that mutates the tile group.
    (viz as any)._renderTiles = function(
      this: VizInstance,
      transform: ReturnType<typeof zoomTransform> = zoomTransform(this._container.node()),
      duration: number = 0,
    ): void {
      let tileData: number[][] & {scale?: number; translate?: number[]} =
        [] as unknown as number[][] & {scale?: number; translate?: number[]};
      if (this._tiles) {
        tileData = this._tileGen
          .extent(this._zoomBehavior.translateExtent())
          .scale(this._projection.scale() * (2 * Math.PI) * transform.k)
          .translate(transform.apply(this._projection.translate()))();
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
          this._tileUrl
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
    const supDraw = (viz as any)._draw.bind(viz);
    (viz as any)._draw = function(callback?: () => void) {
      const result = supDraw(callback);
      const {width, height} = chartBounds(viz);
      ensureZoomDom(viz, {
        kind: "geomap",
        width,
        height,
        duration: viz._duration,
        ocean: viz._ocean,
      });
      if (!viz._zoomSet) {
        viz._zoomBehavior
          .extent([[0, 0], [width, height]])
          .scaleExtent([1, viz._zoomMax])
          .translateExtent([[0, 0], [width, height]]);
        viz._zoomSet = true;
      }
      return result;
    };

    // Imperative fluent accessors.
    (viz as any).fitFilter = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._zoomSet = false;
        if (typeof _ === "function") return ((this._fitFilter = _), this);
        if (!(_ instanceof Array)) _ = [_];
        this._fitFilter = (d: Record<string, unknown>) =>
          (_ as string[]).includes(d.id as string);
        return this;
      }
      return this._fitFilter;
    };
    (viz as any).fitKey = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._fitKey = _;
        this._zoomSet = false;
        return this;
      }
      return this._fitKey;
    };
    (viz as any).fitObject = function(this: VizInstance, _?: any, f?: any) {
      if (arguments.length) {
        (addToQueue as any).bind(this)(_, f, "fitObject");
        this._zoomSet = false;
        return this;
      }
      return this._fitObject;
    };
    (viz as any).point = function(this: VizInstance, _?: any) {
      return arguments.length
        ? ((this._point = typeof _ === "function" ? _ : constant(_)), this)
        : this._point;
    };
    (viz as any).pointSize = function(this: VizInstance, _?: any) {
      return arguments.length
        ? ((this._pointSize = typeof _ === "function" ? _ : constant(_)), this)
        : this._pointSize;
    };
    (viz as any).projection = function(this: VizInstance, _?: any) {
      if (arguments.length && _ !== "geoMercator") (this as any).tiles(false);
      return arguments.length
        ? ((this._projection =
            typeof _ === "string"
              ? d3Geo[_]
                ? d3Geo[_]()
                : d3Geo.geoMercator()
              : _),
          this)
        : this._projection;
    };
    (viz as any).projectionPadding = function(this: VizInstance, _?: any) {
      return arguments.length
        ? ((this._projectionPadding = parseSides(_)), this)
        : this._projectionPadding;
    };
    (viz as any).projectionRotate = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._projection.rotate(_);
        (this as any).tiles(false);
        this._zoomSet = false;
        return this;
      }
      return this._projectionRotate;
    };
    (viz as any).tiles = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._tiles = _;
        const attribution = findAttribution(this._tileUrl);
        if (_ && this._attribution === "") this._attribution = attribution as string;
        else if (!_ && this._attribution === attribution) this._attribution = "";
        return this;
      }
      return this._tiles;
    };
    (viz as any).tileUrl = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._tileUrl = _;
        if (this._tiles) this._attribution = findAttribution(_) as string;
        if (this._tileGroup) (this as any)._renderTiles.bind(this)();
        return this;
      }
      return this._tileUrl;
    };
    (viz as any).topojson = function(this: VizInstance, _?: any, f?: any) {
      if (arguments.length) {
        (addToQueue as any).bind(this)(_, f, "topojson");
        this._zoomSet = false;
        return this;
      }
      return this._topojson;
    };
    (viz as any).topojsonFill = function(this: VizInstance, _?: any) {
      return arguments.length
        ? ((this._topojsonFill = typeof _ === "function" ? _ : constant(_)), this)
        : this._topojsonFill;
    };
    (viz as any).topojsonFilter = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._zoomSet = false;
        if (typeof _ === "function") return ((this._topojsonFilter = _), this);
        if (!(_ instanceof Array)) _ = [_];
        this._topojsonFilter = (d: Record<string, unknown>) =>
          (_ as string[]).includes(d.id as string);
        return this;
      }
      return this._topojsonFilter;
    };
    (viz as any).topojsonKey = function(this: VizInstance, _?: any) {
      if (arguments.length) {
        this._topojsonKey = _;
        this._zoomSet = false;
        return this;
      }
      return this._topojsonKey;
    };
    (viz as any).topojsonId = function(this: VizInstance, _?: any) {
      return arguments.length
        ? ((this._topojsonId = typeof _ === "function" ? _ : accessor(_)), this)
        : this._topojsonId;
    };

    // Seed the default tile URL through the wrapped accessor so attribution is set.
    (viz as any).tileUrl(
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
          `${viz._drawLabel(d, i)}, ${(viz._pointSize as (d: DataPoint, i: number) => unknown)(d, i)}`,
        hoverOpacity: 1,
        Path: {
          ariaLabel: (d: DataPoint, i: number) => {
            const validColorScale = viz._colorScale ? `, ${(viz._colorScale as any)(d, i)}` : "";
            return `${viz._drawLabel(d, i)}${validColorScale}.`;
          },
          fill: (d: DataPoint, i: number) => {
            if (viz._colorScale && !(viz.ctx.coordData as any).features.includes(d)) {
              const c = (viz._colorScale as any)(d);
              if (c !== undefined && c !== null) {
                if (viz._colorScaleClass._colorScale) return viz._colorScaleClass._colorScale(c);
                let col = viz._colorScaleClass.color();
                if (col instanceof Array) col = col[col.length - 1];
                return col;
              }
            }
            return (viz._topojsonFill as any)(d, i);
          },
          on: {
            mouseenter: (d: DataPoint, i: number, x: DataPoint, event: MouseEvent) =>
              !(viz.ctx.coordData as any).features.includes(d)
                ? viz._on.mouseenter.bind(viz)(d, i, x, event)
                : null,
            "mousemove.shape": (d: DataPoint, i: number, x: DataPoint, event: MouseEvent) =>
              !(viz.ctx.coordData as any).features.includes(d)
                ? viz._on["mousemove.shape"].bind(viz)(d, i, x, event)
                : null,
            mouseleave: (d: DataPoint, i: number, x: DataPoint, event: MouseEvent) =>
              !(viz.ctx.coordData as any).features.includes(d)
                ? viz._on.mouseleave.bind(viz)(d, i, x, event)
                : null,
          },
          stroke: (d: DataPoint, i: number) => {
            const sc = viz._shapeConfig.Path as Record<string, unknown>;
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
