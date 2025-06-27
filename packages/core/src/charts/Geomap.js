import {extent, max, quantile} from "d3-array";
import {color} from "d3-color";
import {zoomTransform} from "d3-zoom";

import * as d3GeoCore from "d3-geo";
import * as d3GeoProjection from "d3-geo-projection";
import * as d3CompositeProjections from "d3-composite-projections";
const d3Geo = Object.assign({}, d3GeoCore, d3GeoProjection, d3CompositeProjections);

import * as scales from "d3-scale";
import {tile} from "d3-tile";
import {feature} from "topojson-client";

import {load} from "@d3plus/data";
import {assign, parseSides} from "@d3plus/dom";
import {pointDistance} from "@d3plus/math";
import {Circle, Path} from "../shapes/index.js";
import {accessor, configPrep, constant} from "../utils/index.js";

import Viz from "./Viz.js";
import attributions from "./helpers/tileAttributions.js";


/**
 * @name findAttribution
 * @param {String} url
 * @private
 */
function findAttribution(url) {
  const a = attributions.find(d => d.matches.some(m => url.includes(m)));
  return a ? a.text : false;
}

/**
    @name topo2feature
    @desc Converts a specific topojson object key into a feature ready for projection.
    @param {Object} *topo* A valid topojson json object.
    @param {String} [*key*] The topojson object key to be used. If undefined, the first key available will be used.
    @private
*/
function topo2feature(topo, key) {
  const k = key && topo.objects[key] ? key : Object.keys(topo.objects)[0];
  return feature(topo, k);
}

/**
    @class Geomap
    @extends Viz
    @desc Creates a geographical map with zooming, panning, image tiles, and the ability to layer choropleth paths and coordinate points. See [this example](https://d3plus.org/examples/d3plus-geomap/getting-started/) for help getting started.
*/
export default class Geomap extends Viz {

