import {min} from "d3-array";
import {color} from "d3-color";
import {pointer, select, selectAll} from "d3-selection";
import * as paths from "d3-shape";
import {transition} from "d3-transition";
import textures from "textures";

import {colorContrast} from "@d3plus/color";
import {unique} from "@d3plus/data";
import {assign, attrize, elem, isObject} from "@d3plus/dom";
import {pointDistance} from "@d3plus/math";
import {strip} from "@d3plus/text";

import {TextBox} from "../components/index.js";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";

import Image from "./Image.js";

/**
    @class Shape
    @extends BaseClass
    @desc An abstracted class for generating shapes.
*/
export default class Shape extends BaseClass {

  /**
      @memberof Shape
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor(tagName = "g") {

    super();

    this._activeOpacity = 0.25;
    this._activeStyle = {
      "stroke": (d, i) => {
        let c = this._fill(d, i);
        if (["transparent", "none"].includes(c)) c = this._stroke(d, i);
        return color(c).darker(1);
      },
      "stroke-width": (d, i) => {
        const s = this._strokeWidth(d, i) || 1;
        return s * 3;
      }
    };
    this._ariaLabel = constant("");
    this._backgroundImage = constant(false);
    this._backgroundImageClass = new Image();
    this._data = [];
    this._duration = 600;
    this._fill = constant("black");
    this._fillOpacity = constant(1);

    this._hoverOpacity = 0.5;
    this._hoverStyle = {
      "stroke": (d, i) => {
        let c = this._fill(d, i);
        if (["transparent", "none"].includes(c)) c = this._stroke(d, i);
        return color(c).darker(0.5);
      },
      "stroke-width": (d, i) => {
        const s = this._strokeWidth(d, i) || 1;
        return s * 2;
      }
    };
    this._id = (d, i) => d.id !== void 0 ? d.id : i;
    this._label = constant(false);
    this._labelClass = new TextBox();
    this._labelConfig = {
      fontColor: (d, i) => colorContrast(this._fill(d, i)),
      fontSize: 12,
      padding: 5
    };
    this._name = "Shape";
    this._opacity = constant(1);
    this._pointerEvents = constant("visiblePainted");
    this._role = constant("presentation");
    this._rotate = constant(0);
    this._rx = constant(0);
    this._ry = constant(0);
    this._scale = constant(1);
    this._shapeRendering = constant("geometricPrecision");
    this._stroke = (d, i) => color(this._fill(d, i)).darker(1).formatHex();
    this._strokeDasharray = constant("0");
    this._strokeLinecap = constant("butt");
    this._strokeOpacity = constant(1);
    this._strokeWidth = constant(0);
    this._tagName = tagName;
    this._textAnchor = constant("start");
    this._texture = constant(false);
    this._textureDefault = {};
    this._textureDefs = {};
    this._vectorEffect = constant("non-scaling-stroke");
    this._verticalAlign = constant("top");

    this._x = accessor("x", 0);
    this._y = accessor("y", 0);

  }

  /**
      @memberof Shape
      @desc Given a specific data point and index, returns the aesthetic properties of the shape.
      @param {Object} *data point*
      @param {Number} *index*
      @private
  */
  _aes() {
    return {};
  }

  /**
      @memberof Shape
      @desc Adds event listeners to each shape group or hit area.
      @param {D3Selection} *update* The update cycle of the data binding.
      @private
  */
  _applyEvents(handler) {

    const events = Object.keys(this._on);
    for (let e = 0; e < events.length; e++) {
      handler.on(events[e], (event, d, i) => {
        if (!this._on[events[e]]) return;
        if (d.i !== void 0) i = d.i;
        if (d.nested && d.values) {
          const calcPoint = (d, i) => {
            if (this._discrete === "x") return [this._x(d, i), cursor[1]];
            else if (this._discrete === "y") return [cursor[0], this._y(d, i)];
            else return [this._x(d, i), this._y(d, i)];
          };
          const cursor = pointer(event, this._select.node()),
                values = d.values.map(d => pointDistance(cursor, calcPoint(d, i)));
          i = values.indexOf(min(values));
          d = d.values[i];
        }
        this._on[events[e]].bind(this)(d, i, undefined, event);
      });
    }

  }

