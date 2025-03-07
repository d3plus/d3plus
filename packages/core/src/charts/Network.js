
import {extent, max, mean, min, merge} from "d3-array";
import {nest} from "d3-collection";
import {forceLink, forceManyBody, forceSimulation} from "d3-force";
import {polygonHull} from "d3-polygon";
import * as scales from "d3-scale";
import {zoomTransform} from "d3-zoom";

import {assign, elem} from "@d3plus/dom";
import {addToQueue} from "@d3plus/data";
import * as shapes from "../shapes/index.js";
import {accessor, configPrep, constant} from "../utils/index.js";
import Viz from "./Viz";

/**
 * Fetches the unique ID for a data point, whether it's defined by data or nodes.
 * @private
 */
function getNodeId(d, i) {
  return `${this._id(d, i) || this._nodeGroupBy[min([this._drawDepth, this._nodeGroupBy.length - 1])](d, i)}`;
}

/**
    @class Network
    @extends Viz
    @desc Creates a network visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/getting-started/) for help getting started using the Network class.
*/
export default class Network extends Viz {

  /**
      @memberof Network
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();
    this._links = [];
    this._linkSize = constant(1);
    this._linkSizeMin = 1;
    this._linkSizeScale = "sqrt";
    this._noDataMessage = false;
    this._nodeGroupBy = [accessor("id")];
    this._nodes = [];
    this._on["click.shape"] = (d, i, x, event) => {

      this._tooltipClass.data([]).render();

      if (this._hover && this._drawDepth >= this._groupBy.length - 1) {

        const id = getNodeId.bind(this)(d, i);

        if (this._focus && this._focus === id) {

          this.active(false);
          this._on.mouseenter.bind(this)(d, i, x, event);

          this._focus = undefined;
          this._zoomToBounds(null);

        }
        else {

          this.hover(false);

          const links = this._linkLookup[id],
                node = this._nodeLookup[id];

          const filterIds = [id];
          let xDomain = [node.x - node.r, node.x + node.r],
              yDomain = [node.y - node.r, node.y + node.r];

          links.forEach(l => {
            filterIds.push(l.id);
            if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
            if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
            if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
            if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
          });

          this.active((h, x) => {
            if (h.source && h.target) return h.source.id === id || h.target.id === id;
            else return filterIds.includes(getNodeId.bind(this)(h, x));
          });

          this._focus = id;
          const t = zoomTransform(this._container.node());
          xDomain = xDomain.map(d => d * t.k + t.x);
          yDomain = yDomain.map(d => d * t.k + t.y);
          this._zoomToBounds([[xDomain[0], yDomain[0]], [xDomain[1], yDomain[1]]]);

        }

      }

    };
    this._on["click.legend"] = (d, i, x, event) => {

      const ids = this._id(d);
      let id = this._ids(d);
      id = id[id.length - 1];

      if (this._hover && this._drawDepth >= this._groupBy.length - 1) {

        if (this._focus && this._focus === ids) {

          this.active(false);

          this._focus = undefined;
          this._zoomToBounds(null);

        }
        else {

          this.hover(false);

          const nodes = ids.map(id => this._nodeLookup[id]);

          const filterIds = [`${id}`];
          let xDomain = [nodes[0].x - nodes[0].r, nodes[0].x + nodes[0].r],
              yDomain = [nodes[0].y - nodes[0].r, nodes[0].y + nodes[0].r];

          nodes.forEach(l => {
            filterIds.push(l.id);
            if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
            if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
            if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
            if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
          });

          this.active((h, x) => {
            if (h.source && h.target) return filterIds.includes(h.source.id) && filterIds.includes(h.target.id);
            else {
              const myIds = this._ids(h, x);
              return filterIds.includes(`${myIds[myIds.length - 1]}`);
            }
          });

          this._focus = ids;
          const t = zoomTransform(this._container.node());
          xDomain = xDomain.map(d => d * t.k + t.x);
          yDomain = yDomain.map(d => d * t.k + t.y);
          this._zoomToBounds([[xDomain[0], yDomain[0]], [xDomain[1], yDomain[1]]]);

        }

        this._on.mouseenter.bind(this)(d, i, x, event);
        this._on["mousemove.legend"].bind(this)(d, i, x, event);

      }

    };
    this._on.mouseenter = () => {};
    this._on["mouseleave.shape"] = () => {
      this.hover(false);
    };
    const defaultMouseMove = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d, i, x, event) => {
      defaultMouseMove(d, i, x, event);
      const id = getNodeId.bind(this)(d, i),
            links = this._linkLookup[id] || [],
            node = this._nodeLookup[id];

      const filterIds = [id];
      const xDomain = [node.x - node.r, node.x + node.r],
            yDomain = [node.y - node.r, node.y + node.r];

      links.forEach(l => {
        filterIds.push(l.id);
        if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
        if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
        if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
        if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
      });

      this.hover((h, x) => {
        if (h.source && h.target) return h.source.id === id || h.target.id === id;
        else return filterIds.includes(`${this._ids(h, x)[this._drawDepth]}`);
      });
    };
    this._sizeMin = 5;
    this._sizeScale = "sqrt";
    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d, i) => {
        const validSize = this._size ? `, ${this._size(d, i)}` : "";
        return `${this._drawLabel(d, i)}${validSize}.`;
      },
      labelConfig: {
        duration: 0,
        fontMin: 1,
        fontResize: true,
        labelPadding: 0,
        textAnchor: "middle",
        verticalAlign: "middle"
      },
      Path: {
        fill: "none",
        label: false,
        stroke: "#eee"
      }
    });
    this._x = accessor("x");
    this._y = accessor("y");

    this._zoom = true;

  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    super._draw(callback);

    const duration = this._duration,
          height = this._height - this._margin.top - this._margin.bottom,
          transform = `translate(${this._margin.left}, ${this._margin.top})`,
          width = this._width - this._margin.left - this._margin.right;

    const data = this._filteredData.reduce((obj, d, i) => {
      obj[this._id(d, i)] = d;
      return obj;
    }, {});

    let nodes = this._nodes.reduce((obj, d, i) => {
      obj[getNodeId.bind(this)(d, i)] = d;
      return obj;
    }, {});

    nodes = Array.from(new Set(Object.keys(data).concat(Object.keys(nodes)))).map((id, i) => {
      const d = data[id],
            n = nodes[id];

      if (n === undefined) return false;

      return {
        __d3plus__: true,
        data: d || n,
        i, id,
        fx: d !== undefined && !isNaN(this._x(d)) ? this._x(d) : this._x(n),
        fy: d !== undefined && !isNaN(this._y(d)) ? this._y(d) : this._y(n),
        node: n,
        r: this._size ? d !== undefined && this._size(d) !== undefined ? this._size(d) : this._size(n) : this._sizeMin,
        shape: d !== undefined && this._shape(d) !== undefined ? this._shape(d) : this._shape(n)
      };

    }).filter(n => n);

    const nodeLookup = this._nodeLookup = nodes.reduce((obj, d) => {
      obj[d.id] = d;
      return obj;
    }, {});

    const nodeIndices = nodes.map(n => n.node);
    const links = this._links.map(l => {
      const referenceType = typeof l.source;
      return {
        size: this._linkSize(l),
        source: referenceType === "number"
          ? nodes[nodeIndices.indexOf(this._nodes[l.source])]
          : referenceType === "string"
            ? nodeLookup[l.source]
            : nodeLookup[l.source.id],
        target: referenceType === "number"
          ? nodes[nodeIndices.indexOf(this._nodes[l.target])]
          : referenceType === "string"
            ? nodeLookup[l.target]
            : nodeLookup[l.target.id]
      };
    });

    this._linkLookup = links.reduce((obj, d) => {
      if (!obj[d.source.id]) obj[d.source.id] = [];
      obj[d.source.id].push(d.target);
      if (!obj[d.target.id]) obj[d.target.id] = [];
      obj[d.target.id].push(d.source);
      return obj;
    }, {});

    const missingCoords = nodes.some(n => n.fx === undefined || n.fy === undefined);

    if (missingCoords) {

      const linkStrength = scales.scaleLinear()
        .domain(extent(links, d => d.size))
        .range([0.1, 0.5]);

      const simulation = forceSimulation()
        .force("link", forceLink(links)
          .id(d => d.id)
          .distance(1)
          .strength(d => linkStrength(d.size))
          .iterations(4)
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

      const nodePositions = nodes.map(n => [n.vx, n.vy]);
      let angle = 0, cx = 0, cy = 0;
      if (nodePositions.length === 2) {
        angle = 100;
      }
      else if (nodePositions.length > 2) {
        const hull = polygonHull(nodePositions);
        const rect = shapes.largestRect(hull, {verbose: true});
        angle = rect.angle;
        cx = rect.cx;
        cy = rect.cy;
      }

      nodes.forEach(n => {
        const p = shapes.pointRotate([n.vx, n.vy], -1 * (Math.PI / 180 * angle), [cx, cy]);
        n.fx = p[0];
        n.fy = p[1];
      });

    }

    const xExtent = extent(nodes.map(n => n.fx)),
          yExtent = extent(nodes.map(n => n.fy));

    const x = scales.scaleLinear().domain(xExtent).range([0, width]),
          y = scales.scaleLinear().domain(yExtent).range([0, height]);

    const nodeRatio = (xExtent[1] - xExtent[0]) / (yExtent[1] - yExtent[0]) || 1,
          screenRatio = width / height;

    if (nodeRatio > screenRatio) {
      const h = height * screenRatio / nodeRatio;
      y.range([(height - h) / 2, height - (height - h) / 2]);
    }
    else {
      const w = width * nodeRatio / screenRatio;
      x.range([(width - w) / 2, width - (width - w) / 2]);
    }

    nodes.forEach(n => {
      n.x = x(n.fx);
      n.y = y(n.fy);
    });

    const rExtent = extent(nodes.map(n => n.r));
    let rMax = this._sizeMax || max([1, min(
      merge(nodes
        .map(n1 => nodes
          .map(n2 => n1 === n2 ? null : shapes.pointDistance([n1.x, n1.y], [n2.x, n2.y]))
        )
      )
    ) / 2]);

    const r = scales[`scale${this._sizeScale.charAt(0).toUpperCase()}${this._sizeScale.slice(1)}`]()
                .domain(rExtent).range([rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, this._sizeMin]), rMax]),
          xDomain = x.domain(),
          yDomain = y.domain();

    const xOldSize = xDomain[1] - xDomain[0],
          yOldSize = yDomain[1] - yDomain[0];

    nodes.forEach(n => {
      const size = r(n.r);
      if (xDomain[0] > x.invert(n.x - size)) xDomain[0] = x.invert(n.x - size);
      if (xDomain[1] < x.invert(n.x + size)) xDomain[1] = x.invert(n.x + size);
      if (yDomain[0] > y.invert(n.y - size)) yDomain[0] = y.invert(n.y - size);
      if (yDomain[1] < y.invert(n.y + size)) yDomain[1] = y.invert(n.y + size);
    });

    const xNewSize = xDomain[1] - xDomain[0],
          yNewSize = yDomain[1] - yDomain[0];

    rMax *= min([xOldSize / xNewSize, yOldSize / yNewSize]);
    r.range([rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, this._sizeMin]), rMax]);
    x.domain(xDomain);
    y.domain(yDomain);

    const fallbackRadius = (nodeRatio > screenRatio ? width : height) / 2;
    nodes.forEach(n => {
      n.x = x(n.fx);
      n.fx = n.x;
      n.y = y(n.fy);
      n.fy = n.y;
      n.r = r(n.r) || fallbackRadius;
      n.width = n.r * 2;
      n.height = n.r * 2;
    });

    this._container = this._select.selectAll("svg.d3plus-network").data([0]);

    this._container = this._container.enter().append("svg")
        .attr("class", "d3plus-network")
        .attr("opacity", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("x", this._margin.left)
        .attr("y", this._margin.top)
        .style("background-color", "transparent")
      .merge(this._container);

    this._container.transition().duration(duration)
      .attr("opacity", 1)
      .attr("width", width)
      .attr("height", height)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top);

    const hitArea = this._container.selectAll("rect.d3plus-network-hitArea").data([0]);
    hitArea.enter().append("rect")
        .attr("class", "d3plus-network-hitArea")
      .merge(hitArea)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .on("click", () => {
          if (this._focus) {
            this.active(false);
            this._focus = undefined;
            this._zoomToBounds(null);
          }
        });

    this._zoomGroup = this._container.selectAll("g.d3plus-network-zoomGroup").data([0]);
    const parent = this._zoomGroup = this._zoomGroup.enter().append("g")
        .attr("class", "d3plus-network-zoomGroup")
      .merge(this._zoomGroup);

    const strokeExtent = extent(links, d => d.size);
    if (strokeExtent[0] !== strokeExtent[1]) {
      const strokeScale = scales[`scale${this._linkSizeScale.charAt(0).toUpperCase()}${this._linkSizeScale.slice(1)}`]()
        .domain(strokeExtent)
        .range([this._linkSizeMin, r.range()[0]]);
      links.forEach(link => {
        link.size = strokeScale(link.size);
      });
    }

    const linkConfig = configPrep.bind(this)(this._shapeConfig, "edge", "Path");
    delete linkConfig.on;

    this._shapes.push(new shapes.Path()
      .config(linkConfig)
      .strokeWidth(d => d.size)
      .activeStyle({
        "stroke-width": d => d.size
      })
      .d(d => `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`)
      .data(links)
      .select(elem("g.d3plus-network-links", {parent, duration, enter: {transform}, update: {transform}}).node())
      .render());

    const shapeConfig = {
      label: d => nodes.length <= this._dataCutoff || (this._hover && this._hover(d) || this._active && this._active(d)) ? this._drawLabel(d.data || d.node, d.i) : false,
      select: elem("g.d3plus-network-nodes", {parent, duration, enter: {transform}, update: {transform}}).node()
    };

    nest().key(d => d.shape).entries(nodes).forEach(d => {
      this._shapes.push(new shapes[d.key]()
        .config(configPrep.bind(this)(this._shapeConfig, "shape", d.key))
        .config(shapeConfig)
        .config(shapeConfig[d.key] || {})
        .data(d.values)
        .render());
    });

    return this;

  }

  /**
      @memberof Network
      @desc If *value* is specified, sets the hover method to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
   */
  hover(_) {
    this._hover = _;

    if (this._nodes.length < this._dataCutoff) {
      this._shapes.forEach(s => s.hover(_));
      if (this._legend) this._legendClass.hover(_);
    }

    return this;
  }

