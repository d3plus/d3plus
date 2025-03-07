import {nest} from "d3-collection";
import {hierarchy, pack} from "d3-hierarchy";

import {assign, elem} from "@d3plus/dom";
import {accessor, configPrep, constant} from "../utils/index.js";
import {Circle} from "../shapes/index.js";
import Viz from "./Viz.js";

const recursionCircles = (d, arr = []) => {
  if (d.values) {
    d.values.forEach(h => {
      arr.push(h);
      recursionCircles(h, arr);
    });
  }
  else {
    arr.push(d);
  }
  return arr;
};

/**
    @class Pack
    @extends Viz
    @desc Uses the [d3 pack layout](https://github.com/d3/d3-hierarchy#pack) to creates Circle Packing chart based on an array of data.
*/
export default class Pack extends Viz {

  /**
      @memberof Pack
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._layoutPadding = 1;

    const defaultLegend = this._legend;
    this._legend = (config, arr) => {
      if (arr.length === this._filteredData.length) return false;
      return defaultLegend.bind(this)(config, arr);
    };

    this._on.mouseenter = () => {};

    const defaultMouseMoveLegend = this._on["mousemove.legend"];
    this._on["mousemove.legend"] = (d, i, x, event) => {
      defaultMouseMoveLegend(d, i, x, event);

      const ids = this._ids(d, i);
      const hoverData = recursionCircles(d);

      this.hover(h => {
        const hover = Object.keys(h).filter(key => key !== "value").every(key => d[key] && d[key].includes(h[key]));

        if (hover) hoverData.push(h);
        else if (ids.includes(h.key)) hoverData.push(...recursionCircles(h, [h]));

        return hoverData.includes(h);
      });

    };
    const defaultMouseMoveShape = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d, i, x, event) => {
      if (d.__d3plusTooltip__) defaultMouseMoveShape(d, i, x, event);
      this.hover(h => recursionCircles(d, [d]).includes(h));
    };
    this._pack = pack();
    this._packOpacity = constant(0.25);
    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      Circle: {
        label: d => d.parent && !d.children ? d.id : false,
        labelConfig: {
          fontResize: true
        },
        opacity: d => d.__d3plusOpacity__
      }
    });
    this._sort = (a, b) => b.value - a.value;
    this._sum = accessor("value");

  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {
    super._draw(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
          width = this._width - this._margin.left - this._margin.right;

    const diameter = Math.min(height, width);
    const transform = `translate(${(width - diameter) / 2}, ${(height - diameter) / 2})`;

    let nestedData = nest();
    for (let i = 0; i <= this._drawDepth; i++) nestedData.key(this._groupBy[i]);
    nestedData = nestedData.entries(this._filteredData);

    const packData = this._pack
      .padding(this._layoutPadding)
      .size([diameter, diameter])(
        hierarchy({key: nestedData.key, values: nestedData}, d => d.values).sum(this._sum).sort(this._sort)
      )
      .descendants();

    packData.forEach((d, i) => {
      d.__d3plus__ = true;
      d.i = i;
      d.id = d.parent ? d.parent.data.key : null;
      d.data.__d3plusOpacity__ = d.height ? this._packOpacity(d.data, i) : 1;
      d.data.__d3plusTooltip__ = !d.height ? true : false;
    });

    this._shapes.push(
      new Circle()
        .data(packData)
        .select(
          elem("g.d3plus-Pack", {
            parent: this._select,
            enter: {transform},
            update: {transform}
          }).node()
        )
        .config(configPrep.bind(this)(this._shapeConfig, "shape", "Circle"))
        .render()
    );

    return this;
  }

  /**
      @memberof Pack
      @desc If *value* is specified, sets the hover method to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
   */
  hover(_) {
    this._hover = _;
    this._shapes.forEach(s => s.hover(_));

    if (this._legend) this._legendClass.hover(_);
    return this;
  }

  /**
      @memberof Pack
      @desc If *value* is specified, sets the opacity accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current pack opacity accessor.
      @param {Function|Number} [*value*]
  */
  layoutPadding(_) {
    return arguments.length ? (this._layoutPadding = _, this) : this._layoutPadding;
  }

  /**
      @memberof Pack
      @desc If *value* is specified, sets the padding accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current pack opacity accessor.
      @param {Function|Number} [*value*]
  */
  packOpacity(_) {
    return arguments.length ? (this._packOpacity = typeof _ === "function" ? _ : constant(_), this) : this._packOpacity;
  }

  /**
      @memberof Pack
      @desc If *comparator* is specified, sets the sort order for the pack using the specified comparator function. If *comparator* is not specified, returns the current group sort order, which defaults to descending order by the associated input data's numeric value attribute.
      @param {Array} [*comparator*]
      @example
function comparator(a, b) {
  return b.value - a.value;
}
  */
  sort(_) {
    return arguments.length ? (this._sort = _, this) : this._sort;
  }


  /**
      @memberof Pack
      @desc If *value* is specified, sets the sum accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current sum accessor.
      @param {Function|Number} [*value*]
      @example
function sum(d) {
  return d.sum;
}
  */
  sum(_) {
    return arguments.length ? (this._sum = typeof _ === "function" ? _ : accessor(_), this) : this._sum;
  }
}