  /**
      @memberof Shape
      @desc Provides the updated styling to the given shape elements.
      @param {HTMLElement} *elem*
      @param {Object} *style*
      @private
  */
  _updateStyle(elem, style) {

    const that = this;

    if (elem.size() && elem.node().tagName === "g") elem = elem.selectAll("*");

    /**
        @desc Determines whether a shape is a nested collection of data points, and uses the appropriate data and index for the given function context.
        @param {Object} *d* data point
        @param {Number} *i* index
        @private
    */
    function styleLogic(d, i) {
      return typeof this !== "function" ? this
        : d.nested && d.key && d.values
          ? this(d.values[0], that._data.indexOf(d.values[0]))
          : this(d, i);
    }

    const styleObject = {};
    for (const key in style) {
      if ({}.hasOwnProperty.call(style, key)) {
        styleObject[key] = styleLogic.bind(style[key]);
      }
    }

    elem.transition().duration(0).call(attrize, styleObject);

  }

  /**
      @memberof Shape
      @desc Provides the default styling to the shape elements.
      @param {HTMLElement} *elem*
      @private
  */
  _applyStyle(elem) {

    const that = this;

    if (elem.size() && elem.node().tagName === "g") elem = elem.selectAll("*");

    /**
        @desc Determines whether a shape is a nested collection of data points, and uses the appropriate data and index for the given function context.
        @param {Object} *d* data point
        @param {Number} *i* index
        @private
    */
    function styleLogic(d, i) {
      return typeof this !== "function" ? this
        : d.nested && d.key && d.values
          ? this(d.values[0], that._data.indexOf(d.values[0]))
          : this(d, i);
    }

    elem
      .attr("fill", (d, i) => {
        const texture = this._getTextureKey.bind(this)(d, i);
        return texture ? this._textureDefs[texture].url() : styleLogic.bind(this._fill)(d, i);
      })
      .attr("fill-opacity", styleLogic.bind(this._fillOpacity))
      .attr("rx", styleLogic.bind(this._rx))
      .attr("ry", styleLogic.bind(this._ry))
      .attr("stroke", styleLogic.bind(this._stroke))
      .attr("stroke-dasharray", styleLogic.bind(this._strokeDasharray))
      .attr("stroke-linecap", styleLogic.bind(this._strokeLinecap))
      .attr("stroke-opacity", styleLogic.bind(this._strokeOpacity))
      .attr("stroke-width", styleLogic.bind(this._strokeWidth))
      .attr("vector-effect", styleLogic.bind(this._vectorEffect));
  }

  /**
      @memberof Shape
      @desc Calculates the transform for the group elements.
      @param {HTMLElement} *elem*
      @private
  */
  _applyTransform(elem) {

    elem
      .attr("transform", (d, i) => `
        translate(${d.__d3plusShape__
    ? d.translate ? d.translate
    : `${this._x(d.data, d.i)},${this._y(d.data, d.i)}`
    : `${this._x(d, i)},${this._y(d, i)}`})
        scale(${d.__d3plusShape__ ? d.scale || this._scale(d.data, d.i)
  : this._scale(d, i)})
        rotate(${d.__d3plusShape__ ? d.rotate ? d.rotate
  : this._rotate(d.data || d, d.i)
  : this._rotate(d.data || d, d.i)})`);
  }

  /**
      @memberof Shape
      @desc Returns a full JSON string of the texture config for a given data point.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getTextureKey(d, i) {
    let texture = this._texture(d, i);
    if (!texture) return false;

    /**
        @desc Determines whether a shape is a nested collection of data points, and uses the appropriate data and index for the given function context.
        @private
    */
    const styleLogic = (_) => {
      return typeof _ !== "function" ? _
        : d.nested && d.key && d.values
          ? _(d.values[0], this._data.indexOf(d.values[0]))
          : _(d, i);
    }

    const fallback = this._textureDefault;