  /**
      @memberof Network
      @desc A predefined *Array* of edges that connect each object passed to the [node](#Network.node) method. The `source` and `target` keys in each link need to map to the nodes in one of three ways:
1. The index of the node in the nodes array (as in [this](http://d3plus.org/examples/d3plus-network/getting-started/) example).
2. The actual node *Object* itself.
3. A *String* value matching the `id` of the node.

The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.
      @param {Array|String} *links* = []
      @param {Function} [*formatter*]
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
      @memberof Network
      @desc Defines the thickness of the links connecting each node. The value provided can be either a pixel Number to be used for all links, or an accessor function that returns a specific data value to be used in an automatically calculated linear scale.
      @param {Function|Name} [*value* = 1]
      @chainable
  */
  linkSize(_) {
    return arguments.length ? (this._linkSize = typeof _ === "function" ? _ : constant(_), this) : this._linkSize;
  }

  /**
      @memberof Network
      @desc Defines the minimum pixel stroke width used in link sizing.
      @param {Number} [*value* = 2]
      @chainable
  */
  linkSizeMin(_) {
    return arguments.length ? (this._linkSizeMin = _, this) : this._linkSizeMin;
  }

  /**
      @memberof Network
      @desc Sets the specific type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of links in the network.
      @param {String} [*value* = "sqrt"]
      @chainable
  */
  linkSizeScale(_) {
    return arguments.length ? (this._linkSizeScale = _, this) : this._linkSizeScale;
  }

