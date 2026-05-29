import {color} from "d3-color";
import {zoomTransform} from "d3-zoom";

import * as d3GeoCore from "d3-geo";
import * as d3GeoProjection from "d3-geo-projection";
import * as d3CompositeProjections from "d3-composite-projections";
const d3Geo: Record<string, (...args: unknown[]) => unknown> = Object.assign(
  {},
  d3GeoCore,
  d3GeoProjection,
  d3CompositeProjections,
);

import {tile} from "d3-tile";

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {assign, parseSides} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";

import {applyGeomapLayout, geomapDef} from "./ChartDefinition.js";
import {chartBounds} from "./chartGeometry.js";
import {ensureZoomDom} from "./ensureZoomDom.js";
import {runChartDraw} from "./runChartDraw.js";
import Viz from "./Viz.js";
import attributions from "./helpers/tileAttributions.js";

/**
 * @name findAttribution
 * @param {String} url
 * @private
 */
function findAttribution(url: string): string | false {
  const a = attributions.find((d: {matches: string[]; text: string}) =>
    d.matches.some((m: string) => url.includes(m)),
  );
  return a ? a.text : false;
}

/**
    Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points. See [this example](https://d3plus.org/examples/d3plus-geomap/getting-started/) for help getting started.
*/
export default class Geomap extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();

    // E3: scalar defaults sourced from geomapDef.
    this._fitObject = geomapDef.defaults.fitObject as false;
    this._noDataMessage = geomapDef.defaults.noDataMessage as false;
    this._ocean = geomapDef.defaults.ocean as string;

    this._point = geomapDef.defaults.point;
    this._pointSize = geomapDef.defaults.pointSize;
    this._pointSizeMax = geomapDef.defaults.pointSizeMax as number;
    this._pointSizeMin = geomapDef.defaults.pointSizeMin as number;
    this._pointSizeScale = geomapDef.defaults.pointSizeScale as string;

    this._projection = geomapDef.defaults.projection;
    this._projectionPadding = geomapDef.defaults.projectionPadding;

    this._shape = geomapDef.defaults.shape;
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d: DataPoint, i: number) =>
        `${this._drawLabel(d, i)}, ${this._pointSize(d, i)}`,
      hoverOpacity: 1,
      Path: {
        ariaLabel: (d: DataPoint, i: number) => {
          const validColorScale = this._colorScale
            ? `, ${this._colorScale(d, i)}`
            : "";
          return `${this._drawLabel(d, i)}${validColorScale}.`;
        },
        fill: (d: DataPoint, i: number) => {
          if (this._colorScale && !this._coordData.features.includes(d)) {
            const c = this._colorScale(d);
            if (c !== undefined && c !== null) {
              if (this._colorScaleClass._colorScale) {
                return this._colorScaleClass._colorScale(c);
              } else {
                let color = this._colorScaleClass.color();
                if (color instanceof Array) color = color[color.length - 1];
                return color;
              }
            }
          }
          return this._topojsonFill(d, i);
        },
        on: {
          mouseenter: (
            d: DataPoint,
            i: number,
            x: DataPoint,
            event: MouseEvent,
          ) =>
            !this._coordData.features.includes(d)
              ? this._on.mouseenter.bind(this)(d, i, x, event)
              : null,
          "mousemove.shape": (
            d: DataPoint,
            i: number,
            x: DataPoint,
            event: MouseEvent,
          ) =>
            !this._coordData.features.includes(d)
              ? this._on["mousemove.shape"].bind(this)(d, i, x, event)
              : null,
          mouseleave: (
            d: DataPoint,
            i: number,
            x: DataPoint,
            event: MouseEvent,
          ) =>
            !this._coordData.features.includes(d)
              ? this._on.mouseleave.bind(this)(d, i, x, event)
              : null,
        },
        stroke: (d: DataPoint, i: number) => {
          const c =
            typeof this._shapeConfig.Path.fill === "function"
              ? this._shapeConfig.Path.fill(d, i)
              : this._shapeConfig.Path.fill;
          return color(c)!.darker();
        },
        strokeWidth: 1,
      },
    });

    this._tiles = true;
    this._tileGen = tile();
    this.tileUrl(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png",
    );

    this._topojson = false;
    this._topojsonFill = constant("#f5f5f3");
    this._topojsonFilter = (d: Record<string, unknown>) =>
      !["010"].includes(d.id as string);
    this._topojsonId = accessor("id");

    this._zoom = true;
    this._zoomSet = false;
  }

  /**
      Renders map tiles based on the current zoom level.
      @private
  */
  _renderTiles(
    transform: ReturnType<typeof zoomTransform> = zoomTransform(
      this._container.node(),
    ),
    duration: number = 0,
  ): void {
    let tileData: number[][] & {scale?: number; translate?: number[]} =
      [] as unknown as number[][] & {scale?: number; translate?: number[]};
    if (this._tiles) {
      tileData = this._tileGen
        .extent(this._zoomBehavior.translateExtent())
        .scale(this._projection.scale() * (2 * Math.PI) * transform.k)
        .translate(transform.apply(this._projection.translate()))();

      this._tileGroup
        .transition()
        .duration(duration)
        .attr("transform", transform);
    }

    const images = this._tileGroup
      .selectAll("image.d3plus-geomap-tile")
      .data(
        tileData,
        ([x, y, z]: [number, number, number]) => `${x}-${y}-${z}`,
      );

    images.exit().transition().duration(duration).attr("opacity", 0).remove();

    const scale = tileData.scale! / transform.k;

    const tileEnter = images
      .enter()
      .append("image")
      .attr("class", "d3plus-geomap-tile");

    tileEnter
      .attr("opacity", 0)
      .transition()
      .duration(duration)
      .attr("opacity", 1);

    images
      .merge(tileEnter)
      .attr("width", scale)
      .attr("height", scale)
      .attr("xlink:href", ([x, y, z]: [number, number, number]) =>
        this._tileUrl
          .replace("{s}", ["a", "b", "c"][(Math.random() * 3) | 0])
          .replace("{z}", `${z}`)
          .replace("{x}", `${x}`)
          .replace("{y}", `${y}`),
      )
      .attr(
        "x",
        ([x]: [number]) =>
          x * scale + tileData.translate![0] * scale - transform.x / transform.k,
      )
      .attr(
        "y",
        ([, y]: [number, number]) =>
          y * scale + tileData.translate![1] * scale - transform.y / transform.k,
      );
  }

  /**
      Extends the draw behavior of the abstract Viz class.

      DOM mount (svg container, ocean rect, tileGroup, zoomGroup) + zoom
      behavior extent stay here — they're lifecycle, not layout. The actual
      projection / fit-extent / per-feature path + point computation runs as
      `applyGeomapLayout` on `geomapDef.stages` and writes `_geomapCtx`
      back onto the viz, which `geomapDef.emit` consumes.
      @private
  */
  _draw(callback?: () => void): this {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    const {width, height} = chartBounds(this);

    // DOM container + ocean + tile group + zoom group: extracted to
    // ensureZoomDom. d3-zoom needs a real DOM target and _renderTiles
    // mutates the tileGroup directly with map imagery; the chart-data
    // SCENE rides the scene graph (via runChartDraw).
    ensureZoomDom(this, {
      kind: "geomap",
      width,
      height,
      duration: this._duration,
      ocean: this._ocean,
    });

    const zoomNeedsWiring = !this._zoomSet;
    // Geomap positions in absolute projection coordinates — no chart
    // transform applied.
    runChartDraw(this, geomapDef, applyGeomapLayout, () => undefined);

    if (zoomNeedsWiring) {
      this._zoomBehavior
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([1, this._zoomMax])
        .translateExtent([
          [0, 0],
          [width, height],
        ]);
      this._zoomSet = true;
    }

    return this;
  }

  /**
      Topojson files sometimes include small geographies that negatively impact how the library determines the default zoom level (for example, a small island or territory far off the coast that is barely visible to the eye). The fitFilter method can be used to remove specific geographies from the logic used to determine the zooming.

The *value* passed can be a single id to remove, an array of ids, or a filter function. Take a look at the [Choropleth Example](http://d3plus.org/examples/d3plus-geomap/getting-started/) to see it in action.
  */
  fitFilter(
    _?: string | string[] | ((d: Record<string, unknown>) => boolean),
  ): this | ((d: Record<string, unknown>) => boolean) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") return ((this._fitFilter = _), this);
      if (!(_ instanceof Array)) _ = [_] as string[];
      return (
        (this._fitFilter = (d: Record<string, unknown>) =>
          (_ as string[]).includes(d.id as string)),
        this
      );
    }
    return this._fitFilter;
  }

  /**
      If the topojson being used to determine the zoom fit (either the main [topojson](#Geomap.topojson) object or the [fitObject](#Geomap.fitObject)) contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use for the zoom fit.

If not specified, the first key in the *Array* returned from using `Object.keys` on the topojson will be used.
  */
  fitKey(_?: string): this | string {
    if (arguments.length) {
      this._fitKey = _!;
      this._zoomSet = false;
      return this;
    }
    return this._fitKey;
  }

  /**
      The topojson to be used for the initial projection [fit extent](https://github.com/d3/d3-geo#projection_fitExtent). The value passed should either be a valid Topojson *Object* or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function needs to return the final Topojson *Object*.
      @param _ `undefined`
      @param f Topojson data or a URL to load.
  */
  fitObject(
    _?: Record<string, unknown> | string,
    f?: (data: unknown) => Record<string, unknown>,
  ): this | Record<string, unknown> {
    if (arguments.length) {
      (addToQueue as any).bind(this)(_, f, "fitObject");
      this._zoomSet = false;
      return this;
    }
    return this._fitObject;
  }

  /**
      The color visible behind any shapes drawn on the map projection. By default, a color value matching the color used in the map tiles is used to help mask the loading time needed to render the tiles. Any value CSS color value may be used, including hexidecimal, rgb, rgba, and color strings like `"blue"` and `"transparent"`.
      @param _ "#d4dadc"]
  */
  ocean(_?: string): this | string {
    return arguments.length ? ((this._ocean = _!), this) : this._ocean;
  }

  /**
      The accessor to be used when detecting coordinate points in the objects passed to the [data](https://d3plus.org/docs/#Viz.data) method. Values are expected to be in the format `[longitude, latitude]`, which is in-line with d3's expected coordinate mapping.
  */
  point(
    _?: ((d: DataPoint, i: number) => number[]) | number[],
  ): this | ((d: DataPoint, i: number) => number[]) {
    return arguments.length
      ? ((this._point = typeof _ === "function" ? _ : constant(_)), this)
      : this._point;
  }

  /**
      The accessor or static value to be used for sizing coordinate points.
  */
  pointSize(
    _?: number | ((d: DataPoint, i: number) => number),
  ): this | number | ((d: DataPoint, i: number) => number) {
    return arguments.length
      ? ((this._pointSize = typeof _ === "function" ? _ : constant(_)), this)
      : this._pointSize;
  }

  /**
      The maximum pixel radius used in the scale for sizing coordinate points.
      @param _ 10]
  */
  pointSizeMax(_?: number): this | number {
    return arguments.length
      ? ((this._pointSizeMax = _!), this)
      : this._pointSizeMax;
  }

  /**
      The minimum pixel radius used in the scale for sizing coordinate points.
      @param _ 5]
  */
  pointSizeMin(_?: number): this | number {
    return arguments.length
      ? ((this._pointSizeMin = _!), this)
      : this._pointSizeMin;
  }

  /**
      The map projection used when displaying topojson and coordinate points. All projections from [d3-geo](https://github.com/d3/d3-geo#projections), [d3-geo-projection](https://github.com/d3/d3-geo-projection#api-reference), and [d3-composite-projections](http://geoexamples.com/d3-composite-projections/) are accepted, either as the string name (ie. "geoMercator") or the generator function itself. Map tiles are only usable when the projection is set to Mercator (the default).
      @param _ "geoMercator"
  */
  projection(_?: string | ((...args: unknown[]) => unknown)): this | ((...args: unknown[]) => unknown) {
    if (arguments.length && _ !== "geoMercator") this.tiles(false);
    return arguments.length
      ? ((this._projection =
          typeof _ === "string"
            ? d3Geo[_]
              ? d3Geo[_]()
              : d3Geo.geoMercator()
            : _),
        this)
      : this._projection;
  }

  /**
      The outer padding between the edge of the visualization and the shapes drawn. The value passed can be either a single number to be used on all sides, or a CSS string pattern (ie. `"20px 0 10px"`).
      @param _ 20]
  */
  projectionPadding(_?: number | string): this | Record<string, number> {
    return arguments.length
      ? ((this._projectionPadding = parseSides(_!)), this)
      : this._projectionPadding;
  }

  /**
      An array that corresponds to the value passed to the projection's [rotate](https://github.com/d3/d3-geo#projection_rotate) function. Use this method to shift the centerpoint of a map.
      @param _ [0, 0]]
  */
  projectionRotate(_?: number[]): this | number[] {
    if (arguments.length) {
      this._projection.rotate(_);
      this.tiles(false);
      this._zoomSet = false;
      return this;
    } else {
      return this._projectionRotate;
    }
  }

  /**
      Toggles the visibility of the map tiles.
      @param _ true]
  */
  tiles(_?: boolean): this | boolean {
    if (arguments.length) {
      this._tiles = _!;
      const attribution = findAttribution(this._tileUrl);
      if (_! && this._attribution === "")
        this._attribution = attribution as string;
      else if (!_! && this._attribution === attribution) this._attribution = "";
      return this;
    }
    return this._tiles;
  }

  /**
      By default, d3plus uses the `light_all` style provided by [CARTO](https://carto.com/location-data-services/basemaps/) for it's map tiles. The [tileUrl](https://d3plus.org/docs/#Geomap.tileUrl) method changes the base URL used for fetching the tiles, as long as the string passed contains `{x}`, `{y}`, and `{z}` variables enclosed in curly brackets for the zoom logic to load the correct tiles.
      @param _ "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"]
  */
  tileUrl(_?: string): this | string {
    if (arguments.length) {
      this._tileUrl = _!;
      if (this._tiles) this._attribution = findAttribution(_!) as string;
      if (this._tileGroup) this._renderTiles.bind(this)();
      return this;
    }
    return this._tileUrl;
  }

  /**
      The topojson to be used for drawing geographical paths. The value passed should either be a valid Topojson *Object* or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final Topojson *Obejct*.
      @param _ []
      @param f Topojson data or a URL to load.
  */
  topojson(
    _?: Record<string, unknown> | string,
    f?: (data: unknown) => Record<string, unknown>,
  ): this | Record<string, unknown> {
    if (arguments.length) {
      (addToQueue as any).bind(this)(_, f, "topojson");
      this._zoomSet = false;
      return this;
    }
    return this._topojson;
  }

  /**
      The function is used to set default color of the map.
      @param _ string
  */
  topojsonFill(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this._topojsonFill = typeof _ === "function" ? _ : constant(_)),
        this,
        this)
      : this._topojsonFill;
  }

  /**
      If the [topojson](#Geomap.topojson) being used contains boundaries that should not be shown, this method can be used to filter them out of the final output. The *value* passed can be a single id to remove, an array of ids, or a filter function.
  */
  topojsonFilter(
    _?: string | string[] | ((d: Record<string, unknown>) => boolean),
  ): this | ((d: Record<string, unknown>) => boolean) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") return ((this._topojsonFilter = _), this);
      if (!(_ instanceof Array)) _ = [_] as string[];
      return (
        (this._topojsonFilter = (d: Record<string, unknown>) =>
          (_ as string[]).includes(d.id as string)),
        this
      );
    }
    return this._topojsonFilter;
  }

  /**
      If the [topojson](#Geomap.topojson) contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use.

If not specified, the first key in the *Array* returned from using `Object.keys` on the topojson will be used.
  */
  topojsonKey(_?: string): this | string {
    if (arguments.length) {
      this._topojsonKey = _!;
      this._zoomSet = false;
      return this;
    }
    return this._topojsonKey;
  }

  /**
      The accessor used to map each topojson geometry to it's corresponding [data](https://d3plus.org/docs/#Viz.data) point.
      @param _ "id"
  */
  topojsonId(
    _?: string | ((d: Record<string, unknown>) => string),
  ): this | ((d: Record<string, unknown>) => string) {
    return arguments.length
      ? ((this._topojsonId = typeof _ === "function" ? _ : accessor(_!)),
        this,
        this)
      : this._topojsonId;
  }
}
