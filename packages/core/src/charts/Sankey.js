import {nest} from "d3-collection";
import {
  sankey,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyLinkHorizontal,
  sankeyRight
} from "d3-sankey";

const sankeyAligns = {
  center: sankeyCenter,
  justify: sankeyJustify,
  left: sankeyLeft,
  right: sankeyRight
};

import {addToQueue} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import {accessor, configPrep, constant} from "../utils/index.js";
import {Path} from "../shapes/index.js";
import * as shapes from "../shapes/index.js";
import Viz from "./Viz";

/**
    @class Sankey
    @extends Viz
    @desc Creates a sankey visualization based on a defined set of nodes and links. [Click here](http://d3plus.org/examples/d3plus-network/sankey-diagram/) for help getting started using the Sankey class.
*/
export default class Sankey extends Viz {

  /**
      @memberof Sankey
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();
    this._nodeId = accessor("id");
    this._links = accessor("links");
    this._linksSource = "source";
    this._linksTarget = "target";
    this._noDataMessage = false;
    this._nodes = accessor("nodes");
    this._nodeAlign = sankeyAligns.justify;
    this._nodePadding = 8;
    this._nodeWidth = 30;
    this._on.mouseenter = () => {};
    this._on["mouseleave.shape"] = () => {
      this.hover(false);
    };
    const defaultMouseMove = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d, i, x, event) => {
      defaultMouseMove(d, i, x, event);
      if (this._focus && this._focus === d.id) {
        this.hover(false);
        this._on.mouseenter.bind(this)(d, i, x, event);

        this._focus = undefined;
      }
      else {
        const id = this._nodeId(d, i),
              node = this._nodeLookup[id],
              nodeLookup = Object.keys(this._nodeLookup).reduce((all, item) => {
                all[this._nodeLookup[item]] = !isNaN(item) ? parseInt(item, 10) : item;
                return all;
              }, {});

        const links = this._linkLookup[node];
        const filterIds = [id];

        links.forEach(l => {
          filterIds.push(nodeLookup[l]);
        });

        this.hover((h, x) => {
          if (h.source && h.target) {
            return h.source.id === id || h.target.id === id;
          }
          else {
            return filterIds.includes(this._nodeId(h, x));
          }
        });
      }
    };
    this._path = sankeyLinkHorizontal();
    this._sankey = sankey();
    this._shape = constant("Rect");
    this._shapeConfig = assign(this._shapeConfig, {
      Path: {
        fill: "none",
        hoverStyle: {
          "stroke-width": d => Math.max(1, Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) - 2)
        },
        label: false,
        stroke: "#DBDBDB",
        strokeOpacity: 0.5,
        strokeWidth: d => Math.max(1, Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) - 2)

      },
      Rect: {}
    });
    this._value = constant(1);
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {
    super._draw(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
          width = this._width - this._margin.left - this._margin.right;

    const _nodes = Array.isArray(this._nodes)
      ? this._nodes
      : this._links.reduce((all, d) => {
        if (!all.includes(d[this._linksSource])) all.push(d[this._linksSource]);
        if (!all.includes(d[this._linksTarget])) all.push(d[this._linksTarget]);
        return all;
      }, []).map(id => ({id}));

    const nodes = _nodes
      .map((n, i) => ({
        __d3plus__: true,
        data: n,
        i,
        id: this._nodeId(n, i),
        node: n,
        shape: "Rect"
      }));

    const nodeLookup = this._nodeLookup = nodes.reduce((obj, d, i) => {
      obj[d.id] = i;
      return obj;
    }, {});

    const links = this._links.map((link, i) => {
      const check = [this._linksSource, this._linksTarget];
      const linkLookup = check.reduce((result, item) => {
        result[item] = nodeLookup[link[item]];
        return result;
      }, {});
      return {
        source: linkLookup[this._linksSource],
        target: linkLookup[this._linksTarget],
        value: this._value(link, i)
      };
    });

    this._linkLookup = links.reduce((obj, d) => {
      if (!obj[d.source]) obj[d.source] = [];
      obj[d.source].push(d.target);
      if (!obj[d.target]) obj[d.target] = [];
      obj[d.target].push(d.source);
      return obj;
    }, {});

    const transform = `translate(${this._margin.left}, ${this._margin.top})`;

    this._sankey
      .nodeAlign(this._nodeAlign)
      .nodePadding(this._nodePadding)
      .nodeWidth(this._nodeWidth)
      .nodes(nodes)
      .links(links)
      .size([width, height])();

    this._shapes.push(
      new Path()
        .config(this._shapeConfig.Path)
        .data(links)
        .d(this._path)
        .select(
          elem("g.d3plus-Links", {
            parent: this._select,
            enter: {transform},
            update: {transform}
          }).node()
        )
        .render()
    );
    nest()
      .key(d => d.shape)
      .entries(nodes)
      .forEach(d => {
        this._shapes.push(
          new shapes[d.key]()
            .data(d.values)
            .height(d => d.y1 - d.y0)
            .width(d => d.x1 - d.x0)
            .x(d => (d.x1 + d.x0) / 2)
            .y(d => (d.y1 + d.y0) / 2)
            .select(
              elem("g.d3plus-sankey-nodes", {
                parent: this._select,
                enter: {transform},
                update: {transform}
              }).node()
            )
            .config(configPrep.bind(this)(this._shapeConfig, "shape", d.key))
            .render()
        );
      });
    return this;
  }

  /**
      @memberof Sankey
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
      @memberof Sankey
      @desc A predefined *Array* of edges that connect each object passed to the [node](#Sankey.node) method. The `source` and `target` keys in each link need to map to the nodes in one of one way:
1. A *String* value matching the `id` of the node.

The value passed should be an *Array* of data. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.
      @param {Array} *links* = []
      @chainable
  */
  links(_, f) {
    if (arguments.length) {
      addToQueue.bind(this)(_, f, "links");
      return this;
    }
    return this._links;
  }

