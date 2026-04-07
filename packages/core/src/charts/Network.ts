import {extent, groups, max, mean, min, merge} from "d3-array";
import {forceLink, forceManyBody, forceSimulation} from "d3-force";
import type {SimulationNodeDatum, SimulationLinkDatum} from "d3-force";
import type {DataPoint} from "@d3plus/data";
import {polygonHull} from "d3-polygon";
import * as scales from "d3-scale";
import {zoomTransform} from "d3-zoom";

import {assign, elem} from "@d3plus/dom";
import {addToQueue} from "@d3plus/data";
import {largestRect, pointDistance, pointRotate} from "@d3plus/math";
import * as shapes from "../shapes/index.js";
import {accessor, configPrep, constant} from "../utils/index.js";
import Viz from "./Viz.js";

/** Extended node for force simulation with extra properties.*/
interface NetworkNode extends SimulationNodeDatum {
  id: string;
  size?: number;
  shape?: string;
}

/** Extended link for force simulation with a size property.*/
interface NetworkLink extends SimulationLinkDatum<NetworkNode> {
  size?: number;
}

/**
 * Fetches the unique ID for a data point, whether it's defined by data or nodes.
 * @private
*/
function getNodeId(this: Network, d: Record<string, unknown>, i: number) {
  return `${this._id(d, i) || this._nodeGroupBy[min([this._drawDepth, this._nodeGroupBy.length - 1])](d, i)}`;
}