    if (!isObject(texture)) texture = {texture};
    if (!texture.background) texture.background = styleLogic(this._fill);
    if (!texture.stroke && !fallback.stroke) texture.stroke = styleLogic(this._stroke);
    const paths = ["squares", "nylon", "waves", "woven", "crosses", "caps" , "hexagons"];
    if (paths.includes(texture.texture) || typeof texture.texture === "function") {
      texture.d = texture.texture;
      texture.texture = "paths";
    }
    else if (texture.texture === "grid") {
      if (!texture.orientation && !fallback.orientation) texture.orientation = ["vertical", "horizontal"];
      texture.texture = "lines";
    }
    if (!texture.fill && texture.texture !== "paths") texture.fill = texture.stroke;
    const retObj = assign({}, fallback, texture);
    if (typeof retObj.d === "function") {
      retObj.d = retObj.d(retObj.size || 20);
    }
    return JSON.stringify(retObj);
  }

  /**
      @memberof Shape
      @desc Checks for nested data and uses the appropriate variables for accessor functions.
      @param {HTMLElement} *elem*
      @private
  */
  _nestWrapper(method) {
    return (d, i) => method(d.__d3plusShape__ ? d.data : d, d.__d3plusShape__ ? d.i : i);
  }

  /**
      @memberof Shape
      @desc Modifies existing shapes to show active status.
      @private
  */
  _renderActive() {

    const that = this;

    this._group.selectAll(".d3plus-Shape, .d3plus-Image, .d3plus-textBox")
      .each(function(d, i) {

        if (!d) d = {};
        if (!d.parentNode) d.parentNode = this.parentNode;
        const parent = d.parentNode;

        if (select(this).classed("d3plus-textBox")) d = d.data;
        if (d.__d3plusShape__ || d.__d3plus__) {
          while (d && (d.__d3plusShape__ || d.__d3plus__)) {
            i = d.i;
            d = d.data;
          }
        }
        else i = that._data.indexOf(d);

        const group = !that._active || typeof that._active !== "function" || !that._active(d, i) ? parent : that._activeGroup.node();
        if (group !== this.parentNode) {
          group.appendChild(this);
          if (this.className.baseVal.includes("d3plus-Shape")) {
            if (parent === group) select(this).call(that._applyStyle.bind(that));
            else select(this).call(that._updateStyle.bind(that, select(this), that._activeStyle));
          }
        }

      });

    // this._renderImage();
    // this._renderLabels();

    this._group.selectAll(`g.d3plus-${this._name}-shape, g.d3plus-${this._name}-image, g.d3plus-${this._name}-text`)
      .attr("opacity", this._hover ? this._hoverOpacity : this._active ? this._activeOpacity : 1);

  }

  /**
      @memberof Shape
      @desc Modifies existing shapes to show hover status.
      @private
  */
  _renderHover() {

    const that = this;

    this._group.selectAll(`g.d3plus-${this._name}-shape, g.d3plus-${this._name}-image, g.d3plus-${this._name}-text, g.d3plus-${this._name}-hover`)
      .selectAll(".d3plus-Shape, .d3plus-Image, .d3plus-textBox")
      .each(function(d, i) {

        if (!d) d = {};
        if (!d.parentNode) d.parentNode = this.parentNode;
        const parent = d.parentNode;

        if (select(this).classed("d3plus-textBox")) d = d.data;
        if (d.__d3plusShape__ || d.__d3plus__) {
          while (d && (d.__d3plusShape__ || d.__d3plus__)) {
            i = d.i;
            d = d.data;
          }
        }
        else i = that._data.indexOf(d);

        const group = !that._hover || typeof that._hover !== "function" || !that._hover(d, i) ? parent : that._hoverGroup.node();
        if (group !== this.parentNode) group.appendChild(this);
        if (this.className.baseVal.includes("d3plus-Shape")) {
          if (parent === group) select(this).call(that._applyStyle.bind(that));
          else select(this).call(that._updateStyle.bind(that, select(this), that._hoverStyle));
        }

      });

    // this._renderImage();
    // this._renderLabels();

    this._group.selectAll(`g.d3plus-${this._name}-shape, g.d3plus-${this._name}-image, g.d3plus-${this._name}-text`)
      .attr("opacity", this._hover ? this._hoverOpacity : this._active ? this._activeOpacity : 1);

  }

  /**
      @memberof Shape
      @desc Adds background image to each shape group.
      @private
  */
  _renderImage() {

    const imageData = [];

    this._update.merge(this._enter).data()
      .forEach((datum, i) => {

        const aes = this._aes(datum, i);

        if (aes.r || aes.width && aes.height) {

          let d = datum;
          if (datum.nested && datum.key && datum.values) {
            d = datum.values[0];
            i = this._data.indexOf(d);
          }

          const height = aes.r ? aes.r * 2 : aes.height,
                url = this._backgroundImage(d, i),
                width = aes.r ? aes.r * 2 : aes.width;

          if (url) {

            let x = d.__d3plusShape__ ? d.translate ? d.translate[0]
                  : this._x(d.data, d.i) : this._x(d, i),
                y = d.__d3plusShape__ ? d.translate ? d.translate[1]
                : this._y(d.data, d.i) : this._y(d, i);

            if (aes.x) x += aes.x;
            if (aes.y) y += aes.y;

            if (d.__d3plusShape__) {
              d = d.data;
              i = d.i;
            }

            imageData.push({
              __d3plus__: true,
              data: d,
              height,
              i,
              id: this._id(d, i),
              url,
              width,
              x: x + -width / 2,
              y: y + -height / 2
            });

          }

        }

      });

    this._backgroundImageClass
      .data(imageData)
      .duration(this._duration)
      .opacity(this._nestWrapper(this._opacity))
      .pointerEvents("none")
      .select(elem(`g.d3plus-${this._name}-image`, {parent: this._group, update: {opacity: this._active ? this._activeOpacity : 1}}).node())
      .render();

  }

  /**
      @memberof Shape
      @desc Adds labels to each shape group.
      @private
  */
  _renderLabels() {

    const labelData = [];

    this._update.merge(this._enter).data()
      .forEach((datum, i) => {

        let d = datum;
        if (datum.nested && datum.key && datum.values) {
          d = datum.values[0];
          i = this._data.indexOf(d);
        }

        let labels = this._label(d, i);

        if (this._labelBounds && labels !== false && labels !== undefined && labels !== null) {

          const bounds = this._labelBounds.bind(this)(d, i, this._aes(datum, i));

          if (bounds) {

            if (labels.constructor !== Array) labels = [labels];

            const x = d.__d3plusShape__ ? d.translate ? d.translate[0]
                    : this._x(d.data, d.i) : this._x(d, i),
                  y = d.__d3plusShape__ ? d.translate ? d.translate[1]
                  : this._y(d.data, d.i) : this._y(d, i);

            if (d.__d3plusShape__) {
              d = d.data;
              i = d.i;
            }

            for (let l = 0; l < labels.length; l++) {

              const b = bounds.constructor === Array ? bounds[l] : Object.assign({}, bounds);
              const rotate = this._rotate(d, i);
              let r = d.labelConfig && d.labelConfig.rotate ? d.labelConfig.rotate : bounds.angle !== undefined ? bounds.angle : 0;
              r += rotate;
              const rotateAnchor = rotate !== 0 ? [b.x * -1 || 0, b.y * -1 || 0] : [b.width / 2, b.height / 2];

              labelData.push({
                __d3plus__: true,
                data: d,
                height: b.height,
                l,
                id: `${this._id(d, i)}_${l}`,
                r,
                rotateAnchor,
                text: labels[l],
                width: b.width,
                x: x + b.x,
                y: y + b.y
              });

            }

          }

        }

      });

    this._labelClass
      .data(labelData)
      .duration(this._duration)
      .fontOpacity(this._nestWrapper(this._opacity))
      .pointerEvents("none")
      .rotate(d => d.__d3plus__ ? d.r : d.data.r)
      .rotateAnchor(d => d.__d3plus__ ? d.rotateAnchor : d.data.rotateAnchor)
      .select(elem(`g.d3plus-${this._name}-text`, {parent: this._group, update: {opacity: this._active ? this._activeOpacity : 1}}).node())
      .config(configPrep.bind(this)(this._labelConfig))
      .render();

  }

  /**
      @memberof Shape
      @desc Renders the current Shape to the page. If a *callback* is specified, it will be called once the shapes are done drawing.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    if (this._select === void 0) {
      this.select(select("body").append("svg")
        .style("width", `${window.innerWidth}px`)
        .style("height", `${window.innerHeight}px`)
        .style("display", "block").node());
    }

    this._transition = transition(this._uuid)
      .duration(this._duration);

    let data = this._data, key = this._id;
    if (this._dataFilter) {
      data = this._dataFilter(data);
      if (data.key) key = data.key;
    }

    if (this._sort) {
      data = data.sort((a, b) => {
        while (a.__d3plusShape__ || a.__d3plus__) a = a.data;
        while (b.__d3plusShape__ || b.__d3plus__) b = b.data;
        return this._sort(a, b);
      });
    }

    const textureSet = unique(data
      .map(this._getTextureKey.bind(this)))
      .filter(Boolean);

    const existingTextureDefs = Object.keys(this._textureDefs);

    existingTextureDefs.forEach(key => {
      if (!textureSet.includes(key)) {
        select(this._select.select(`pattern#${this._textureDefs[key].id()}`).node().parentNode).remove();
        delete this._textureDefs[key];
      }
    })

    textureSet.forEach(key => {
      if (!existingTextureDefs.includes(key)) {
        const config = JSON.parse(key);
        const textureClass = config.texture;
        delete config.texture;
        const t = textures[textureClass]();
        for (const k in config) {
          if ({}.hasOwnProperty.call(t, k) && k in t) {
            if (k === "d") t[k](() => config[k]);
            else config[k] instanceof Array ? t[k].apply(null, config[k]) : t[k](config[k]);
          }
        }
        this._select.call(t);
        this._textureDefs[key] = t;
      }
    });

    selectAll(`g.d3plus-${this._name}-hover > *, g.d3plus-${this._name}-active > *`).each(function(d) {
      if (d && d.parentNode) d.parentNode.appendChild(this);
      else this.parentNode.removeChild(this);
    });

    // Makes the update state of the group selection accessible.
    this._group = elem(`g.d3plus-${this._name}-group`, {parent: this._select});
    const update = this._update = elem(`g.d3plus-${this._name}-shape`, {parent: this._group, update: {opacity: this._active ? this._activeOpacity : 1}})
      .selectAll(`.d3plus-${this._name}`)
      .data(data, key);

    // Orders and transforms the updating Shapes.
    update.order();
    if (this._duration) {
      update.transition(this._transition)
        .call(this._applyTransform.bind(this));
    }
    else {
      update.call(this._applyTransform.bind(this));
    }

    // Makes the enter state of the group selection accessible.
    const enter = this._enter = update.enter().append(this._tagName)
      .attr("class", (d, i) => `d3plus-Shape d3plus-${this._name} d3plus-id-${strip(this._nestWrapper(this._id)(d, i))}`)
      .call(this._applyTransform.bind(this))
      .attr("aria-label", this._ariaLabel)
      .attr("role", this._role)
      .attr("opacity", this._nestWrapper(this._opacity));

    const enterUpdate = enter.merge(update);

    let enterUpdateRender = enterUpdate.attr("shape-rendering", this._nestWrapper(this._shapeRendering));

    if (this._duration) {
      enterUpdateRender = enterUpdateRender
        .attr("pointer-events", "none")
        .transition(this._transition).transition().delay(100)
        .attr("pointer-events", this._pointerEvents);
    }

    enterUpdateRender
      .attr("opacity", this._nestWrapper(this._opacity));

    // Makes the exit state of the group selection accessible.
    const exit = this._exit = update.exit();
    if (this._duration) exit.transition().delay(this._duration).remove();
    else exit.remove();

    this._renderImage();
    this._renderLabels();

    this._hoverGroup = elem(`g.d3plus-${this._name}-hover`, {parent: this._group});
    this._activeGroup = elem(`g.d3plus-${this._name}-active`, {parent: this._group});

    const hitAreas = this._group.selectAll(".d3plus-HitArea")
      .data(this._hitArea && Object.keys(this._on).length ? data : [], key);

    hitAreas.order()
      .call(this._applyTransform.bind(this));

    const isLine = this._name === "Line";

    if (isLine) {
      const curve = this._curve.bind(this)(this.config());
      isLine && this._path
        .curve(paths[`curve${curve.charAt(0).toUpperCase()}${curve.slice(1)}`])
        .defined(this._defined)
        .x(this._x)
        .y(this._y);
    }

    const hitEnter = hitAreas.enter().append(isLine ? "path" : "rect")
      .attr("class", (d, i) => `d3plus-HitArea d3plus-id-${strip(this._nestWrapper(this._id)(d, i))}`)
      .attr("fill", "black")
      .attr("stroke", "black")
      .attr("pointer-events", "painted")
      .attr("opacity", 0)
      .call(this._applyTransform.bind(this));

    const that = this;

    const hitUpdates = hitAreas.merge(hitEnter)
      .each(function(d) {
        const i = that._data.indexOf(d);
        const h = that._hitArea(d, i, that._aes(d, i));
        return h && !(that._name === "Line" && parseFloat(that._strokeWidth(d, i)) > 10) ? select(this).call(attrize, h) : select(this).remove();
      });

    hitAreas.exit().remove();

    this._applyEvents(this._hitArea ? hitUpdates : enterUpdate);

    setTimeout(() => {
      if (this._active) this._renderActive();
      else if (this._hover) this._renderHover();
      if (callback) callback();
    }, this._duration + 100);

    return this;

  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the highlight accessor to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  active(_) {

    if (!arguments.length || _ === undefined) return this._active;
    this._active = _;
    if (this._group) {
      // this._renderImage();
      // this._renderLabels();
      this._renderActive();
    }
    return this;

  }

  /**
      @memberof Shape
      @desc When shapes are active, this is the opacity of any shape that is not active.
      @param {Number} *value* = 0.25
      @chainable
  */
  activeOpacity(_) {
    return arguments.length ? (this._activeOpacity = _, this) : this._activeOpacity;
  }

  /**
      @memberof Shape
      @desc The style to apply to active shapes.
      @param {Object} *value*
      @chainable
  */
  activeStyle(_) {
    return arguments.length ? (this._activeStyle = assign({}, this._activeStyle, _), this) : this._activeStyle;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the aria-label attribute to the specified function or string and returns the current class instance.
      @param {Function|String} *value*
      @chainable
  */
  ariaLabel(_) {
    return _ !== undefined
      ? (this._ariaLabel = typeof _ === "function" ? _ : constant(_), this)
      : this._ariaLabel;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the background-image accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value* = false]
      @chainable
  */
  backgroundImage(_) {
    return arguments.length
      ? (this._backgroundImage = typeof _ === "function" ? _ : constant(_), this)
      : this._backgroundImage;
  }

  /**
      @memberof Shape
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. A shape will be drawn for each object in the array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length
      ? (this._data = _, this)
      : this._data;
  }

  /**
      @memberof Shape
      @desc Determines if either the X or Y position is discrete along a Line, which helps in determining the nearest data point on a line for a hit area event.
      @param {String} *value*
      @chainable
  */
  discrete(_) {
    return arguments.length ? (this._discrete = _, this) : this._discrete;
  }

  /**
      @memberof Shape
      @desc If *ms* is specified, sets the animation duration to the specified number and returns the current class instance. If *ms* is not specified, returns the current animation duration.
      @param {Number} [*ms* = 600]
      @chainable
  */
  duration(_) {
    return arguments.length
      ? (this._duration = _, this)
      : this._duration;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the fill accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value* = "black"]
      @chainable
  */
  fill(_) {
    return arguments.length
      ? (this._fill = typeof _ === "function" ? _ : constant(_), this)
      : this._fill;
  }

  /**
      @memberof Shape
      @desc Defines the "fill-opacity" attribute for the shapes.
      @param {Function|Number} [*value* = 1]
      @chainable
  */
  fillOpacity(_) {
    return arguments.length
      ? (this._fillOpacity = typeof _ === "function" ? _ : constant(_), this)
      : this._fillOpacity;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the highlight accessor to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  hover(_) {

    if (!arguments.length || _ === void 0) return this._hover;
    this._hover = _;
    if (this._group) {
      // this._renderImage();
      // this._renderLabels();
      this._renderHover();
    }
    return this;

  }

  /**
      @memberof Shape
      @desc The style to apply to hovered shapes.
      @param {Object} *value*
      @chainable
   */
  hoverStyle(_) {
    return arguments.length ? (this._hoverStyle = assign({}, this._hoverStyle, _), this) : this._hoverStyle;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the hover opacity to the specified function and returns the current class instance.
      @param {Number} [*value* = 0.5]
      @chainable
  */
  hoverOpacity(_) {
    return arguments.length ? (this._hoverOpacity = _, this) : this._hoverOpacity;
  }

  /**
      @memberof Shape
      @desc If *bounds* is specified, sets the mouse hit area to the specified function and returns the current class instance. If *bounds* is not specified, returns the current mouse hit area accessor.
      @param {Function} [*bounds*] The given function is passed the data point, index, and internally defined properties of the shape and should return an object containing the following values: `width`, `height`, `x`, `y`.
      @chainable
      @example
function(d, i, shape) {
  return {
    "width": shape.width,
    "height": shape.height,
    "x": -shape.width / 2,
    "y": -shape.height / 2
  };
}
  */
  hitArea(_) {
    return arguments.length ? (this._hitArea = typeof _ === "function" ? _ : constant(_), this) : this._hitArea;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the id accessor to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  id(_) {
    return arguments.length ? (this._id = _, this) : this._id;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the label accessor to the specified function or string and returns the current class instance.
      @param {Function|String|Array} [*value*]
      @chainable
  */
  label(_) {
    return arguments.length ? (this._label = typeof _ === "function" ? _ : constant(_), this) : this._label;
  }

  /**
      @memberof Shape
      @desc If *bounds* is specified, sets the label bounds to the specified function and returns the current class instance. If *bounds* is not specified, returns the current inner bounds accessor.
      @param {Function} [*bounds*] The given function is passed the data point, index, and internally defined properties of the shape and should return an object containing the following values: `width`, `height`, `x`, `y`. If an array is returned from the function, each value will be used in conjunction with each label.
      @chainable
      @example
function(d, i, shape) {
  return {
    "width": shape.width,
    "height": shape.height,
    "x": -shape.width / 2,
    "y": -shape.height / 2
  };
}
  */
  labelBounds(_) {
    return arguments.length ? (this._labelBounds = typeof _ === "function" ? _ : constant(_), this) : this._labelBounds;
  }

  /**
      @memberof Shape
      @desc A pass-through to the config method of the TextBox class used to create a shape's labels.
      @param {Object} [*value*]
      @chainable
  */
  labelConfig(_) {
    return arguments.length ? (this._labelConfig = assign(this._labelConfig, _), this) : this._labelConfig;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the opacity accessor to the specified function or number and returns the current class instance.
      @param {Number} [*value* = 1]
      @chainable
  */
  opacity(_) {
    return arguments.length ? (this._opacity = typeof _ === "function" ? _ : constant(_), this) : this._opacity;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the pointerEvents accessor to the specified function or string and returns the current class instance.
      @param {String} [*value*]
      @chainable
   */
  pointerEvents(_) {
    return arguments.length ? (this._pointerEvents = typeof _ === "function" ? _ : constant(_), this) : this._pointerEvents;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the role attribute to the specified function or string and returns the current class instance.
      @param {Function|String} *value*
      @chainable
  */
  role(_) {
    return _ !== undefined
      ? (this._role = typeof _ === "function" ? _ : constant(_), this)
      : this._role;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the rotate accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value* = 0]
      @chainable
   */
  rotate(_) {
    return arguments.length ? (this._rotate = typeof _ === "function" ? _ : constant(_), this) : this._rotate;
  }

  /**
      @memberof Shape
      @desc Defines the "rx" attribute for the shapes.
      @param {Function|Number} [*value* = 0]
      @chainable
  */
  rx(_) {
    return arguments.length ? (this._rx = typeof _ === "function" ? _ : constant(_), this) : this._rx;
  }

  /**
      @memberof Shape
      @desc Defines the "rx" attribute for the shapes.
      @param {Function|Number} [*value* = 0]
      @chainable
  */
  ry(_) {
    return arguments.length ? (this._ry = typeof _ === "function" ? _ : constant(_), this) : this._ry;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the scale accessor to the specified function or string and returns the current class instance.
      @param {Function|Number} [*value* = 1]
      @chainable
  */
  scale(_) {
    return arguments.length ? (this._scale = typeof _ === "function" ? _ : constant(_), this) : this._scale;
  }

  /**
      @memberof Shape
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(_) {
    return arguments.length ? (this._select = select(_), this) : this._select;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the shape-rendering accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value* = "geometricPrecision"]
      @chainable
      @example
function(d) {
  return d.x;
}
  */
  shapeRendering(_) {
    return arguments.length ? (this._shapeRendering = typeof _ === "function" ? _ : constant(_), this) : this._shapeRendering;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the sort comparator to the specified function and returns the current class instance.
      @param {false|Function} [*value* = []]
      @chainable
  */
  sort(_) {
    return arguments.length ? (this._sort = _, this) : this._sort;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the stroke accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value* = "black"]
      @chainable
  */
  stroke(_) {
    return arguments.length ? (this._stroke = typeof _ === "function" ? _ : constant(_), this) : this._stroke;
  }

  /**
      @memberof Shape
      @desc Defines the "stroke-dasharray" attribute for the shapes.
      @param {Function|String} [*value* = "1"]
      @chainable
  */
  strokeDasharray(_) {
    return arguments.length ? (this._strokeDasharray = typeof _ === "function" ? _ : constant(_), this) : this._strokeDasharray;
  }

  /**
      @memberof Shape
      @desc Defines the "stroke-linecap" attribute for the shapes. Accepted values are `"butt"`, `"round"`, and `"square"`.
      @param {Function|String} [*value* = "butt"]
      @chainable
  */
  strokeLinecap(_) {
    return arguments.length ? (this._strokeLinecap = typeof _ === "function" ? _ : constant(_), this) : this._strokeLinecap;
  }

  /**
      @memberof Shape
      @desc Defines the "stroke-opacity" attribute for the shapes.
      @param {Function|Number} [*value* = 1]
      @chainable
  */
  strokeOpacity(_) {
    return arguments.length ? (this._strokeOpacity = typeof _ === "function" ? _ : constant(_), this) : this._strokeOpacity;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the stroke-width accessor to the specified function or string and returns the current class instance.
      @param {Function|Number} [*value* = 0]
      @chainable
  */
  strokeWidth(_) {
    return arguments.length ? (this._strokeWidth = typeof _ === "function" ? _ : constant(_), this) : this._strokeWidth;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the text-anchor accessor to the specified function or string and returns the current class instance.
      @param {Function|String|Array} [*value* = "start"]
      @chainable
  */
  textAnchor(_) {
    return arguments.length ? (this._textAnchor = typeof _ === "function" ? _ : constant(_), this) : this._textAnchor;
  }

  /**
      @memberof Shape
      @desc Defines the texture used inside of each shape. This uses the [textures.js](https://riccardoscalco.it/textures/) package, and expects either a simple string (`"lines"` or `"circles"`) or a more complex Object containing the various properties of the texture (ie. `{texture: "lines", orientation: "3/8", stroke: "darkorange"}`). If multiple textures are necessary, provide an accsesor Function that returns the correct String/Object for each given data point and index.
      @param {String|Object|Function} [*value*]
      @chainable
  */
  texture(_) {
    return arguments.length ? (this._texture = typeof _ === "function" ? _ : constant(_), this) : this._texture;
  }

  /**
      @memberof Shape
      @desc A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).
      @param {Object} [*value*]
      @chainable
  */
  textureDefault(_) {
    return arguments.length ? (this._textureDefault = assign(this._textureDefault, _), this) : this._textureDefault;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the vector-effect accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value* = "non-scaling-stroke"]
      @chainable
  */
  vectorEffect(_) {
    return arguments.length ? (this._vectorEffect = typeof _ === "function" ? _ : constant(_), this) : this._vectorEffect;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the vertical alignment accessor to the specified function or string and returns the current class instance.
      @param {Function|String|Array} [*value* = "start"]
      @chainable
  */
  verticalAlign(_) {
    return arguments.length ? (this._verticalAlign = typeof _ === "function" ? _ : constant(_), this) : this._verticalAlign;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the x accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.x;
}
  */
  x(_) {
    return arguments.length ? (this._x = typeof _ === "function" ? _ : constant(_), this) : this._x;
  }

  /**
      @memberof Shape
      @desc If *value* is specified, sets the y accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.y;
}
  */
  y(_) {
    return arguments.length ? (this._y = typeof _ === "function" ? _ : constant(_), this) : this._y;
  }

}
