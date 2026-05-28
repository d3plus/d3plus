import {assign} from "@d3plus/dom";
import {addToQueue} from "@d3plus/data";
import {accessor, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import {applyRingsLayout, ringsDef} from "./ChartDefinition.js";
import {runStages} from "./stages.js";
import Viz from "./Viz.js";

// E4: Rings' identity-coerce accessors (center/sizeMax/sizeMin/sizeScale).
// `linkSize`/`size` retain hand-written setters because of constant/accessor
// coercion side effects.
const ringsSchema = [
  {key: "center", coerce: "identity" as const},
  {key: "sizeMax", coerce: "identity" as const},
  {key: "sizeMin", coerce: "identity" as const},
  {key: "sizeScale", coerce: "identity" as const},
];

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
    // E3: scalar defaults sourced from ringsDef.
    this._links = ringsDef.defaults.links as any[];
    this._linkSize = ringsDef.defaults.linkSize;
    this._linkSizeMin = ringsDef.defaults.linkSizeMin as number;
    this._linkSizeScale = ringsDef.defaults.linkSizeScale as string;
    this._noDataMessage = ringsDef.defaults.noDataMessage as false;
    this._nodes = ringsDef.defaults.nodes as any[];
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
        const id =
            this._nodeGroupBy && this._nodeGroupBy[this._drawDepth](d, i)
              ? this._nodeGroupBy[this._drawDepth](d, i)
              : this._id(d, i),
          links = this._linkLookup[id],
          node = this._nodeLookup[id];

        const filterIds = [node.id];
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
            return h.source.id === node.id || h.target.id === node.id;
          else return filterIds.includes(this._ids(h, x)[this._drawDepth]);
        });
      }
    };
    this._on["click.shape"] = (d: any) => {
      this._center = d.id;
      // Need to resets margins and padding because we are
      // skipping over the default render method and using
      // _draw directly.
      this._margin = {bottom: 0, left: 0, right: 0, top: 0};
      this._padding = {bottom: 0, left: 0, right: 0, top: 0};
      this._draw();
    };
    this._shape = ringsDef.defaults.shape;
    // E4: install Rings' identity-coerce accessors. Defaults for sizeMin and
    // sizeScale come from ringsDef.defaults.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, ringsSchema, {
      sizeMin: ringsDef.defaults.sizeMin,
      sizeScale: ringsDef.defaults.sizeScale,
    });
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
    // Rings-specific layout (node placement, ring sizing, link `d` paths,
    // label bounds, edge stroke scale) runs as `applyRingsLayout` on
    // `ringsDef.stages`. The stage writes `_nodeLookup`/`_linkLookup`/
    // `_ringsCtx` back onto the viz; emit consumes `_ringsCtx`.
    const {shapeData} = runStages({viz: this} as any, [applyRingsLayout]) as unknown as {
      shapeData: any[];
    };
    this._chartScene = ringsDef.emit({viz: this, shapeData} as any);
    this._chartTransform = {x: this._margin.left, y: this._margin.top};

    return this;
  }

  /**
   The center node, specified by id.
*/
  // center() generated by installFluent(ringsSchema).

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
      A predefined *Array* of edges that connect each object passed to the [node](#Rings.node) method. The `source` and `target` keys in each link need to map to the nodes in one of three ways:
1. The index of the node in the nodes array (as in [this](http://d3plus.org/examples/d3plus-network/getting-started/) example).
2. The actual node *Object* itself.
3. A *String* value matching the `id` of the node.

The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded. An optional formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final links *Array*.
    @param f Array of link objects or a URL to load links from.
*/
  links(_: any, f?: any) {
    if (arguments.length) {
      addToQueue.bind(this as any)(_, f, "links");
      return this;
    }
    return this._links;
  }

  /**
      Defines the thickness of the links connecting each node. The value provided can be either a pixel Number to be used for all links, or an accessor function that returns a specific data value to be used in an automatically calculated linear scale.
*/
  linkSize(_: any) {
    return arguments.length
      ? ((this._linkSize = typeof _ === "function" ? _ : constant(_)), this)
      : this._linkSize;
  }

  /**
      Defines the minimum pixel stroke width used in link sizing.
*/
  linkSizeMin(_: any) {
    return arguments.length
      ? ((this._linkSizeMin = _), this)
      : this._linkSizeMin;
  }

  /**
      The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales) used when calculating the pixel size of links in the network.
*/
  linkSizeScale(_: any) {
    return arguments.length
      ? ((this._linkSizeScale = _), this)
      : this._linkSizeScale;
  }

  /**
      The node group accessor(s). This method overrides the default .groupBy() function from being used with the data passed to .nodes().
*/
  nodeGroupBy(_: any) {
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
      The list of nodes to be used for drawing the rings network. The value passed should either be an *Array* of data or a *String* representing a filepath or URL to be loaded.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final node *Array*.
    @param f Array of node objects or a URL to load nodes from.
*/
  nodes(_: any, f?: any) {
    if (arguments.length) {
      addToQueue.bind(this as any)(_, f, "nodes");
      return this;
    }
    return this._nodes;
  }

  /**
      The size accessor for each node in the rings layout.
*/
  size(_: any) {
    return arguments.length
      ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_)), this)
      : this._size;
  }

  // sizeMax(), sizeMin(), sizeScale() generated by installFluent(ringsSchema).
}