  /**
      @memberof Geomap
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._fitObject = false;
    this._noDataMessage = false;
    this._ocean = "#d4dadc";

    this._point = accessor("point");
    this._pointSize = constant(1);
    this._pointSizeMax = 10;
    this._pointSizeMin = 5;
    this._pointSizeScale = "linear";

    this._projection = d3Geo.geoMercator();
    this._projectionPadding = parseSides(20);

    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d, i) => `${this._drawLabel(d, i)}, ${this._pointSize(d, i)}`,
      hoverOpacity: 1,
      Path: {
        ariaLabel: (d, i) => {
          const validColorScale = this._colorScale ? `, ${this._colorScale(d, i)}` : "";
          return `${this._drawLabel(d, i)}${validColorScale}.`;
        },
        fill: (d, i) => {
          if (this._colorScale && !this._coordData.features.includes(d)) {
            const c = this._colorScale(d);
            if (c !== undefined && c !== null) {
              if (this._colorScaleClass._colorScale) {
                return this._colorScaleClass._colorScale(c);
              }
              else {
                let color = this._colorScaleClass.color();
                if (color instanceof Array) color = color[color.length - 1];
                return color;
              }
            }
          }
          return this._topojsonFill(d, i);
        },
        on: {
          "mouseenter": (d, i, x, event) => !this._coordData.features.includes(d) ? this._on.mouseenter.bind(this)(d, i, x, event) : null,
          "mousemove.shape": (d, i, x, event) => !this._coordData.features.includes(d) ? this._on["mousemove.shape"].bind(this)(d, i, x, event) : null,
          "mouseleave": (d, i, x, event) => !this._coordData.features.includes(d) ? this._on.mouseleave.bind(this)(d, i, x, event) : null
        },
        stroke: (d, i) => {
          const c = typeof this._shapeConfig.Path.fill === "function" ? this._shapeConfig.Path.fill(d, i) : this._shapeConfig.Path.fill;
          return color(c).darker();
        },
        strokeWidth: 1
      }
    });

    this._tiles = true;
    this._tileGen = tile();
    this.tileUrl("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png");

    this._topojson = false;
    this._topojsonFill = constant("#f5f5f3");
    this._topojsonFilter = d => !["010"].includes(d.id);
    this._topojsonId = accessor("id");

    this._zoom = true;
    this._zoomSet = false;

  }

  /**
      Renders map tiles based on the current zoom level.
      @private
  */
  _renderTiles(transform = zoomTransform(this._container.node()), duration = 0) {

    let tileData = [];
    if (this._tiles) {

      tileData = this._tileGen
        .extent(this._zoomBehavior.translateExtent())
        .scale(this._projection.scale() * (2 * Math.PI) * transform.k)
        .translate(transform.apply(this._projection.translate()))
        ();

      this._tileGroup.transition().duration(duration).attr("transform", transform);

    }

    const images = this._tileGroup.selectAll("image.d3plus-geomap-tile")
      .data(tileData, ([x, y, z]) => `${x}-${y}-${z}`);

    images.exit().transition().duration(duration)
      .attr("opacity", 0).remove();

    const scale = tileData.scale / transform.k;

    const tileEnter = images.enter().append("image")
      .attr("class", "d3plus-geomap-tile");

    tileEnter
      .attr("opacity", 0)
      .transition().duration(duration)
      .attr("opacity", 1);

    images.merge(tileEnter)
      .attr("width", scale)
      .attr("height", scale)
      .attr("xlink:href", ([x, y, z]) => this._tileUrl
        .replace("{s}", ["a", "b", "c"][Math.random() * 3 | 0])
        .replace("{z}", z)
        .replace("{x}", x)
        .replace("{y}", y))
      .attr("x", ([x]) => x * scale + tileData.translate[0] * scale - transform.x / transform.k)
      .attr("y", ([, y]) => y * scale + tileData.translate[1] * scale - transform.y / transform.k);

  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    super._draw(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
          width = this._width - this._margin.left - this._margin.right;

    this._container = this._select.selectAll("svg.d3plus-geomap").data([0]);
    this._container = this._container.enter().append("svg")
      .attr("class", "d3plus-geomap")
      .attr("opacity", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top)
      .style("background-color", this._ocean || "transparent")
      .merge(this._container);
    this._container.transition(this._transition)
      .attr("opacity", 1)
      .attr("width", width)
      .attr("height", height)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top);

    const ocean = this._container.selectAll("rect.d3plus-geomap-ocean").data([0]);
    ocean.enter().append("rect")
      .attr("class", "d3plus-geomap-ocean")
      .merge(ocean)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", this._ocean || "transparent");

    this._tileGroup = this._container.selectAll("g.d3plus-geomap-tileGroup").data([0]);
    this._tileGroup = this._tileGroup.enter().append("g")
      .attr("class", "d3plus-geomap-tileGroup")
      .merge(this._tileGroup);

    this._zoomGroup = this._container.selectAll("g.d3plus-geomap-zoomGroup").data([0]);
    this._zoomGroup = this._zoomGroup.enter().append("g")
      .attr("class", "d3plus-geomap-zoomGroup")
      .merge(this._zoomGroup);

    let pathGroup = this._zoomGroup.selectAll("g.d3plus-geomap-paths").data([0]);
    pathGroup = pathGroup.enter().append("g")
      .attr("class", "d3plus-geomap-paths")
      .merge(pathGroup);

    const coordData = this._coordData = this._topojson
      ? topo2feature(this._topojson, this._topojsonKey)
      : {type: "FeatureCollection", features: []};

    if (this._topojsonFilter) coordData.features = coordData.features.filter(this._topojsonFilter);

    const path = this._path = d3Geo.geoPath()
      .projection(this._projection);

    const pointData = this._filteredData
      .filter((d, i) => this._point(d, i) instanceof Array);

    const pathData = this._filteredData
      .filter((d, i) => !(this._point(d, i) instanceof Array))
      .reduce((obj, d) => {
        obj[this._id(d)] = d;
        return obj;
      }, {});

    const topoData = coordData.features.reduce((arr, feature) => {
      const id = this._topojsonId(feature);
      arr.push({
        __d3plus__: true,
        data: pathData[id],
        feature,
        id
      });
      return arr;
    }, []);

    const r = scales[`scale${this._pointSizeScale.charAt(0).toUpperCase()}${this._pointSizeScale.slice(1)}`]()
      .domain(extent(pointData, (d, i) => this._pointSize(d, i)))
      .range([this._pointSizeMin, this._pointSizeMax]);

    if (!this._zoomSet) {

      const fitData = this._fitObject ? topo2feature(this._fitObject, this._fitKey) : coordData;

      this._extentBounds = {
        type: "FeatureCollection",
        features: this._fitFilter ? fitData.features.filter(this._fitFilter) : fitData.features.slice()
      };
      this._extentBounds.features = this._extentBounds.features.reduce((arr, d) => {

        if (d.geometry) {

          const reduced = {
            type: d.type,
            id: d.id,
            geometry: {
              coordinates: d.geometry.coordinates,
              type: d.geometry.type
            }
          };

          if (d.geometry.type === "MultiPolygon" && d.geometry.coordinates.length > 1) {

            const areas = [],
                  distances = [];

            d.geometry.coordinates.forEach(c => {
              reduced.geometry.coordinates = [c];
              areas.push(path.area(reduced));
            });

            reduced.geometry.coordinates = [d.geometry.coordinates[areas.indexOf(max(areas))]];
            const center = path.centroid(reduced);

            d.geometry.coordinates.forEach(c => {
              reduced.geometry.coordinates = [c];
              distances.push(pointDistance(path.centroid(reduced), center));
            });

            const distCutoff = quantile(areas.reduce((arr, dist, i) => {
              if (dist) arr.push(areas[i] / dist);
              return arr;
            }, []), 0.9);

            reduced.geometry.coordinates = d.geometry.coordinates.filter((c, i) => {
              const dist = distances[i];
              return dist === 0 || areas[i] / dist >= distCutoff;
            });

          }

          arr.push(reduced);

        }
        return arr;

      }, []);

      if (!this._extentBounds.features.length && pointData.length) {

        const bounds = [[undefined, undefined], [undefined, undefined]];
        pointData.forEach((d, i) => {

          const point = this._projection(this._point(d, i));
          if (bounds[0][0] === void 0 || point[0] < bounds[0][0]) bounds[0][0] = point[0];
          if (bounds[1][0] === void 0 || point[0] > bounds[1][0]) bounds[1][0] = point[0];
          if (bounds[0][1] === void 0 || point[1] < bounds[0][1]) bounds[0][1] = point[1];
          if (bounds[1][1] === void 0 || point[1] > bounds[1][1]) bounds[1][1] = point[1];

        });

        this._extentBounds = {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: {
              type: "MultiPoint",
              coordinates: bounds.map(b => this._projection.invert(b))
            }
          }]
        };
        const maxSize = max(pointData, (d, i) => r(this._pointSize(d, i)));
        this._projectionPadding.top += maxSize;
        this._projectionPadding.right += maxSize;
        this._projectionPadding.bottom += maxSize;
        this._projectionPadding.left += maxSize;

      }

