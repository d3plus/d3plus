import {select} from "d3-selection";
import type {VirtualElement} from "@floating-ui/dom";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {resetInjectedBoxes} from "@d3plus/render";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {accessor, BaseClass, constant} from "../utils/index.js";
import {setUserClasses} from "../utils/className.js";
import {installFluent, mergeConfigBag, resolvesReset} from "../fluent.js";
import type {ConfigField} from "../fluent.js";
import {
  bindTooltips,
  buildTable,
  divElement,
  resolvePortal,
  TOOLTIP_SELECTORS,
} from "./tooltipDom.js";

/** Tooltip's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
/** Every tooltip element's fixed class; `className` adds classes beside it. */
const TOOLTIP_CLASS = "d3plus-tooltip";

const tooltipSchema: ConfigField[] = [
  {key: "arrow", coerce: "const", default: accessor("arrow", "")},
  {
    key: "background",
    coerce: "const",
    factory: t => () => t.schema.colorDefaults.light,
  },
  {key: "body", coerce: "const", default: accessor("body", "")},
  {
    key: "border",
    coerce: "const",
    default: constant("1px solid rgba(0, 0, 0, 0.25)"),
  },
  {key: "borderRadius", coerce: "const", default: constant("4px")},
  {key: "footer", coerce: "const", default: accessor("footer", "")},
  {key: "height", coerce: "const", default: constant("auto")},
  {key: "id", coerce: "const", default: (d: DataPoint, i: number) => `${i}`},
  {key: "offset", coerce: "const", default: constant(5)},
  {key: "padding", coerce: "const", default: constant("10px")},
  {key: "pointerEvents", coerce: "const", default: constant("auto")},
  {key: "tbody", coerce: "identity", default: []},
  {key: "thead", coerce: "identity", default: []},
  {key: "title", coerce: "const", default: accessor("title", "")},
  {key: "titleSwatch", coerce: "identity", default: true},
  {key: "maxWidth", coerce: "const", default: constant("300px")},
  {key: "minWidth", coerce: "const", default: constant("200px")},
  {key: "width", coerce: "const", default: constant("auto")},
];

