import {extent, groups, max, min} from "d3-array";
import * as scales from "d3-scale";
import type {DataPoint} from "@d3plus/data";

import {assign, elem} from "@d3plus/dom";
import {colorLegible} from "@d3plus/color";
import {addToQueue} from "@d3plus/data";
import * as shapes from "../shapes/index.js";
import {accessor, configPrep, constant} from "../utils/index.js";
import Viz from "./Viz.js";

/**
    Creates a ring visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/simple-rings/) for help getting started using the Rings class.
*/
export default class Rings extends Viz {
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
    this._nodes = [];
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
      } else {
        const id =
            this._nodeGroupBy && this._nodeGroupBy[this._drawDepth](d, i)
              ? this._nodeGroupBy[this._drawDepth](d, i)
              : this._id(d, i),
          links = this._linkLookup[id],
          node = this._nodeLookup[id];

        const filterIds = [node.id];
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
          if (h.source && h.target)
            return h.source.id === node.id || h.target.id === node.id;
          else return filterIds.includes(this._ids(h, x)[this._drawDepth]);
        });
      }
    };
    this._on["click.shape"] = d => {
      this._center = d.id;
      // Need to resets margins and padding because we are
      // skipping over the default render method and using
      // _draw directly.
      this._margin = {bottom: 0, left: 0, right: 0, top: 0};
      this._padding = {bottom: 0, left: 0, right: 0, top: 0};
      this._draw();
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
        verticalAlign: "middle",
      },
      Path: {
        fill: "none",
        label: false,
        stroke: "#eee",
        strokeWidth: 1,
      },
    });
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    const data = this._filteredData.reduce((obj, d, i) => {
      obj[this._id(d, i)] = d;
      return obj;
    }, {});

    let nodes = this._nodes;

    if (!this._nodes.length && this._links.length) {
      const nodeIds = Array.from(
        new Set(
          this._links.reduce(
            (ids, link) => ids.concat([link.source, link.target]),
            [],
          ),
        ),
      );
      nodes = nodeIds.map(node =>
        typeof node === "object" ? node : {id: node},
      );
    }

    nodes = nodes.reduce((obj, d, i) => {
      obj[
        this._nodeGroupBy
          ? this._nodeGroupBy[this._drawDepth](d, i)
          : this._id(d, i)
      ] = d;
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
          node: n,
          shape:
            d !== undefined && this._shape(d) !== undefined
              ? this._shape(d)
              : this._shape(n),
        };
      })
      .filter(n => n);

    const nodeLookup = (this._nodeLookup = nodes.reduce((obj, d) => {
      obj[d.id] = d;
      return obj;
    }, {}));

    const links = this._links.map(link => {
      const check = ["source", "target"];
      const edge = check.reduce((result, check) => {
        result[check] =
          typeof link[check] === "number"
            ? nodes[link[check]]
            : nodeLookup[link[check].id || link[check]];
        return result;
      }, {});
      (edge as Record<string, unknown>).size = this._linkSize(link);
      return edge;
    });

    const linkMap = links.reduce((map, link) => {
      if (!map[link.source.id]) {
        map[link.source.id] = [];
      }
      map[link.source.id].push(link);
      if (!map[link.target.id]) {
        map[link.target.id] = [];
      }
      map[link.target.id].push(link);
      return map;
    }, {});

    const duration = this._duration,
      height = this._height - this._margin.top - this._margin.bottom,
      transform = `translate(${this._margin.left}, ${this._margin.top})`,
      width = this._width - this._margin.left - this._margin.right;

    const edges = [],
      radius = min([height, width]) / 2,
      ringWidth = radius / 3;

    const primaryRing = ringWidth,
      secondaryRing = ringWidth * 2;

    const center = nodeLookup[this._center];

    center.x = width / 2;
    center.y = height / 2;
    center.r = this._sizeMin
      ? max([this._sizeMin, primaryRing * 0.65])
      : this._sizeMax
        ? min([this._sizeMax, primaryRing * 0.65])
        : primaryRing * 0.65;

    const claimed = [center],
      primaries = [];

    linkMap[this._center].forEach(edge => {
      const node = edge.source.id === this._center ? edge.target : edge.source;
      node.edges = linkMap[node.id].filter(
        link =>
          link.source.id !== this._center || link.target.id !== this._center,
      );
      node.edge = edge;

      claimed.push(node);
      primaries.push(node);
    });

    primaries.sort((a, b) => a.edges.length - b.edges.length);

    const secondaries = [];
    let totalEndNodes = 0;

    primaries.forEach(p => {
      const primaryId = p.id;

      p.edges = p.edges.filter(
        edge =>
          (!claimed.includes(edge.source) && edge.target.id === primaryId) ||
          (!claimed.includes(edge.target) && edge.source.id === primaryId),
      );

      totalEndNodes += p.edges.length || 1;

      p.edges.forEach(edge => {
        const {source, target} = edge;
        const claim = target.id === primaryId ? source : target;
        claimed.push(claim);
      });
    });

    const tau = Math.PI * 2;
    let offset = 0;

    primaries.forEach((p, i) => {
      const children = p.edges.length || 1;
      const space = (tau / totalEndNodes) * children;

      if (i === 0) {
        offset -= space / 2;
      }

      const angle = offset + space / 2 - tau / 4;

      p.radians = angle;
      p.x = width / 2 + primaryRing * Math.cos(angle);
      p.y = height / 2 + primaryRing * Math.sin(angle);

      offset += space;

      p.edges.forEach((edge, i) => {
        const node = edge.source.id === p.id ? edge.target : edge.source;
        const s = tau / totalEndNodes;
        const a = angle - (s * children) / 2 + s / 2 + s * i;

        node.radians = a;
        node.x = width / 2 + secondaryRing * Math.cos(a);
        node.y = height / 2 + secondaryRing * Math.sin(a);

        secondaries.push(node);
      });
    });

    const primaryDistance = ringWidth / 2;
    const secondaryDistance = ringWidth / 4;

    let primaryMax = primaryDistance / 2 - 4;
    if (primaryDistance / 2 - 4 < 8) {
      primaryMax = min([primaryDistance / 2, 8]);
    }

    let secondaryMax = secondaryDistance / 2 - 4;
    if (secondaryDistance / 2 - 4 < 4) {
      secondaryMax = min([secondaryDistance / 2, 4]);
    }

    if (secondaryMax > ringWidth / 10) {
      secondaryMax = ringWidth / 10;
    }

    if (secondaryMax > primaryMax && secondaryMax > 10) {
      secondaryMax = primaryMax * 0.75;
    }
    if (primaryMax > secondaryMax * 1.5) {
      primaryMax = secondaryMax * 1.5;
    }

    primaryMax = Math.floor(primaryMax);
    secondaryMax = Math.floor(secondaryMax);

    let radiusFn;

    if (this._size) {
      const domain = extent(data, (d: {size: number}) => d.size) as [
        number,
        number,
      ];

      if (domain[0] === domain[1]) {
        domain[0] = 0;
      }

      radiusFn = scales
        .scaleLinear()
        .domain(domain)
        .rangeRound([3, min([primaryMax, secondaryMax]) as number]);

      const val = center.size;
      center.r = radiusFn(val);
    } else {
      radiusFn = scales
        .scaleLinear()
        .domain([1, 2])
        .rangeRound([primaryMax, secondaryMax]);
    }

    secondaries.forEach(s => {
      s.ring = 2;
      const val = this._size ? s.size : 2;
      s.r = this._sizeMin
        ? max([this._sizeMin, radiusFn(val)])
        : this._sizeMax
          ? min([this._sizeMax, radiusFn(val)])
          : radiusFn(val);
    });

    primaries.forEach(p => {
      p.ring = 1;
      const val = this._size ? p.size : 1;
      p.r = this._sizeMin
        ? max([this._sizeMin, radiusFn(val)])
        : this._sizeMax
          ? min([this._sizeMax, radiusFn(val)])
          : radiusFn(val);
    });

    nodes = [center].concat(primaries).concat(secondaries);

    primaries.forEach(p => {
      const check = ["source", "target"];
      const {edge} = p;

      check.forEach(node => {
        edge[node] = nodes.find(n => n.id === edge[node].id);
      });

      edges.push(edge);

      linkMap[p.id].forEach(edge => {
        const node = edge.source.id === p.id ? edge.target : edge.source;

        if (node.id !== center.id) {
          let target = secondaries.find(s => s.id === node.id);

          if (!target) {
            target = primaries.find(s => s.id === node.id);
          }

          if (target) {
            edge.spline = true;

            const centerX = width / 2;
            const centerY = height / 2;
            const middleRing =
              primaryRing + (secondaryRing - primaryRing) * 0.5;

            const check = ["source", "target"];

            check.forEach((node, i) => {
              edge[`${node}X`] =
                edge[node].x +
                Math.cos(
                  edge[node].ring === 2
                    ? edge[node].radians + Math.PI
                    : edge[node].radians,
                ) *
                  edge[node].r;
              edge[`${node}Y`] =
                edge[node].y +
                Math.sin(
                  edge[node].ring === 2
                    ? edge[node].radians + Math.PI
                    : edge[node].radians,
                ) *
                  edge[node].r;
              edge[`${node}BisectX`] =
                centerX + middleRing * Math.cos(edge[node].radians);
              edge[`${node}BisectY`] =
                centerY + middleRing * Math.sin(edge[node].radians);

              edge[node] = nodes.find(n => n.id === edge[node].id);

              if (edge[node].edges === undefined) edge[node].edges = {};

              const oppId = i === 0 ? edge.target.id : edge.source.id;

              if (edge[node].id === p.id) {
                edge[node].edges[oppId] = {
                  angle: p.radians + Math.PI,
                  radius: ringWidth / 2,
                };
              } else {
                edge[node].edges[oppId] = {
                  angle: target.radians,
                  radius: ringWidth / 2,
                };
              }
            });

            edges.push(edge);
          }
        }
      });
    });

    nodes.forEach(node => {
      if (node.id !== this._center) {
        const fontSize =
          (this._shapeConfig.labelConfig.fontSize &&
            this._shapeConfig.labelConfig.fontSize(node)) ||
          11;
        const lineHeight = fontSize * 1.4;
        const height = lineHeight * 2;
        const padding = 5;
        const width = ringWidth - node.r;

        let angle = node.radians * (180 / Math.PI);
        let x = node.r + padding;
        let textAnchor = "start";

        if (angle < -90 || angle > 90) {
          x = -node.r - width - padding;
          textAnchor = "end";
          angle += 180;
        }

        node.labelBounds = {
          x,
          y: -lineHeight / 2,
          width,
          height,
        };

        node.rotate = angle;
        node.textAnchor = textAnchor;
      } else {
        node.labelBounds = {
          x: -primaryRing / 2,
          y: -primaryRing / 2,
          width: primaryRing,
          height: primaryRing,
        };
      }
    });

    this._linkLookup = links.reduce((obj, d) => {
      if (!obj[d.source.id]) obj[d.source.id] = [];
      obj[d.source.id].push(d.target);
      if (!obj[d.target.id]) obj[d.target.id] = [];
      obj[d.target.id].push(d.source);
      return obj;
    }, {});

    const strokeExtent = extent(links, (d: {size: number}) => d.size);
    if (strokeExtent[0] !== strokeExtent[1]) {
      const radius = min(nodes as {r: number}[], (d: {r: number}) => d.r);
      const strokeScale = scales[
        `scale${this._linkSizeScale.charAt(0).toUpperCase()}${this._linkSizeScale.slice(1)}`
      ]()
        .domain(strokeExtent)
        .range([this._linkSizeMin, radius]);
      links.forEach(link => {
        link.size = strokeScale(link.size);
      });
    }

    const linkConfig = configPrep.bind(this)(this._shapeConfig, "edge", "Path");
    delete linkConfig.on;

    this._shapes.push(
      new shapes.Path()
        .config(linkConfig)
        .strokeWidth(d => d.size)
        .id(d => `${(d.source as DataPoint).id}_${(d.target as DataPoint).id}`)
        .d(d =>
          d.spline
            ? `M${d.sourceX},${d.sourceY}C${d.sourceBisectX},${d.sourceBisectY} ${d.targetBisectX},${d.targetBisectY} ${d.targetX},${d.targetY}`
            : `M${(d.source as DataPoint).x},${(d.source as DataPoint).y} ${(d.target as DataPoint).x},${(d.target as DataPoint).y}`,
        )
        .data(edges)
        .select(
          elem("g.d3plus-rings-links", {
            parent: this._select,
            duration,
            enter: {transform},
            update: {transform},
          }).node(),
        )
        .render(),
    );

    const that = this;

    const shapeConfig = {
      label: d =>
        nodes.length <= this._dataCutoff ||
        (this._hover && this._hover(d)) ||
        (this._active && this._active(d))
          ? this._drawLabel(d.data || d.node, d.i)
          : false,
      labelBounds: d => d.labelBounds,
      labelConfig: {
        fontColor: d =>
          d.id === this._center
            ? configPrep
                .bind(that)(that._shapeConfig, "shape", d.key)
                .labelConfig.fontColor(d)
            : colorLegible(
                configPrep
                  .bind(that)(that._shapeConfig, "shape", d.key)
                  .fill(d),
              ),
        fontResize: d => d.id === this._center,
        padding: 0,
        textAnchor: d =>
          nodeLookup[d.id].textAnchor ||
          configPrep.bind(that)(that._shapeConfig, "shape", d.key).labelConfig
            .textAnchor,
        verticalAlign: d => (d.id === this._center ? "middle" : "top"),
      },
      rotate: d => nodeLookup[d.id].rotate || 0,
      select: elem("g.d3plus-rings-nodes", {
        parent: this._select,
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
        new shapes[key]()
          .config(configPrep.bind(this)(this._shapeConfig, "shape", key))
          .config(shapeConfig)
          .data(values)
          .render(),
      );
    });

    return this;
  }

  /**
   The center node, specified by id.
*/
  center(_) {
    return arguments.length ? ((this._center = _), this) : this._center;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(_) {
    this._hover = _;

    this._shapes.forEach(s => s.hover(_));
    if (this._legend) this._legendClass.hover(_);

    return this;
  }

  /**
      A predefined *Array* of edges that connect each object passed to the [node](#Rings.node) method. The `source` and `target` keys in each link need to map to the nodes in one of three ways:
1. The index of the node in the nodes array (as in [this](http://d3plus.org/examples/d3plus-network/getting-started/) example).
2. The actual node *Object* itself.
3. A *String* value matching the `id` of the node.

The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.
    @param f Array of link objects or a URL to load links from.
*/
  links(_, f) {
    if (arguments.length) {
      addToQueue.bind(this)(_, f, "links");
      return this;
    }
    return this._links;
  }

  /**
      Defines the thickness of the links connecting each node. The value provided can be either a pixel Number to be used for all links, or an accessor function that returns a specific data value to be used in an automatically calculated linear scale.
*/
  linkSize(_) {
    return arguments.length
      ? ((this._linkSize = typeof _ === "function" ? _ : constant(_)), this)
      : this._linkSize;
  }

  /**
      Defines the minimum pixel stroke width used in link sizing.
*/
  linkSizeMin(_) {
    return arguments.length
      ? ((this._linkSizeMin = _), this)
      : this._linkSizeMin;
  }

  /**
      The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of links in the network.
*/
  linkSizeScale(_) {
    return arguments.length
      ? ((this._linkSizeScale = _), this)
      : this._linkSizeScale;
  }

  /**
      The node group accessor(s). This method overrides the default .groupBy() function from being used with the data passed to .nodes().
*/
  nodeGroupBy(_) {
    if (!arguments.length) return this._nodeGroupBy;
    if (!(_ instanceof Array)) _ = [_];
    return (
      (this._nodeGroupBy = _.map(k => {
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
      })),
      this
    );
  }

  /**
      The list of nodes to be used for drawing the rings network. The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.
    @param f Array of node objects or a URL to load nodes from.
*/
  nodes(_, f) {
    if (arguments.length) {
      addToQueue.bind(this)(_, f, "nodes");
      return this;
    }
    return this._nodes;
  }

  /**
      The size accessor for each node in the rings layout.
*/
  size(_) {
    return arguments.length
      ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_)), this)
      : this._size;
  }

  /**
      The size scale maximum. By default, the maximum size is determined by half the distance of the two closest nodes.
*/
  sizeMax(_) {
    return arguments.length ? ((this._sizeMax = _), this) : this._sizeMax;
  }

  /**
      The size scale minimum.
*/
  sizeMin(_) {
    return arguments.length ? ((this._sizeMin = _), this) : this._sizeMin;
  }

  /**
      The size scale.
*/
  sizeScale(_) {
    return arguments.length ? ((this._sizeScale = _), this) : this._sizeScale;
  }
}