  /**
      @memberof Network
      @desc If *value* is specified, sets the node group accessor(s) to the specified string, function, or array of values and returns the current class instance. This method overrides the default .groupBy() function from being used with the data passed to .nodes(). If *value* is not specified, returns the current node group accessor.
      @param {String|Function|Array} [*value* = "id"]
      @chainable
  */
  nodeGroupBy(_) {
    if (!arguments.length) return this._nodeGroupBy;
    if (!(_ instanceof Array)) _ = [_];
    return this._nodeGroupBy = _.map(k => {
      if (typeof k === "function") return k;
      else {
        if (!this._aggs[k]) {
          this._aggs[k] = (a, c) => {
            const v = Array.from(new Set(a.map(c)));
            return v.length === 1 ? v[0] : v;
          };
        }
        return accessor(k);
      }
    }), this;
  }

  /**
      @memberof Network
      @desc The list of nodes to be used for drawing the network. The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.
      @param {Array|String} *nodes* = []
      @param {Function} [*formatter*]
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
      @memberof Network
      @desc If *value* is specified, sets the size accessor to the specified function or data key and returns the current class instance. If *value* is not specified, returns the current size accessor.
      @param {Function|String} [*value*]
      @chainable
  */
  size(_) {
    return arguments.length ? (this._size = typeof _ === "function" || !_ ? _ : accessor(_), this) : this._size;
  }

