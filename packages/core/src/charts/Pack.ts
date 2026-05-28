import {assign} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import {applyPackLayout, packDef} from "./ChartDefinition.js";
import {runStages} from "./stages.js";
import Viz from "./Viz.js";

// Pack's identity-coerce accessor schema. `layoutPadding` is shared with
// Treemap; `sort` is the d3-hierarchy comparator. `packOpacity`/`sum` retain
// hand-written setters (function-coerce + accessor-coerce respectively).
const packSchema = [
  {key: "layoutPadding", coerce: "identity" as const},
  {key: "sort", coerce: "identity" as const},
];

const recursionCircles = (
  d: Record<string, unknown>,
  arr: Record<string, unknown>[] = [],
) => {
  if (d.values) {
    (d.values as Record<string, unknown>[]).forEach(h => {
      arr.push(h);
      recursionCircles(h, arr);
    });
  } else {
    arr.push(d);
  }
  return arr;
};

/**
    Uses the [d3 pack layout](https://github.com/d3/d3-hierarchy#pack) to creates Circle Packing chart based on an array of data.
*/
export default class Pack extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    // E4: install identity-coerce accessors (layoutPadding, sort). Defaults
    // for layoutPadding are seeded from packDef; sort gets seeded later
    // (installFluent skips slots that are already set).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, packSchema, {
      layoutPadding: packDef.defaults.layoutPadding,
    });

    const defaultLegend = this._legend;
    this._legend = (config: any, arr: any) => {
      if (arr.length === this._filteredData.length) return false;
      return defaultLegend.bind(this)(config, arr);
    };

    this._on.mouseenter = () => {};

    const defaultMouseMoveLegend = this._on["mousemove.legend"];
    this._on["mousemove.legend"] = (d: any, i: any, x: any, event: any) => {
      defaultMouseMoveLegend(d, i, x, event);

      const ids = this._ids(d, i);
      const hoverData = recursionCircles(d);

      this.hover((h: any) => {
        const hover = Object.keys(h)
          .filter(key => key !== "value")
          .every(key => d[key] && d[key].includes(h[key]));

        if (hover) hoverData.push(h);
        else if (ids.includes(h.key))
          hoverData.push(...recursionCircles(h, [h]));

        return hoverData.includes(h);
      });
    };
    const defaultMouseMoveShape = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d: any, i: any, x: any, event: any) => {
      if (d.__d3plusTooltip__) defaultMouseMoveShape(d, i, x, event);
      const hoverData = recursionCircles(d, [d]);
      this.hover((h: any) => hoverData.includes(h));
    };

    // E3: scalar defaults sourced from packDef.
    this._pack = packDef.defaults.pack;
    this._packOpacity = packDef.defaults.packOpacity;
    this._shape = packDef.defaults.shape;
    this._shapeConfig = assign(this._shapeConfig, {
      Circle: {
        label: (d: any) => (d.parent && !d.children ? d.id : false),
        labelConfig: {
          fontResize: true,
        },
        opacity: (d: any) => d.__d3plusOpacity__,
      },
    });
    this._sort = packDef.defaults.sort;
    this._sum = packDef.defaults.sum;
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    // Pack's chart-specific layout (d3-hierarchy pack + descendant filter +
    // opacity assignment) runs as the `applyPackLayout` stage on
    // `packDef.stages`. The result feeds into `packDef.emit(ctx)` for the
    // Circle SceneNodes. No more `_shapes.push(new Circle()...)` glue.
    const ctx = runStages({viz: this} as any, [applyPackLayout]) as unknown as {
      shapeData: any[];
    };
    const shapeData = ctx.shapeData || [];
    this._chartScene = packDef.emit({viz: this, shapeData} as any);
    this._chartTransform = {
      x: this._margin.left + (this._packOffsetX || 0),
      y: this._margin.top + (this._packOffsetY || 0),
    };
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

  // layoutPadding(_: any): installed by installFluent(this, packSchema).

  /**
      The opacity of nested circles within the pack layout.
*/
  packOpacity(_: any) {
    return arguments.length
      ? ((this._packOpacity = typeof _ === "function" ? _ : constant(_)), this)
      : this._packOpacity;
  }

  // sort(_: any): installed by installFluent(this, packSchema).

  /**
      The sum accessor used for sizing each circle in the pack layout.

@example
function sum(d) {
  return d.sum;
}
*/
  sum(_: any) {
    return arguments.length
      ? ((this._sum = typeof _ === "function" ? _ : accessor(_)), this)
      : this._sum;
  }
}
