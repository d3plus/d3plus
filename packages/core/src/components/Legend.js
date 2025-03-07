
import {max, sum} from "d3-array";
import {select} from "d3-selection";

import {colorDefaults} from "@d3plus/color";
import {assign, elem, rtl as detectRTL, textWidth} from "@d3plus/dom";
import {textWrap} from "@d3plus/text";

import {TextBox} from "../components/index.js";
import * as shapes from "../shapes/index.js";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";

const padding = 5;

/**
    @class Legend
    @extends BaseClass
    @desc Creates an SVG scale based on an array of data. If *data* is specified, immediately draws based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#shape.data) method.
*/
export default class Legend extends BaseClass {

  /**
      @memberof Legend
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._titleClass = new TextBox();

    this._align = "center";
    this._data = [];
    this._direction = "row";
    this._duration = 600;
    this._height = 200;
    this._id = accessor("id");
    this._label = accessor("id");
    this._lineData = [];
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._padding = 5;
    this._shape = constant("Rect");
    this._shapes = [];
    this._shapeConfig = {
      fill: accessor("color"),
      height: constant(12),
      hitArea: (dd, i) => {
        const d = this._lineData[i],
              h = max([d.height, d.shapeHeight]);
        return {width: d.width + d.shapeWidth, height: h, x: -d.shapeWidth / 2, y: -h / 2};
      },
      labelBounds: (dd, i) => {
        const d = this._lineData[i];
        let x = d.shapeWidth / 2;
        if (d.shape === "Circle") x -= d.shapeR / 2;
        const height = max([d.shapeHeight, d.height]);
        const rtlMod = this._rtl ? d.shapeWidth + d.width + this._padding * 2 : 0;
        return {width: d.width, height, x: x + padding - rtlMod, y: -height / 2};
      },
      labelConfig: {
        fontColor: constant(colorDefaults.dark),
        fontFamily: this._titleClass.fontFamily(),
        fontResize: false,
        fontSize: constant(10),
        verticalAlign: "middle"
      },
      opacity: 1,
      r: constant(6),
      width: constant(12),
      x: (d, i) => {
        const datum = this._lineData[i];
        const y = datum.y;
        const pad = this._align === "left" || this._align === "right" && this._direction === "column" ? 0 : this._align === "center"
          ? (this._outerBounds.width - this._rowWidth(this._lineData.filter(l => y === l.y))) / 2
          : this._outerBounds.width - this._rowWidth(this._lineData.filter(l => y === l.y));
        const prevWords = this._lineData.slice(0, i).filter(l => y === l.y);
        const rtlMod = this._rtl ? datum.width + this._padding : 0;
        return this._rowWidth(prevWords) + this._padding * (prevWords.length ? datum.sentence ? 2 : 1 : 0) +
               this._outerBounds.x + datum.shapeWidth / 2 + pad + rtlMod;
      },
      y: (d, i) => {
        const ld = this._lineData[i];
        return ld.y + this._titleHeight + this._outerBounds.y +
               max(
                 this._lineData.filter(l => ld.y === l.y).map(l => l.height)
                 .concat(this._data.map((l, x) => this._fetchConfig("height", l, x)))
               ) / 2;
      }
    };
    this._titleConfig = {
      fontSize: 12
    };
    this._verticalAlign = "middle";
    this._width = 400;

  }

  _fetchConfig(key, d, i) {
    const val = this._shapeConfig[key] !== undefined ? this._shapeConfig[key] : this._shapeConfig.labelConfig[key];
    if (!val && key === "lineHeight") return this._fetchConfig("fontSize", d, i) * 1.4;
    return typeof val === "function" ? val(d, i) : val;
  }

  _rowHeight(row) {
    return max(row.map(d => d.height).concat(row.map(d => d.shapeHeight))) + this._padding;
  }

  _rowWidth(row) {
    return sum(row.map((d, i) => {
      const p = this._padding * (i === row.length - 1 ? 0 : d.width ? 2 : 1);
      return d.shapeWidth + d.width + p;
    }));
  }

  /**
      @memberof Legend
      @desc Renders the current Legend to the page. If a *callback* is specified, it will be called once the legend is done drawing.
      @param {Function} [*callback* = undefined]
      @chainable
  */
  render(callback) {

    if (this._select === void 0) this.select(select("body").append("svg").attr("width", `${this._width}px`).attr("height", `${this._height}px`).node());

    // Legend Container <g> Groups
    this._group = elem("g.d3plus-Legend", {parent: this._select});
    this._titleGroup = elem("g.d3plus-Legend-title", {parent: this._group});
    this._shapeGroup = elem("g.d3plus-Legend-shape", {parent: this._group});

    let availableHeight = this._height;
    this._titleHeight = 0;
    this._titleWidth = 0;
    if (this._title) {

      const f = this._titleConfig.fontFamily || this._titleClass.fontFamily()(),
            s = this._titleConfig.fontSize || this._titleClass.fontSize()();
      let lH = this._titleConfig.lineHeight || this._titleClass.lineHeight();
      lH = lH ? lH() : s * 1.4;

      const res = textWrap()
        .fontFamily(f)
        .fontSize(s)
        .lineHeight(lH)
        .width(this._width)
        .height(this._height)(this._title);
      this._titleHeight = lH + res.lines.length + this._padding;
      this._titleWidth = max(res.widths);
      availableHeight -= this._titleHeight;
    }

    // Calculate Text Sizes
    this._lineData = this._data.map((d, i) => {

      const label = this._label(d, i);
      const shape = this._shape(d, i);
      const r = this._fetchConfig("r", d, i);

      let res = {
        data: d,
        i,
        id: this._id(d, i),
        shape,
        shapeR: r,
        shapeWidth: shape === "Circle" ? r * 2 : this._fetchConfig("width", d, i),
        shapeHeight: shape === "Circle" ? r * 2 : this._fetchConfig("height", d, i),
        y: 0
      };

      if (!label) {
        res.sentence = false;
        res.words = [];
        res.height = 0;
        res.width = 0;
        return res;
      }

      const f = this._fetchConfig("fontFamily", d, i),
            lh = this._fetchConfig("lineHeight", d, i),
            s = this._fetchConfig("fontSize", d, i);

      const h = availableHeight - (this._data.length + 1) * this._padding,
            w = this._width;

      const newRes = textWrap()
        .fontFamily(f)
        .fontSize(s)
        .lineHeight(lh)
        .width(w)
        .height(h)(label);

      res = Object.assign(res, newRes);

      res.width = Math.ceil(max(res.lines.map(t => textWidth(t, {"font-family": f, "font-size": s})))) + padding * 2;
      res.height = Math.ceil(res.lines.length * (lh + 1));
      res.og = {height: res.height, width: res.width};
      res.f = f;
      res.s = s;
      res.lh = lh;

      return res;

    });

    let spaceNeeded;
    const availableWidth = this._width - this._padding * 2;
    spaceNeeded = this._rowWidth(this._lineData);

    if (this._direction === "column" || spaceNeeded > availableWidth) {
      let lines = 1, newRows = [];

      const maxLines = max(this._lineData.map(d => d.words.length));
      this._wrapLines = function() {

        lines++;

        if (lines > maxLines) return;

        const wrappable = lines === 1 ? this._lineData.slice()
          : this._lineData.filter(d => d.width + d.shapeWidth + this._padding * (d.width ? 2 : 1) > availableWidth && d.words.length >= lines)
              .sort((a, b) => b.sentence.length - a.sentence.length);

        if (wrappable.length && availableHeight > wrappable[0].height * lines) {

          let truncated = false;
          for (let x = 0; x < wrappable.length; x++) {
            const label = wrappable[x];
            const h = label.og.height * lines, w = label.og.width * (1.5 * (1 / lines));
            const res = textWrap().fontFamily(label.f).fontSize(label.s).lineHeight(label.lh).width(w).height(h)(label.sentence);
            if (!res.truncated) {
              label.width = Math.ceil(max(res.lines.map(t => textWidth(t, {"font-family": label.f, "font-size": label.s})))) + label.s;
              label.height = res.lines.length * (label.lh + 1);
            }
            else {
              truncated = true;
              break;
            }
          }
          if (!truncated) this._wrapRows();
        }
        else {
          newRows = [];
          return;
        }

      };

      this._wrapRows = function() {
        newRows = [];
        let row = 1, rowWidth = 0;
        for (let i = 0; i < this._lineData.length; i++) {
          const d = this._lineData[i],
                w = d.width + this._padding * (d.width ? 2 : 1) + d.shapeWidth;
          if (sum(newRows.map(row => max(row, d => max([d.height, d.shapeHeight])))) > availableHeight) {
            newRows = [];
            break;
          }
          if (w > availableWidth) {
            newRows = [];
            this._wrapLines();
            break;
          }
          else if (rowWidth + w < availableWidth) {
            rowWidth += w;
          }
          else if (this._direction !== "column") {
            rowWidth = w;
            row++;
          }
          if (!newRows[row - 1]) newRows[row - 1] = [];
          newRows[row - 1].push(d);
          if (this._direction === "column") {
            rowWidth = 0;
            row++;
          }
        }
      };

      this._wrapRows();

      if (!newRows.length || sum(newRows, this._rowHeight.bind(this)) + this._padding > availableHeight) {
        spaceNeeded = sum(this._lineData.map(d => d.shapeWidth + this._padding)) - this._padding;
        for (let i = 0; i < this._lineData.length; i++) {
          this._lineData[i].width = 0;
          this._lineData[i].height = 0;
        }
        this._wrapRows();
      }

      if (newRows.length && sum(newRows, this._rowHeight.bind(this)) + this._padding < availableHeight) {
        newRows.forEach((row, i) => {
          row.forEach(d => {
            if (i) {
              d.y = sum(newRows.slice(0, i), this._rowHeight.bind(this));
            }
          });
        });
        spaceNeeded = max(newRows, this._rowWidth.bind(this));
      }
    }

    const innerHeight = max(this._lineData, (d, i) => max([d.height, this._fetchConfig("height", d.data, i)]) + d.y) + this._titleHeight,
          innerWidth = max([spaceNeeded, this._titleWidth]);

    this._outerBounds.width = innerWidth;
    this._outerBounds.height = innerHeight;

    let xOffset = this._padding,
        yOffset = this._padding;
    if (this._align === "center") xOffset = (this._width - innerWidth) / 2;
    else if (this._align === "right") xOffset = this._width - this._padding - innerWidth;
    if (this._verticalAlign === "middle") yOffset = (this._height - innerHeight) / 2;
    else if (this._verticalAlign === "bottom") yOffset = this._height - this._padding - innerHeight;
    this._outerBounds.x = xOffset;
    this._outerBounds.y = yOffset;

    this._titleClass
      .data(this._title ? [{text: this._title}] : [])
      .duration(this._duration)
      .select(this._titleGroup.node())
      .textAnchor({left: "start", center: "middle", right: "end"}[this._align])
      .width(this._width - this._padding * 2)
      .x(this._padding)
      .y(this._outerBounds.y)
      .config(this._titleConfig)
      .render();

    this._shapes = [];
    const baseConfig = configPrep.bind(this)(this._shapeConfig, "legend"),
          config = {
            id: d => d.id,
            label: d => d.label,
            lineHeight: d => d.lH
          };

    const data = this._data.map((d, i) => {

      const obj = {
        __d3plus__: true,
        data: d, i,
        id: this._id(d, i),
        label: this._lineData[i].width ? this._label(d, i) : false,
        lH: this._fetchConfig("lineHeight", d, i),
        shape: this._shape(d, i)
      };

      return obj;

    });

    // Legend Shapes
    this._shapes = [];
    ["Circle", "Rect"].forEach(Shape => {

      this._shapes.push(
        new shapes[Shape]()
          .parent(this)
          .data(data.filter(d => d.shape === Shape))
          .duration(this._duration)
          .labelConfig({padding: 0})
          .select(this._shapeGroup.node())
          .verticalAlign("top")
          .config(assign({}, baseConfig, config))
          .render()
      );

    });

    if (callback) setTimeout(callback, this._duration + 100);

    return this;

  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the active method for all shapes to the specified function and returns the current class instance. If *value* is not specified, returns the current active method.
      @param {Function} [*value*]
      @chainable
  */
  active(_) {
    this._shapes.forEach(s => s.active(_));
    return this;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the horizontal alignment to the specified value and returns the current class instance. If *value* is not specified, returns the current horizontal alignment.
      @param {String} [*value* = "center"] Supports `"left"` and `"center"` and `"right"`.
      @chainable
  */
  align(_) {
    return arguments.length ? (this._align = _, this) : this._align;
  }

  /**
      @memberof Legend
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. A shape key will be drawn for each object in the array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof Legend
      @desc Sets the flow of the items inside the legend. If no value is passed, the current flow will be returned.
      @param {String} [*value* = "row"]
      @chainable
  */
  direction(_) {
    return arguments.length ? (this._direction = _, this) : this._direction;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the transition duration of the legend and returns the current class instance. If *value* is not specified, returns the current duration.
      @param {Number} [*value* = 600]
      @chainable
  */
  duration(_) {
    return arguments.length ? (this._duration = _, this) : this._duration;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the overall height of the legend and returns the current class instance. If *value* is not specified, returns the current height value.
      @param {Number} [*value* = 100]
      @chainable
  */
  height(_) {
    return arguments.length ? (this._height = _, this) : this._height;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the hover method for all shapes to the specified function and returns the current class instance. If *value* is not specified, returns the current hover method.
      @param {Function} [*value*]
      @chainable
  */
  hover(_) {
    this._shapes.forEach(s => s.hover(_));
    return this;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the id accessor to the specified function and returns the current class instance. If *value* is not specified, returns the current id accessor.
      @param {Function} [*value*]
      @chainable
      @example
function value(d) {
  return d.id;
}
  */
  id(_) {
    return arguments.length ? (this._id = _, this) : this._id;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the label accessor to the specified function or string and returns the current class instance. If *value* is not specified, returns the current label accessor, which is the [id](#shape.id) accessor by default.
      @param {Function|String} [*value*]
      @chainable
  */
  label(_) {
    return arguments.length ? (this._label = typeof _ === "function" ? _ : constant(_), this) : this._label;
  }

  /**
      @memberof Legend
      @desc If called after the elements have been drawn to DOM, will returns the outer bounds of the legend content.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
  */
  outerBounds() {
    return this._outerBounds;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the padding between each key to the specified number and returns the current class instance. If *value* is not specified, returns the current padding value.
      @param {Number} [*value* = 10]
      @chainable
  */
  padding(_) {
    return arguments.length ? (this._padding = _, this) : this._padding;
  }

  /**
      @memberof Legend
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(_) {
    if (arguments.length) {
      this._select = select(_);
      this._rtl = detectRTL(this._select.node());
      return this;
    }
    return this._select;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the shape accessor to the specified function or string and returns the current class instance. If *value* is not specified, returns the current shape accessor.
      @param {Function|String} [*value* = "Rect"]
      @chainable
  */
  shape(_) {
    return arguments.length ? (this._shape = typeof _ === "function" ? _ : constant(_), this) : this._shape;
  }

  /**
      @memberof Legend
      @desc If *config* is specified, sets the methods that correspond to the key/value pairs for each shape and returns the current class instance. If *config* is not specified, returns the current shape configuration.
      @param {Object} [*config* = {}]
      @chainable
  */
  shapeConfig(_) {
    return arguments.length ? (this._shapeConfig = assign(this._shapeConfig, _), this) : this._shapeConfig;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the title of the legend and returns the current class instance. If *value* is not specified, returns the current title.
      @param {String} [*value*]
      @chainable
  */
  title(_) {
    return arguments.length ? (this._title = _, this) : this._title;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the title configuration of the legend and returns the current class instance. If *value* is not specified, returns the current title configuration.
      @param {Object} [*value*]
      @chainable
  */
  titleConfig(_) {
    return arguments.length ? (this._titleConfig = assign(this._titleConfig, _), this) : this._titleConfig;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the vertical alignment to the specified value and returns the current class instance. If *value* is not specified, returns the current vertical alignment.
      @param {String} [*value* = "middle"] Supports `"top"` and `"middle"` and `"bottom"`.
      @chainable
  */
  verticalAlign(_) {
    return arguments.length ? (this._verticalAlign = _, this) : this._verticalAlign;
  }

  /**
      @memberof Legend
      @desc If *value* is specified, sets the overall width of the legend and returns the current class instance. If *value* is not specified, returns the current width value.
      @param {Number} [*value* = 400]
      @chainable
  */
  width(_) {
    return arguments.length ? (this._width = _, this) : this._width;
  }

}