/**
    Creates a network visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/getting-started/) for help getting started using the Network class.
*/
export default class Network extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
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
    this._on["click.shape"] = (d: any, i: any, x: any, event: any) => {
      this._tooltipClass.data([]).render();

      if (this._hover && this._drawDepth >= this._groupBy.length - 1) {
        const id = getNodeId.bind(this)(d, i);

        if (this._focus && this._focus === id) {
          this.active(false);
          this._on.mouseenter.bind(this)(d, i, x, event);

          this._focus = undefined;
          this._zoomToBounds(null);
        } else {
          this.hover(false);

          const links = this._linkLookup[id],
            node = this._nodeLookup[id];

          const filterIds = [id];
          let xDomain = [node.x - node.r, node.x + node.r],
            yDomain = [node.y - node.r, node.y + node.r];

          links.forEach((l: any) => {
            filterIds.push(l.id);
            if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
            if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
            if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
            if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
          });

          this.active((h: any, x: any) => {
            if (h.source && h.target)
              return (
                (h.source as DataPoint).id === id ||
                (h.target as DataPoint).id === id
              );
            else return filterIds.includes(getNodeId.bind(this)(h, x));
          });

          this._focus = id;
          const t = zoomTransform(this._container.node());
          xDomain = xDomain.map(d => d * t.k + t.x);
          yDomain = yDomain.map(d => d * t.k + t.y);
          this._zoomToBounds([
            [xDomain[0], yDomain[0]],
            [xDomain[1], yDomain[1]],
          ]);
        }
      }
    };
    this._on["click.legend"] = (d: any, i: any, x: any, event: any) => {
      const ids = this._id(d);
      let id = this._ids(d);
      id = id[id.length - 1];

      if (this._hover && this._drawDepth >= this._groupBy.length - 1) {
        if (this._focus && this._focus === ids) {
          this.active(false);

          this._focus = undefined;
          this._zoomToBounds(null);
        } else {
          this.hover(false);

          const nodes = ids.map((id: any) => this._nodeLookup[id]);

          const filterIds = [`${id}`];
          let xDomain = [nodes[0].x - nodes[0].r, nodes[0].x + nodes[0].r],
            yDomain = [nodes[0].y - nodes[0].r, nodes[0].y + nodes[0].r];

          nodes.forEach((l: any) => {
            filterIds.push(l.id);
            if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
            if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
            if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
            if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
          });

          this.active((h: any, x: any) => {
            if (h.source && h.target)
              return (
                filterIds.includes((h.source as DataPoint).id as string) &&
                filterIds.includes((h.target as DataPoint).id as string)
              );
            else {
              const myIds = this._ids(h, x);
              return filterIds.includes(`${myIds[myIds.length - 1]}`);
            }
          });

          this._focus = ids;
          const t = zoomTransform(this._container.node());
          xDomain = xDomain.map(d => d * t.k + t.x);
          yDomain = yDomain.map(d => d * t.k + t.y);
          this._zoomToBounds([
            [xDomain[0], yDomain[0]],
            [xDomain[1], yDomain[1]],
          ]);
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
    this._on["mousemove.shape"] = (d: any, i: any, x: any, event: any) => {
      defaultMouseMove(d, i, x, event);
      const id = getNodeId.bind(this)(d, i),
        links = this._linkLookup[id] || [],
        node = this._nodeLookup[id];

      const filterIds = [id];
      const xDomain = [node.x - node.r, node.x + node.r],
        yDomain = [node.y - node.r, node.y + node.r];

      links.forEach((l: any) => {
        filterIds.push(l.id);
        if (l.x - l.r < xDomain[0]) xDomain[0] = l.x - l.r;
        if (l.x + l.r > xDomain[1]) xDomain[1] = l.x + l.r;
        if (l.y - l.r < yDomain[0]) yDomain[0] = l.y - l.r;
        if (l.y + l.r > yDomain[1]) yDomain[1] = l.y + l.r;
      });

      this.hover((h: any, x: any) => {
        if (h.source && h.target)
          return h.source.id === id || h.target.id === id;
        else return filterIds.includes(`${this._ids(h, x)[this._drawDepth]}`);
      });
    };
    this._sizeMin = 5;
    this._sizeScale = "sqrt";
    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d: any, i: any) => {
        const validSize = this._size ? `, ${this._size(d, i)}` : "";
        return `${this._drawLabel(d, i)}${validSize}.`;
      },
      labelConfig: {
        duration: 0,
        fontMin: 1,
        fontResize: true,
        labelPadding: 0,
        textAnchor: "middle",
        verticalAlign: "middle",
      },
      Path: {
        fill: "none",
        label: false,
        stroke: "#eee",
      },
    });
    this._x = accessor("x");
    this._y = accessor("y");

    this._zoom = true;
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    const duration = this._duration,
      height = this._height - this._margin.top - this._margin.bottom,
      transform = `translate(${this._margin.left}, ${this._margin.top})`,
      width = this._width - this._margin.left - this._margin.right;

    const data = this._filteredData.reduce((obj: any, d: any, i: any) => {
      obj[this._id(d, i)] = d;
      return obj;
    }, {});

    let nodes = this._nodes.reduce((obj: any, d: any, i: any) => {
      obj[getNodeId.bind(this)(d, i)] = d;
      return obj;
    }, {});

    nodes = Array.from(new Set(Object.keys(data).concat(Object.keys(nodes))))
      .map((id, i) => {
        const d = data[id],
          n = nodes[id];

        if (n === undefined) return false;

        return {
          __d3plus__: true,
          data: d || n,
          i,
          id,
          fx: d !== undefined && !isNaN(this._x(d)) ? this._x(d) : this._x(n),
          fy: d !== undefined && !isNaN(this._y(d)) ? this._y(d) : this._y(n),
          node: n,
          r: this._size
            ? d !== undefined && this._size(d) !== undefined
              ? this._size(d)
              : this._size(n)
            : this._sizeMin,
          shape:
            d !== undefined && this._shape(d) !== undefined
              ? this._shape(d)
              : this._shape(n),
        };
      })
      .filter((n): n is Exclude<typeof n, false> => !!n);

    const nodeLookup = (this._nodeLookup = nodes.reduce((obj: any, d: any) => {
      obj[d.id] = d;
      return obj;
    }, {}));

    const nodeIndices = nodes.map((n: any) => n.node);
    const links = this._links.map((l: any) => {
      const referenceType = typeof l.source;
      return {
        size: this._linkSize(l),
        source:
          referenceType === "number"
            ? nodes[nodeIndices.indexOf(this._nodes[l.source])]
            : referenceType === "string"
              ? nodeLookup[l.source]
              : nodeLookup[l.source.id],
        target:
          referenceType === "number"
            ? nodes[nodeIndices.indexOf(this._nodes[l.target])]
            : referenceType === "string"
              ? nodeLookup[l.target]
              : nodeLookup[l.target.id],
      };
    });

    this._linkLookup = links.reduce((obj: any, d: any) => {
      if (!obj[d.source.id]) obj[d.source.id] = [];
      obj[d.source.id].push(d.target);
      if (!obj[d.target.id]) obj[d.target.id] = [];
      obj[d.target.id].push(d.source);
      return obj;
    }, {});

    const missingCoords = nodes.some(
      (n: any) => n.fx === undefined || n.fy === undefined,
    );

    if (missingCoords) {
      const linkStrength = scales
        .scaleLinear()
        .domain(
          extent(links, (d: {size: number}) => d.size) as [number, number],
        )
        .range([0.1, 0.5]);

      const simulation = forceSimulation()
        .force(
          "link",
          forceLink(links as unknown as NetworkLink[])
            .id((d: SimulationNodeDatum) => (d as NetworkNode).id)
            .distance(1)
            .strength((d: NetworkLink) => linkStrength(d.size as number))
            .iterations(4),
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

      const nodePositions = nodes.map((n: any) => [n.vx, n.vy] as [number, number]);
      let angle = 0,
        cx = 0,
        cy = 0;
      if (nodePositions.length === 2) {
        angle = 100;
      } else if (nodePositions.length > 2) {
        const hull = polygonHull(nodePositions) || [];
        const rect = largestRect(hull, {verbose: true})!;
        angle = rect.angle;
        cx = rect.cx;
        cy = rect.cy;
      }

      nodes.forEach((n: any) => {
        const p = pointRotate([n.vx, n.vy], -1 * ((Math.PI / 180) * angle), [
          cx,
          cy,
        ]);
        n.fx = p[0];
        n.fy = p[1];
      });
    }

    const xExtent = extent(nodes.map((n: any) => n.fx)) as unknown as [number, number],
      yExtent = extent(nodes.map((n: any) => n.fy)) as unknown as [number, number];

    const x = scales.scaleLinear().domain(xExtent).range([0, width]),
      y = scales.scaleLinear().domain(yExtent).range([0, height]);

    const nodeRatio =
        (xExtent[1] - xExtent[0]) / (yExtent[1] - yExtent[0]) || 1,
      screenRatio = width / height;

    if (nodeRatio > screenRatio) {
      const h = (height * screenRatio) / nodeRatio;
      y.range([(height - h) / 2, height - (height - h) / 2]);
    } else {
      const w = (width * nodeRatio) / screenRatio;
      x.range([(width - w) / 2, width - (width - w) / 2]);
    }

    nodes.forEach((n: any) => {
      n.x = x(n.fx);
      n.y = y(n.fy);
    });

    const rExtent = extent(nodes.map((n: any) => n.r)) as unknown as [number, number];
    let rMax =
      this._sizeMax ||
      (max([
        1,
        (min(
          merge(
            nodes.map((n1: any) =>
              nodes.map((n2: any) =>
                n1 === n2 ? null : pointDistance([n1.x, n1.y], [n2.x, n2.y]),
              ),
            ),
          ),
        ) as unknown as number) / 2,
      ]) as unknown as number);

    const r = (scales as any)[
        `scale${this._sizeScale.charAt(0).toUpperCase()}${this._sizeScale.slice(1)}`
      ]()
        .domain(rExtent)
        .range([
          rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, this._sizeMin]),
          rMax,
        ]),
      xDomain = x.domain(),
      yDomain = y.domain();

    const xOldSize = xDomain[1] - xDomain[0],
      yOldSize = yDomain[1] - yDomain[0];

    nodes.forEach((n: any) => {
      const size = r(n.r);
      if (xDomain[0] > x.invert(n.x - size)) xDomain[0] = x.invert(n.x - size);
      if (xDomain[1] < x.invert(n.x + size)) xDomain[1] = x.invert(n.x + size);
      if (yDomain[0] > y.invert(n.y - size)) yDomain[0] = y.invert(n.y - size);
      if (yDomain[1] < y.invert(n.y + size)) yDomain[1] = y.invert(n.y + size);
    });

    const xNewSize = xDomain[1] - xDomain[0],
      yNewSize = yDomain[1] - yDomain[0];

    rMax *= min([xOldSize / xNewSize, yOldSize / yNewSize])!;
    r.range([
      rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, this._sizeMin]),
      rMax,
    ]);
    x.domain(xDomain);
    y.domain(yDomain);

    const fallbackRadius = (nodeRatio > screenRatio ? width : height) / 2;
    nodes.forEach((n: any) => {
      n.x = x(n.fx);
      n.fx = n.x;
      n.y = y(n.fy);
      n.fy = n.y;
      n.r = r(n.r) || fallbackRadius;
      n.width = n.r * 2;
      n.height = n.r * 2;
    });

    this._container = this._select.selectAll("svg.d3plus-network").data([0]);

    this._container = this._container
      .enter()
      .append("svg")
      .attr("class", "d3plus-network")
      .attr("opacity", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top)
      .style("background-color", "transparent")
      .merge(this._container);

    this._container
      .transition()
      .duration(duration)
      .attr("opacity", 1)
      .attr("width", width)
      .attr("height", height)
      .attr("x", this._margin.left)
      .attr("y", this._margin.top);

    const hitArea = this._container
      .selectAll("rect.d3plus-network-hitArea")
      .data([0]);
    hitArea
      .enter()
      .append("rect")
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

    this._zoomGroup = this._container
      .selectAll("g.d3plus-network-zoomGroup")
      .data([0]);
    const parent = (this._zoomGroup = this._zoomGroup
      .enter()
      .append("g")
      .attr("class", "d3plus-network-zoomGroup")
      .merge(this._zoomGroup));

    const strokeExtent = extent(links, (d: {size: number}) => d.size);
    if (strokeExtent[0] !== strokeExtent[1]) {
      const strokeScale = (scales as any)[
        `scale${this._linkSizeScale.charAt(0).toUpperCase()}${this._linkSizeScale.slice(1)}`
      ]()
        .domain(strokeExtent)
        .range([this._linkSizeMin, r.range()[0]]);
      links.forEach((link: any) => {
        link.size = strokeScale(link.size);
      });
    }

    const linkConfig = (configPrep as any).bind(this)(this._shapeConfig, "edge", "Path");
    delete linkConfig.on;

    this._shapes.push(
      new shapes.Path()
        .config(linkConfig)
        .strokeWidth((d: any) => d.size)
        .activeStyle({
          "stroke-width": (d: any) => d.size,
        })
        .d(
          d =>
            `M${(d.source as DataPoint).x},${(d.source as DataPoint).y} ${(d.target as DataPoint).x},${(d.target as DataPoint).y}`,
        )
        .data(links)
        .select(
          elem("g.d3plus-network-links", {
            parent,
            duration,
            enter: {transform},
            update: {transform},
          }).node(),
        )
        .render(),
    );

    const shapeConfig = {
      label: (d: any) =>
        nodes.length <= this._dataCutoff ||
        (this._hover && this._hover(d)) ||
        (this._active && this._active(d))
          ? this._drawLabel(d.data || d.node, d.i)
          : false,
      select: elem("g.d3plus-network-nodes", {
        parent,
        duration,
        enter: {transform},
        update: {transform},
      }).node(),
    };

    groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ).forEach(([key, values]) => {
      this._shapes.push(
        new (shapes as any)[key]()
          .config((configPrep as any).bind(this)(this._shapeConfig, "shape", key))
          .config(shapeConfig)
          .config((shapeConfig as any)[key] || {})
          .data(values)
          .render(),
      );
    });

    return this;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(_: any) {
    this._hover = _;

    if (this._nodes.length < this._dataCutoff) {
      this._shapes.forEach((s: any) => s.hover(_));
      if (this._legend) this._legendClass.hover(_);
    }

    return this;
  }

  /**
      A predefined *Array* of edges that connect each object passed to the [node](#Network.node) method. The `source` and `target` keys in each link need to map to the nodes in one of three ways:
1. The index of the node in the nodes array (as in [this](http://d3plus.org/examples/d3plus-network/getting-started/) example).
2. The actual node *Object* itself.
3. A *String* value matching the `id` of the node.

The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.
    @param f Array of link objects or a URL to load links from.
*/
  links(_: any, f?: any) {
    if (arguments.length) {
      (addToQueue as any).bind(this)(_, f, "links");
      return this;
    }
    return this._links;
  }

  /**
      Defines the thickness of the links connecting each node. The value provided can be either a pixel Number to be used for all links, or an accessor function that returns a specific data value to be used in an automatically calculated linear scale.
*/
  linkSize(_?: any) {
    return arguments.length
      ? ((this._linkSize = typeof _ === "function" ? _ : constant(_)), this)
      : this._linkSize;
  }

  /**
      Defines the minimum pixel stroke width used in link sizing.
*/
  linkSizeMin(_?: any) {
    return arguments.length
      ? ((this._linkSizeMin = _), this)
      : this._linkSizeMin;
  }

  /**
      The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of links in the network.
*/
  linkSizeScale(_?: any) {
    return arguments.length
      ? ((this._linkSizeScale = _), this)
      : this._linkSizeScale;
  }

  /**
      The node group accessor(s). This method overrides the default .groupBy() function from being used with the data passed to .nodes().
*/
  nodeGroupBy(_?: any) {
    if (!arguments.length) return this._nodeGroupBy;
    if (!(_ instanceof Array)) _ = [_];
    return (
      (this._nodeGroupBy = _.map((k: any) => {
        if (typeof k === "function") return k;
        else {
          if (!this._aggs[k]) {
            this._aggs[k] = (a: any, c: any) => {
              const v = Array.from(new Set(a.map(c)));
              return v.length === 1 ? v[0] : v;
            };
          }
          return accessor(k);
        }
      })),
      this
    );
  }

  /**
      The list of nodes to be used for drawing the network. The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.
    @param f Array of node objects or a URL to load nodes from.
*/
  nodes(_: any, f?: any) {
    if (arguments.length) {
      (addToQueue as any).bind(this)(_, f, "nodes");
      return this;
    }
    return this._nodes;
  }

  /**
      The size accessor for each node in the network.
*/
  size(_?: any) {
    return arguments.length
      ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_)), this)
      : this._size;
  }

  /**
      Defines the maximum pixel radius used in size scaling. By default, the maximum size is determined by half the distance of the two closest nodes.
*/
  sizeMax(_?: any) {
    return arguments.length ? ((this._sizeMax = _), this) : this._sizeMax;
  }

  /**
      Defines the minimum pixel radius used in size scaling.
*/
  sizeMin(_?: any) {
    return arguments.length ? ((this._sizeMin = _), this) : this._sizeMin;
  }

  /**
      The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of nodes in the network.
*/
  sizeScale(_?: any) {
    return arguments.length ? ((this._sizeScale = _), this) : this._sizeScale;
  }

  /**
      The x position accessor for each node. The data passed to .data() takes priority over the .nodes() data array. By default, the x and y positions are determined dynamically based on default force layout properties.
*/
  x(_?: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._x = _;
      else {
        this._x = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = mean;
      }
      return this;
    } else return this._x;
  }

  /**
      The y position accessor for each node. The data passed to .data() takes priority over the .nodes() data array. By default, the x and y positions are determined dynamically based on default force layout properties.
*/
  y(_?: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._y = _;
      else {
        this._y = accessor(_);
        if (!this._aggs[_]) this._aggs[_] = mean;
      }
      return this;
    } else return this._y;
  }
}