  /**
      @memberof Network
      @desc Defines the maximum pixel radius used in size scaling. By default, the maximum size is determined by half the distance of the two closest nodes.
      @param {Number} [*value*]
      @chainable
  */
  sizeMax(_) {
    return arguments.length ? (this._sizeMax = _, this) : this._sizeMax;
  }

  /**
      @memberof Network
      @desc Defines the minimum pixel radius used in size scaling.
      @param {Number} [*value* = 5]
      @chainable
  */
  sizeMin(_) {
    return arguments.length ? (this._sizeMin = _, this) : this._sizeMin;
  }

  /**
      @memberof Network
      @desc Sets the specific type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of nodes in the network.
      @param {String} [*value* = "sqrt"]
      @chainable
  */
  sizeScale(_) {
    return arguments.length ? (this._sizeScale = _, this) : this._sizeScale;
  }

  /**
      @memberof Network
      @desc If *value* is specified, sets the x accessor to the specified function or string matching a key in the data and returns the current class instance. The data passed to .data() takes priority over the .nodes() data array. If *value* is not specified, returns the current x accessor. By default, the x and y positions are determined dynamically based on default force layout properties.
      @param {Function|String} [*value*]
      @chainable
  */
  x(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._x = _;
      else {
        this._x = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = mean;
      }
      return this;
    }
    else return this._x;
  }

  /**
      @memberof Network
      @desc If *value* is specified, sets the y accessor to the specified function or string matching a key in the data and returns the current class instance. The data passed to .data() takes priority over the .nodes() data array. If *value* is not specified, returns the current y accessor. By default, the x and y positions are determined dynamically based on default force layout properties.
      @param {Function|String} [*value*]
      @chainable
  */
  y(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._y = _;
      else {
        this._y = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = mean;
      }
      return this;
    }
    else return this._y;
  }

}