/**
    Creates HTML tooltips in the body of a webpage.
*/
export default class Tooltip extends BaseClass {
  // installFluent generates the config accessors (arrow, background, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _data: DataPoint[];
  /** v4: optional per-chart parent element (default: global #d3plus-portal). */
  _parentEl?: HTMLElement;
  /**
   * v4: this Tooltip's own portal div (a `.d3plus-tooltip-portal` appended to
   * `<body>`). Tracked per-instance so that charts each own a distinct portal
   * — and so `parent()` switches only remove THIS instance's portal, not a
   * sibling Tooltip's.
   */
  _portalEl?: HTMLElement;
  _tooltipRefs: Record<
    string,
    {
      reference: VirtualElement | HTMLElement;
      arrowEl: HTMLElement;
      tooltip: HTMLElement;
      arrowHeight: number;
      arrowDistance: number;
    }
  >;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, tooltipSchema);

    this._data = [];
    this._tooltipRefs = {};

    this.schema.arrowStyle = {
      content: "",
      background: "inherit",
      border: "inherit",
      "border-width": "0 1px 1px 0",
      height: "10px",
      position: "absolute",
      transform: "rotate(45deg)",
      width: "10px",
    };
    this.schema.bodyStyle = {
      "font-size": "12px",
      "font-weight": "400",
      "z-index": "1",
    };
    this.schema.footerStyle = {
      "font-size": "9px",
      "font-weight": "400",
      "margin-top": "5px",
      "z-index": "1",
    };
    this.schema.position = (d: DataPoint) => [d.x as number, d.y as number];
    this.schema.tableStyle = {
      "border-collapse": "collapse",
      "border-spacing": "0",
      width: "100%",
    };
    this.schema.tbodyStyle = {
      "font-size": "12px",
      "text-align": "center",
    };
    this.schema.theadStyle = {
      "font-size": "12px",
      "font-weight": "600",
      "text-align": "center",
    };
    this.schema.titleStyle = {
      "font-size": "14px",
      "font-weight": "600",
      "margin-bottom": "5px",
      "text-align": "center",
    };
    this.schema.tooltipStyle = {
      "box-shadow": "0 1px 5px rgba(0, 0, 0, 0.25)",
      color: ((d: DataPoint, i: number) =>
        colorContrast(
          this.schema.background(d, i) as string,
          this.schema.colorDefaults,
        )) as unknown as string,
      "font-family": fontFamilyStringify(fontFamily),
    };
    this.schema.trStyle = {
      "border-top": (d: unknown, i: number) =>
        i ? "1px solid rgba(0, 0, 0, 0.1)" : "none",
    };
    // First column (labels) left-aligned, value columns right-aligned.
    const cellAlign = (_d: unknown, i: number) => (i ? "right" : "left");
    this.schema.tdStyle = {"text-align": cellAlign};
    this.schema.thStyle = {"text-align": cellAlign};
  }

  /**
      The inner return object and draw function that gets assigned the public methods.
      @private
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    const that = this;

    // Join only this instance's tooltips: Tooltips without a parent() share
    // the global portal, and each must leave the others' elements alone.
    const ownPrefix = `d3plus-tooltip-${this._uuid}-`;
    const portal = resolvePortal(this);
    resetInjectedBoxes(portal.node() as Node | null, TOOLTIP_SELECTORS);
    const tooltips = portal
      .selectAll<HTMLElement, DataPoint>(`.${TOOLTIP_CLASS}`)
      .filter(function (this: HTMLElement) {
        return this.id.startsWith(ownPrefix);
      })
      .data(this._data, this.schema.id) as unknown as D3Selection;

    const enter = tooltips
      .enter()
      .append("div")
      .attr("class", TOOLTIP_CLASS) as unknown as D3Selection;

    const update = tooltips.merge(enter as never) as unknown as D3Selection;
    update.each(function (this: unknown) {
      if (this instanceof Element)
        setUserClasses(this, that.schema.className, [TOOLTIP_CLASS]);
    });
    stylize(update, this.schema.tooltipStyle);

    /**
        Fetches table contents given functions or values.
        @private
*/
    function cellContent(this: HTMLElement, d: unknown): string {
      if (typeof d === "function") {
        const datum = select(
          this.parentNode!.parentNode! as Element,
        ).datum() as DataPoint;
        return d(datum, that._data.indexOf(datum), datum) as string;
      } else return d as string;
    }

    divElement(this, enter, update, "title");
    divElement(this, enter, update, "body");

    buildTable(this, enter, update, cellContent);

    divElement(this, enter, update, "footer");

    divElement(this, enter, update, "arrow");

    bindTooltips(this, enter, update, tooltips);

    if (callback) setTimeout(callback, 100);

    return this;
  }

  /**
      CSS classes added to each tooltip element, next to its fixed
      `d3plus-tooltip` class, so page CSS can style these tooltips (a chart
      passes its `tooltipConfig.className`). Takes a space-separated string or
      an array; a new value replaces the classes the previous one added.
*/
  className(): string | string[] | undefined;
  className(_: string | string[] | undefined): this;
  className(
    _?: string | string[] | undefined,
  ): string | string[] | undefined | this {
    return arguments.length ? super.className(_) : super.className();
  }

  /**
      CSS styles applied to the arrow element.
*/
  arrowStyle(): Record<string, string>;
  arrowStyle(_: Record<string, string>): this;
  arrowStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.arrowStyle = mergeConfigBag(this, "arrowStyle", _)), this)
      : this.schema.arrowStyle;
  }

  /**
      CSS styles applied to the body element.
*/
  bodyStyle(): Record<string, string>;
  bodyStyle(_: Record<string, string>): this;
  bodyStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.bodyStyle = mergeConfigBag(this, "bodyStyle", _)), this)
      : this.schema.bodyStyle;
  }

  /**
      Parent element that scopes the tooltip's portal. Default (unset) uses
      the global `<div id="d3plus-portal">` appended to `<body>`. When set,
      tooltips mount inside a `.d3plus-tooltip-portal` child of the given
      element instead — so multiple charts on a page don't fight over the
      global portal, and tooltips destroy cleanly when the chart goes away.

      Viz auto-sets this when rendering: chart.tooltipClass.parent(chart._select.node().parentNode).
*/
  parent(): HTMLElement | undefined;
  parent(_: HTMLElement | null | undefined): this;
  parent(_?: HTMLElement | null | undefined): unknown {
    if (!arguments.length) return this._parentEl;
    const prev = this._parentEl;
    const next = _ || undefined;
    if (prev && prev !== next && this._portalEl) {
      // Switching parents: tear down this Tooltip's own (body-level) portal
      // so it doesn't sit orphaned. A re-render against the new parent
      // creates a fresh one. Other Tooltip instances own their own portals.
      this._portalEl.remove();
      this._portalEl = undefined;
    }
    this._parentEl = next;
    return this;
  }

  /**
      The data array used to create tooltips.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): unknown {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      CSS styles applied to the footer element.
*/
  footerStyle(): Record<string, string>;
  footerStyle(_: Record<string, string>): this;
  footerStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.footerStyle = mergeConfigBag(this, "footerStyle", _)),
        this)
      : this.schema.footerStyle;
  }

  /**
      The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

@example <caption>default accessor</caption>
   function value(d) {
    return [d.x, d.y];
  }
*/
  position(): (d: DataPoint, i?: number) => number[] | HTMLElement;
  position(
    _:
      | ((d: DataPoint, i?: number) => number[] | HTMLElement)
      | number[]
      | HTMLElement
      | string,
  ): this;
  position(
    _?:
      | ((d: DataPoint, i?: number) => number[] | HTMLElement)
      | number[]
      | HTMLElement
      | string,
  ): unknown {
    return arguments.length
      ? ((this.schema.position =
          typeof _ === "string"
            ? (constant((select(_).node() || [0, 0]) as HTMLElement) as (
                d: DataPoint,
                i?: number,
              ) => number[] | HTMLElement)
            : typeof _ === "function"
              ? _
              : (constant(_) as (
                  d: DataPoint,
                  i?: number,
                ) => number[] | HTMLElement)),
        this)
      : this.schema.position;
  }

  /**
      CSS styles applied to the table element.
*/
  tableStyle(): Record<string, string>;
  tableStyle(_: Record<string, string>): this;
  tableStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.tableStyle = mergeConfigBag(this, "tableStyle", _)), this)
      : this.schema.tableStyle;
  }

  /**
      CSS styles applied to the table body element.
*/
  tbodyStyle(): Record<string, string>;
  tbodyStyle(_: Record<string, string>): this;
  tbodyStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.tbodyStyle = mergeConfigBag(this, "tbodyStyle", _)), this)
      : this.schema.tbodyStyle;
  }

  /**
      CSS styles applied to the table head element.
*/
  theadStyle(): Record<string, string>;
  theadStyle(_: Record<string, string>): this;
  theadStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.theadStyle = mergeConfigBag(this, "theadStyle", _)), this)
      : this.schema.theadStyle;
  }

  /**
      CSS styles applied to the title element.
*/
  titleStyle(): Record<string, string>;
  titleStyle(_: Record<string, string>): this;
  titleStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.titleStyle = mergeConfigBag(this, "titleStyle", _)), this)
      : this.schema.titleStyle;
  }

  /**
      Overall CSS styles applied to the tooltip container.
*/
  tooltipStyle(): Record<string, string>;
  tooltipStyle(_: Record<string, string>): this;
  tooltipStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.tooltipStyle = mergeConfigBag(this, "tooltipStyle", _)),
        this)
      : this.schema.tooltipStyle;
  }

  /**
      An object with CSS keys and values to be applied to all <tr> elements inside of each <tbody>.

@example <caption>default styles</caption>
  {
    "border-top": "1px solid rgba(0, 0, 0, 0.1)"
  }
*/
  trStyle(): Record<string, unknown>;
  trStyle(_: Record<string, unknown>): this;
  trStyle(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.trStyle = mergeConfigBag(this, "trStyle", _)), this)
      : this.schema.trStyle;
  }

  /**
      An object with CSS keys and values to be applied to all <td> elements inside of each <tr>. Values may be `(d, i)` functions, where `i` is the cell's column index.

@example <caption>default styles</caption>
  {
    "text-align": (d, i) => i ? "right" : "left"
  }
*/
  tdStyle(): Record<string, unknown>;
  tdStyle(_: Record<string, unknown>): this;
  tdStyle(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.tdStyle = mergeConfigBag(this, "tdStyle", _)), this)
      : this.schema.tdStyle;
  }

  /**
      An object with CSS keys and values to be applied to all <th> elements inside of the <thead>. Values may be `(d, i)` functions, where `i` is the cell's column index.

@example <caption>default styles</caption>
  {
    "text-align": (d, i) => i ? "right" : "left"
  }
*/
  thStyle(): Record<string, unknown>;
  thStyle(_: Record<string, unknown>): this;
  thStyle(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.thStyle = mergeConfigBag(this, "thStyle", _)), this)
      : this.schema.thStyle;
  }
}

resolvesReset(
  Tooltip.prototype,
  "arrowStyle",
  "bodyStyle",
  "footerStyle",
  "tableStyle",
  "tbodyStyle",
  "theadStyle",
  "titleStyle",
  "tooltipStyle",
  "trStyle",
  "tdStyle",
  "thStyle",
);
