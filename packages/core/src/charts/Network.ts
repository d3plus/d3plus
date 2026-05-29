import {mean, min} from "d3-array";
import type {DataPoint} from "@d3plus/data";
import {zoomTransform} from "d3-zoom";

import {assign} from "@d3plus/dom";
import {addToQueue} from "@d3plus/data";
import {constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import {applyNetworkLayout, networkDef} from "./ChartDefinition.js";
import {ensureZoomDom} from "./ensureZoomDom.js";
import {runStages} from "./stages.js";
import Viz from "./Viz.js";

// E4: simple identity accessors generated via installFluent. `linkSize` uses
// "const" coerce so its setter coerces non-functions to `constant(_)` (matching
// the hand-written body). `size`/`nodeGroupBy`/`x`/`y`/`nodes` stay hand-written
// because their setters have chart-specific side effects (aggs registration,
// data-loading queue).
const networkSchema = [
  {key: "linkSize", coerce: "const" as const},
  {key: "linkSizeMin", coerce: "identity" as const},
  {key: "linkSizeScale", coerce: "identity" as const},
  {key: "sizeMax", coerce: "identity" as const},
  {key: "sizeMin", coerce: "identity" as const},
  {key: "sizeScale", coerce: "identity" as const},
];

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
    // E3+E4: scalar defaults from networkDef + accessor methods from
    // installFluent(networkSchema). installFluent seeds linkSize/linkSizeMin/
    // linkSizeScale into the corresponding `_<key>` slots; remaining defaults
    // (links/noDataMessage/nodeGroupBy/nodes) are not exposed as schema-driven
    // accessors and stay imperative.
    this._links = networkDef.defaults.links as any[];
    this._noDataMessage = networkDef.defaults.noDataMessage as false;
    this._nodeGroupBy = networkDef.defaults.nodeGroupBy as any[];
    this._nodes = networkDef.defaults.nodes as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, networkSchema, {
      linkSize: networkDef.defaults.linkSize,
      linkSizeMin: networkDef.defaults.linkSizeMin,
      linkSizeScale: networkDef.defaults.linkSizeScale,
    });
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
    this._sizeMin = networkDef.defaults.sizeMin as number;
    this._sizeScale = networkDef.defaults.sizeScale as string;
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

    // Network-specific layout (force simulation + radius scaling + link/node
    // lookups + linkConfig/linkD/nodeGroups) runs as `applyNetworkLayout` on
    // `networkDef.stages`. The stage writes `_nodeLookup`/`_linkLookup`/
    // `_networkCtx` back onto the viz; emit consumes `_networkCtx` and
    // produces the SceneNodes.
    const {shapeData} = runStages({viz: this} as any, [applyNetworkLayout]);

    const duration = this._duration,
      height = this._height - this._margin.top - this._margin.bottom,
      width = this._width - this._margin.left - this._margin.right;

    // DOM container + zoom group + hitArea: extracted to ensureZoomDom
    // because d3-zoom needs a real DOM element to bind to and Network's
    // hitArea click handler closes over class state. The chart-data
    // SCENE rides the scene graph (below) — only the zoom-event-binding
    // surface stays imperative.
    ensureZoomDom(this, {kind: "network", width, height, duration});

    this._chartScene = networkDef.emit({viz: this, shapeData} as any);
    this._chartTransform = {x: this._margin.left, y: this._margin.top};

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

  // linkSize, linkSizeMin, linkSizeScale generated by installFluent(networkSchema).

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

  // sizeMax, sizeMin, sizeScale generated by installFluent(networkSchema).

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