  /**
      @memberof Sankey
      @desc The key inside of each link Object that references the source node.
      @param {String} [*value* = "source"]
      @chainable
  */
  linksSource(_) {
    return arguments.length ? (this._linksSource = _, this) : this._linksSource;
  }

  /**
      @memberof Sankey
      @desc The key inside of each link Object that references the target node.
      @param {String} [*value* = "target"]
      @chainable
  */
  linksTarget(_) {
    return arguments.length ? (this._linksTarget = _, this) : this._linksTarget;
  }

  /**
      @memberof Sankey
      @desc Sets the nodeAlign property of the sankey layout, which can either be "left", "right", "center", or "justify".
      @param {Function|String} [*value* = "justify"]
      @chainable
  */
  nodeAlign(_) {
    return arguments.length
      ? (this._nodeAlign = typeof _ === "function" ? _ : sankeyAligns[_], this)
      : this._nodeAlign;
  }

  /**
      @memberof Sankey
      @desc If *value* is specified, sets the node id accessor(s) to the specified array of values and returns the current class instance. If *value* is not specified, returns the current node group accessor.
      @param {String} [*value* = "id"]
      @chainable
  */
  nodeId(_) {
    return arguments.length
      ? (this._nodeId = typeof _ === "function" ? _ : accessor(_), this)
      : this._nodeId;
  }

  /**
      @memberof Sankey
      @desc The list of nodes to be used for drawing the network. The value passed must be an *Array* of data.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.
      @param {Array} *nodes* = []
      @chainable
  */
  nodes(_, f) {
    if (arguments.length) {
      addToQueue.bind(this)(_, f, "nodes");
      return this;
    }
    return this._nodes;
  }

  /**
      @memberof Sankey
      @desc If *value* is specified, sets the padding of the node and returns the current class instance. If *value* is not specified, returns the current nodePadding. By default, the nodePadding size is 8.
      @param {Number} [*value* = 8]
      @chainable
  */
  nodePadding(_) {
    return arguments.length ? (this._nodePadding = _, this) : this._nodePadding;
  }


  /**
      @memberof Sankey
      @desc If *value* is specified, sets the width of the node and returns the current class instance. If *value* is not specified, returns the current nodeWidth. By default, the nodeWidth size is 30.
      @param {Number} [*value* = 30]
      @chainable
  */
  nodeWidth(_) {
    return arguments.length ? (this._nodeWidth = _, this) : this._nodeWidth;
  }

  /**
      @memberof Sankey
      @desc If *value* is specified, sets the width of the links and returns the current class instance. If *value* is not specified, returns the current value accessor.
      @param {Function|Number} *value*
      @example
function value(d) {
  return d.value;
}
  */
  value(_) {

    return arguments.length
      ? (this._value = typeof _ === "function" ? _ : accessor(_), this)
      : this._value;
  }
}