      this._zoomBehavior
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, this._zoomMax])
        .translateExtent([[0, 0], [width, height]]);

      this._zoomSet = true;

    }

    this._projection = this._projection
      .fitExtent(
        this._extentBounds.features.length ? [[this._projectionPadding.left, this._projectionPadding.top], [width - this._projectionPadding.right, height - this._projectionPadding.bottom]] : [[0, 0], [width, height]],
        this._extentBounds.features.length ? this._extentBounds : {type: "Sphere"}
      );

    this._shapes.push(new Path()
      .data(topoData)
      .d(d => path(d.feature))
      .select(pathGroup.node())
      .x(0).y(0)
      .config(configPrep.bind(this)(this._shapeConfig, "shape", "Path"))
      .render());

    let pointGroup = this._zoomGroup.selectAll("g.d3plus-geomap-pins").data([0]);
    pointGroup = pointGroup.enter().append("g")
      .attr("class", "d3plus-geomap-pins")
      .merge(pointGroup);

    const circles = new Circle()
      .config(configPrep.bind(this)(this._shapeConfig, "shape", "Circle"))
      .data(pointData)
      .r((d, i) => r(this._pointSize(d, i)))
      .select(pointGroup.node())
      .sort((a, b) => this._pointSize(b) - this._pointSize(a))
      .x((d, i) => this._projection(this._point(d, i))[0])
      .y((d, i) => this._projection(this._point(d, i))[1]);

    const events = Object.keys(this._on);
    const classEvents = events.filter(e => e.includes(".Circle")),
          globalEvents = events.filter(e => !e.includes(".")),
          shapeEvents = events.filter(e => e.includes(".shape"));
    for (let e = 0; e < globalEvents.length; e++) circles.on(globalEvents[e], this._on[globalEvents[e]]);
    for (let e = 0; e < shapeEvents.length; e++) circles.on(shapeEvents[e], this._on[shapeEvents[e]]);
    for (let e = 0; e < classEvents.length; e++) circles.on(classEvents[e], this._on[classEvents[e]]);

    this._shapes.push(circles.render());

    return this;

  }

  /**
      @memberof Geomap
      @desc Topojson files sometimes include small geographies that negatively impact how the library determines the default zoom level (for example, a small island or territory far off the coast that is barely visible to the eye). The fitFilter method can be used to remove specific geographies from the logic used to determine the zooming.

The *value* passed can be a single id to remove, an array of ids, or a filter function. Take a look at the [Choropleth Example](http://d3plus.org/examples/d3plus-geomap/getting-started/) to see it in action.
      @param {Number|String|Array|Function} [*value*]
      @chainable
  */
  fitFilter(_) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") return this._fitFilter = _, this;
      if (!(_ instanceof Array)) _ = [_];
      return this._fitFilter = d => _.includes(d.id), this;
    }
    return this._fitFilter;
  }

  /**
      @memberof Geomap
      @desc If the topojson being used to determine the zoom fit (either the main [topojson](#Geomap.topojson) object or the [fitObject](#Geomap.fitObject)) contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use for the zoom fit.

If not specified, the first key in the *Array* returned from using `Object.keys` on the topojson will be used.
      @param {String} *value*
      @chainable
  */
  fitKey(_) {
    if (arguments.length) {
      this._fitKey = _;
      this._zoomSet = false;
      return this;
    }
    return this._fitKey;
  }

  /**
      @memberof Geomap
      @desc The topojson to be used for the initial projection [fit extent](https://github.com/d3/d3-geo#projection_fitExtent). The value passed should either be a valid Topojson *Object* or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function needs to return the final Topojson *Object*.
      @param {Object|String} *data* = `undefined`
      @param {Function} [*formatter*]
      @chainable
  */
  fitObject(_, f) {
    if (arguments.length) {
      if (typeof _ === "string") {
        const prev = this._queue.find(q => q[3] === "fitObject");
        const d = [load.bind(this), _, f, "fitObject"];
        if (prev) this._queue[this._queue.indexOf(prev)] = d;
        else this._queue.push(d);
      }
      else {
        this._fitObject = _;
      }
      this._zoomSet = false;
      return this;
    }
    return this._fitObject;
  }

  /**
      @memberof Geomap
      @desc The color visible behind any shapes drawn on the map projection. By default, a color value matching the color used in the map tiles is used to help mask the loading time needed to render the tiles. Any value CSS color value may be used, including hexidecimal, rgb, rgba, and color strings like `"blue"` and `"transparent"`.
      @param {String} [*value* = "#d4dadc"]
      @chainable
  */
  ocean(_) {
    return arguments.length ? (this._ocean = _, this) : this._ocean;
  }

  /**
      @memberof Geomap
      @desc The accessor to be used when detecting coordinate points in the objects passed to the [data](https://d3plus.org/docs/#Viz.data) method. Values are expected to be in the format `[longitude, latitude]`, which is in-line with d3's expected coordinate mapping.
      @param {Function|Array} [*value*]
      @chainable
  */
  point(_) {
    return arguments.length ? (this._point = typeof _ === "function" ? _ : constant(_), this) : this._point;
  }

  /**
      @memberof Geomap
      @desc The accessor or static value to be used for sizing coordinate points.
      @param {Function|Number} [*value*]
      @chainable
  */
  pointSize(_) {
    return arguments.length ? (this._pointSize = typeof _ === "function" ? _ : constant(_), this) : this._pointSize;
  }

  /**
      @memberof Geomap
      @desc The maximum pixel radius used in the scale for sizing coordinate points.
      @param {Number} [*value* = 10]
      @chainable
  */
  pointSizeMax(_) {
    return arguments.length ? (this._pointSizeMax = _, this) : this._pointSizeMax;
  }

  /**
      @memberof Geomap
      @desc The minimum pixel radius used in the scale for sizing coordinate points.
      @param {Number} [*value* = 5]
      @chainable
  */
  pointSizeMin(_) {
    return arguments.length ? (this._pointSizeMin = _, this) : this._pointSizeMin;
  }

  /**
      @memberof Geomap
      @desc Sets the map projection used when displaying topojson and coordinate points. All of the projections exported from [d3-geo](https://github.com/d3/d3-geo#projections), [d3-geo-projection](https://github.com/d3/d3-geo-projection#api-reference), and [d3-composite-projections](http://geoexamples.com/d3-composite-projections/) are accepted, whether as the string name (ie. "geoMercator") or the generator function itself. Map tiles are only usable when the projection is set to Mercator (which is also the default value).
      @param {Function|String} *projection* = "geoMercator"
      @chainable
  */
  projection(_) {
    if (arguments.length && _ !== "geoMercator") this.tiles(false);
    return arguments.length ? (this._projection = typeof _ === "string" ? d3Geo[_] ? d3Geo[_]() : d3Geo.geoMercator() : _, this) : this._projection;
  }

  /**
      @memberof Geomap
      @desc The outer padding between the edge of the visualization and the shapes drawn. The value passed can be either a single number to be used on all sides, or a CSS string pattern (ie. `"20px 0 10px"`).
      @param {Number|String} [*value* = 20]
      @chainable
  */
  projectionPadding(_) {
    return arguments.length ? (this._projectionPadding = parseSides(_), this) : this._projectionPadding;
  }

  /**
      @memberof Geomap
      @desc An array that corresponds to the value passed to the projection's [rotate](https://github.com/d3/d3-geo#projection_rotate) function. Use this method to shift the centerpoint of a map.
      @param {Array} [*value* = [0, 0]]
      @chainable
  */
  projectionRotate(_) {
    if (arguments.length) {
      this._projection.rotate(_);
      this.tiles(false);
      this._zoomSet = false;
      return this;
    }
    else {
      return this._projectionRotate;
    }
  }

  /**
      @memberof Geomap
      @desc Toggles the visibility of the map tiles.
      @param {Boolean} [*value* = true]
      @chainable
  */
  tiles(_) {
    if (arguments.length) {
      this._tiles = _;
      const attribution = findAttribution(this._tileUrl);
      if (_ && this._attribution === "") this._attribution = attribution;
      else if (!_ && this._attribution === attribution) this._attribution = "";
      return this;
    }
    return this._tiles;
  }

  /**
      @memberof Geomap
      @desc By default, d3plus uses the `light_all` style provided by [CARTO](https://carto.com/location-data-services/basemaps/) for it's map tiles. The [tileUrl](https://d3plus.org/docs/#Geomap.tileUrl) method changes the base URL used for fetching the tiles, as long as the string passed contains `{x}`, `{y}`, and `{z}` variables enclosed in curly brackets for the zoom logic to load the correct tiles.
      @param {String} [url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"]
      @chainable
  */
  tileUrl(_) {
    if (arguments.length) {
      this._tileUrl = _;
      if (this._tiles) this._attribution = findAttribution(_);
      if (this._tileGroup) this._renderTiles.bind(this)();
      return this;
    }
    return this._tileUrl;
  }

  /**
      @memberof Geomap
      @desc The topojson to be used for drawing geographical paths. The value passed should either be a valid Topojson *Object* or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final Topojson *Obejct*.
      @param {Object|String} *data* = []
      @param {Function} [*formatter*]
      @chainable
  */
  topojson(_, f) {
    if (arguments.length) {
      if (typeof _ === "string") {
        const prev = this._queue.find(q => q[3] === "topojson");
        const d = [load.bind(this), _, f, "topojson"];
        if (prev) this._queue[this._queue.indexOf(prev)] = d;
        else this._queue.push(d);
      }
      else {
        this._topojson = _;
      }
      this._zoomSet = false;
      return this;
    }
    return this._topojson;
  }

  /**
      @memberof Geomap
      @desc The function is used to set default color of the map.
      @param {String|Function} *value* = string
      @chainable
  */
  topojsonFill(_) {
    return arguments.length ? (this._topojsonFill = typeof _ === "function" ? _ : constant(_), this, this) : this._topojsonFill;
  }

  /**
      @memberof Geomap
      @desc If the [topojson](#Geomap.topojson) being used contains boundaries that should not be shown, this method can be used to filter them out of the final output. The *value* passed can be a single id to remove, an array of ids, or a filter function.
      @param {Number|String|Array|Function} [*value*]
      @chainable
  */
  topojsonFilter(_) {
    if (arguments.length) {
      this._zoomSet = false;
      if (typeof _ === "function") return this._topojsonFilter = _, this;
      if (!(_ instanceof Array)) _ = [_];
      return this._topojsonFilter = d => _.includes(d.id), this;
    }
    return this._topojsonFilter;
  }

  /**
      @memberof Geomap
      @desc If the [topojson](#Geomap.topojson) contains multiple geographical sets (for example, a file containing state and county boundaries), use this method to indentify which set to use.

If not specified, the first key in the *Array* returned from using `Object.keys` on the topojson will be used.
      @param {String} *value*
      @chainable
  */
  topojsonKey(_) {
    if (arguments.length) {
      this._topojsonKey = _;
      this._zoomSet = false;
      return this;
    }
    return this._topojsonKey;
  }

  /**
      @memberof Geomap
      @desc The accessor used to map each topojson geometry to it's corresponding [data](https://d3plus.org/docs/#Viz.data) point.
      @param {String|Function} *value* = "id"
      @chainable
  */
  topojsonId(_) {
    return arguments.length ? (this._topojsonId = typeof _ === "function" ? _ : accessor(_), this, this) : this._topojsonId;
  }

}
