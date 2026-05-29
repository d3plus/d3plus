import {groups} from "d3-array";
import {
  sankey,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyLinkHorizontal,
  sankeyRight,
} from "d3-sankey";

const sankeyAligns = {
  center: sankeyCenter,
  justify: sankeyJustify,
  left: sankeyLeft,
  right: sankeyRight,
};

import {addToQueue} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import {constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import {sankeyDef} from "./ChartDefinition.js";
import Viz from "./Viz.js";

// E4: Sankey's identity-coerce accessors. installFluent installs them; the
// data-loading accessors (`links`/`nodes`) and the d3-sankey-aligned setter
// (`nodeAlign` string→method) stay hand-written.
const sankeySchema = [
  {key: "iterations", coerce: "identity" as const},
  {key: "linkSort", coerce: "identity" as const},
  {key: "nodeSort", coerce: "identity" as const},
  {key: "nodeWidth", coerce: "identity" as const},
];

/**
    Creates a sankey visualization based on a defined set of nodes and links. [Click here](http://d3plus.org/examples/d3plus-network/sankey-diagram/) for help getting started using the Sankey class.
*/
export default class Sankey extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    // E3+E4: scalar defaults from sankeyDef + accessor methods from
    // installFluent(sankeySchema). Non-schema fields (nodeId, links,
    // linksSource, linksTarget, noDataMessage, nodes, nodeAlign, nodePadding)
    // stay imperative — their accessors either have chart-specific coercion or
    // are not exposed as fluent methods at all.
    this._nodeId = sankeyDef.defaults.nodeId;
    this._links = sankeyDef.defaults.links;
    this._linksSource = sankeyDef.defaults.linksSource as string;
    this._linksTarget = sankeyDef.defaults.linksTarget as string;
    this._noDataMessage = sankeyDef.defaults.noDataMessage as false;
    this._nodes = sankeyDef.defaults.nodes;
    this._nodeAlign = sankeyDef.defaults.nodeAlign;
    this._nodePadding = sankeyDef.defaults.nodePadding as number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, sankeySchema, {
      iterations: sankeyDef.defaults.iterations,
      linkSort: undefined,
      nodeSort: undefined,
      nodeWidth: sankeyDef.defaults.nodeWidth,
    });
    this._on.mouseenter = () => {};
    this._on["mouseleave.shape"] = () => {
      this.hover(false);
    };
    const defaultMouseMove = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d: any, i: any, x: any, event: any) => {
      defaultMouseMove(d, i, x, event);
      if (this._focus && this._focus === d.id) {
        this.hover(false);
        this._on.mouseenter.bind(this)(d, i, x, event);

        this._focus = undefined;
      } else {
        const id = this._nodeId(d, i),
          node = this._nodeLookup[id],
          nodeLookup = Object.keys(this._nodeLookup).reduce((all, item) => {
            (all as any)[this._nodeLookup[item] as string] = !isNaN(
              item as unknown as number,
            )
              ? parseInt(item, 10)
              : item;
            return all;
          }, {});

        const links = this._linkLookup[node];
        const filterIds = [id];

        links.forEach((l: any) => {
          filterIds.push((nodeLookup as any)[l]);
        });

        this.hover((h: any, x: any) => {
          if (h.source && h.target) {
            return h.source.id === id || h.target.id === id;
          } else {
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
          "stroke-width": (d: any) =>
            Math.max(
              1,
              Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) -
                2,
            ),
        },
        label: false,
        stroke: "#DBDBDB",
        strokeOpacity: 0.5,
        strokeWidth: (d: any) =>
          Math.max(
            1,
            Math.abs(d.source.y1 - d.source.y0) * (d.value / d.source.value) -
              2,
          ),
      },
      Rect: {},
    });
    this._value = constant(1);
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
      width = this._width - this._margin.left - this._margin.right;

    const _nodes = Array.isArray(this._nodes)
      ? this._nodes
      : this._links
          .reduce((all: any, d: any) => {
            if (!all.includes(d[this._linksSource]))
              all.push(d[this._linksSource]);
            if (!all.includes(d[this._linksTarget]))
              all.push(d[this._linksTarget]);
            return all;
          }, [])
          .map((id: any) => ({id}));

    const nodes = _nodes.map((n: any, i: any) => ({
      __d3plus__: true,
      data: n,
      i,
      id: this._nodeId(n, i),
      node: n,
      shape: "Rect",
    }));

    const nodeLookup = (this._nodeLookup = nodes.reduce((obj: any, d: any, i: any) => {
      obj[d.id] = i;
      return obj;
    }, {}));

    const links = this._links.map((link: any, i: any) => {
      const check = [this._linksSource, this._linksTarget];
      const linkLookup = check.reduce((result: any, item: any) => {
        result[item] = nodeLookup[link[item]];
        return result;
      }, {});
      return {
        source: linkLookup[this._linksSource],
        target: linkLookup[this._linksTarget],
        value: this._value(link, i),
      };
    });

    this._linkLookup = links.reduce((obj: any, d: any) => {
      if (!obj[d.source]) obj[d.source] = [];
      obj[d.source].push(d.target);
      if (!obj[d.target]) obj[d.target] = [];
      obj[d.target].push(d.source);
      return obj;
    }, {});

    this._sankey
      .nodeAlign(this._nodeAlign)
      .nodePadding(this._nodePadding)
      .nodeWidth(this._nodeWidth)
      .nodes(nodes)
      .nodeSort(this._nodeSort)
      .links(links)
      .linkSort(this._linkSort)
      .iterations(this._iterations)
      .size([width, height])();

    // Links + node groups emitted by sankeyDef.emit.
    const nodeGroups = Array.from(groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ));
    this._sankeyCtx = {links, nodeGroups, pathFn: this._path};
    this._chartScene = sankeyDef.emit({viz: this});
    this._chartTransform = {x: this._margin.left, y: this._margin.top};
    return this;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(_: any) {
    this._hover = _;
    this._shapes.forEach((s: any) => s.hover(_));
    if (this._legend) this._legendClass.hover(_);

    return this;
  }

  /**
      A pass-through for the d3-sankey [iterations](https://github.com/d3/d3-sankey?tab=readme-ov-file#sankey_iterations) function.
*/
  // iterations() generated by installFluent(sankeySchema).

  /**
      A predefined *Array* of edges that connect each object passed to the [node](#Sankey.node) method. The `source` and `target` keys in each link need to map to the nodes in one of one way:
1. A *String* value matching the `id` of the node.

The value passed should be an *Array* of data. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.
    @param f Array of link objects or a URL to load links from.
*/
  links(_: any, f?: any) {
    if (arguments.length) {
      (addToQueue as any).bind(this as any)(_, f, "links");
      return this;
    }
    return this._links;
  }

  /**
      A pass-through for the d3-sankey [linkSort](https://github.com/d3/d3-sankey?tab=readme-ov-file#sankey_linkSort) function.
*/
  // linkSort() generated by installFluent(sankeySchema).

  /**
      The key inside of each link Object that references the source node.
*/
  linksSource(_: any) {
    return arguments.length
      ? ((this._linksSource = _), this)
      : this._linksSource;
  }

  /**
      The key inside of each link Object that references the target node.
*/
  linksTarget(_: any) {
    return arguments.length
      ? ((this._linksTarget = _), this)
      : this._linksTarget;
  }

  /**
      The nodeAlign property of the sankey layout, which can be "left", "right", "center", or "justify".
*/
  nodeAlign(_: any) {
    return arguments.length
      ? ((this._nodeAlign = typeof _ === "function" ? _ : (sankeyAligns as any)[_]),
        this)
      : this._nodeAlign;
  }

  /**
      The node id accessor(s).
*/
  nodeId(_: any) {
    return arguments.length
      ? ((this._nodeId = typeof _ === "function" ? _ : accessor(_)), this)
      : this._nodeId;
  }

  /**
      The list of nodes to be used for drawing the network. The value passed must be an *Array* of data.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.
    @param f Array of node objects or a URL to load nodes from.
*/
  nodes(_: any, f?: any) {
    if (arguments.length) {
      (addToQueue as any).bind(this as any)(_, f, "nodes");
      return this;
    }
    return this._nodes;
  }

  /**
      Padding of the node. By default, the nodePadding size is 8.
*/
  nodePadding(_: any) {
    return arguments.length
      ? ((this._nodePadding = _), this)
      : this._nodePadding;
  }

  /**
      A pass-through for the d3-sankey [nodeSort](https://github.com/d3/d3-sankey?tab=readme-ov-file#sankey_nodeSort) function.
*/
  // nodeSort() generated by installFluent(sankeySchema).

  /**
      Width of the node. By default, the nodeWidth size is 30.
*/
  // nodeWidth() generated by installFluent(sankeySchema).

  /**
      Width of the links.

@example
function value(d) {
  return d.value;
}
*/
  value(_: any) {
    return arguments.length
      ? ((this._value = typeof _ === "function" ? _ : accessor(_)), this)
      : this._value;
  }
}
