import {select} from "d3-selection";
import {computePosition, arrow as arrowMiddleware, offset, flip, shift} from "@floating-ui/dom";
import type {VirtualElement} from "@floating-ui/dom";

import {colorContrast, colorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {assign, elem, stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {accessor, BaseClass, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

/** Tooltip's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const tooltipSchema: ConfigField[] = [
  {key: "arrow", coerce: "const", default: accessor("arrow", "")},
  {key: "background", coerce: "const", default: constant(colorDefaults.light)},
  {key: "body", coerce: "const", default: accessor("body", "")},
  {key: "border", coerce: "const", default: constant("1px solid rgba(0, 0, 0, 0.25)")},
  {key: "borderRadius", coerce: "const", default: constant("4px")},
  {key: "className", coerce: "identity", default: "d3plus-tooltip"},
  {key: "footer", coerce: "const", default: accessor("footer", "")},
  {key: "height", coerce: "const", default: constant("auto")},
  {key: "id", coerce: "const", default: (d: DataPoint, i: number) => `${i}`},
  {key: "offset", coerce: "const", default: constant(5)},
  {key: "padding", coerce: "const", default: constant("10px")},
  {key: "pointerEvents", coerce: "const", default: constant("auto")},
  {key: "tbody", coerce: "identity", default: []},
  {key: "thead", coerce: "identity", default: []},
  {key: "title", coerce: "const", default: accessor("title", "")},
  {key: "maxWidth", coerce: "const", default: constant("300px")},
  {key: "minWidth", coerce: "const", default: constant("200px")},
  {key: "width", coerce: "const", default: constant("auto")},
];

/**
 * Creates a virtual reference element for Floating UI.
 * @param {Number[]} position
 * @private
*/
function generateReference(
  position: number[] = [0, 0],
): VirtualElement {
  return {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      x: position[0],
      y: position[1],
      top: position[1],
      right: position[0],
      bottom: position[1],
      left: position[0],
    }),
  };
}

/**
 * Positions a tooltip using Floating UI.
 * @private
 */
async function positionTooltip(
  reference: VirtualElement | HTMLElement,
  tooltip: HTMLElement,
  arrowEl: HTMLElement,
  offsetVal: number,
  arrowDistance: number,
  arrowHeight: number,
) {
  const {x, y, placement, middlewareData} = await computePosition(reference, tooltip, {
    // `fixed` positions the tooltip against the viewport, so it can overflow
    // its chart's bounds and `flip`/`shift` keep it inside the viewport
    // (not the chart container). Pairs with the body-level portal in
    // `resolvePortal` and `position: fixed` below.
    strategy: "fixed",
    placement: "top",
    middleware: [
      offset(offsetVal + arrowDistance),
      flip({fallbackPlacements: ["bottom"], padding: 5}),
      shift({padding: 5}),
      arrowMiddleware({element: arrowEl}),
    ],
  });

  Object.assign(tooltip.style, {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    visibility: "visible",
  });

  const flipped = placement === "bottom";
  const border = parseFloat(arrowEl.style.borderRightWidth) || 0;
  if (flipped) {
    arrowEl.style.transform = "rotate(225deg)";
    arrowEl.style.top = `-${arrowHeight / 2 + border}px`;
    arrowEl.style.bottom = "";
  } else {
    arrowEl.style.transform = "rotate(45deg)";
    arrowEl.style.bottom = `-${arrowHeight / 2 + border}px`;
    arrowEl.style.top = "";
  }
  arrowEl.style.left = middlewareData.arrow?.x != null ? `${middlewareData.arrow.x}px` : "";
}

/**
    Resolves the portal selection the tooltips mount into: a per-instance
    `.d3plus-tooltip-portal` appended to `<body>`, or the global portal div.
*/
function resolvePortal(that: Tooltip): D3Selection {
  // Default behavior — append to body via the global #d3plus-portal —
  // preserved when parent() isn't set.
  if (!that._parentEl) return elem("div#d3plus-portal");
  // Per-instance portal: each Tooltip owns its own `.d3plus-tooltip-portal`.
  // It's mounted on `<body>` (not inside `_parentEl`) so the tooltip lives at
  // the viewport level — free to overflow its chart's bounds and immune to
  // styling/clipping from the chart's container (e.g. a docs page reset).
  // `_parentEl` (set via parent()) still scopes ownership so multiple charts
  // on a page each get their own portal rather than fighting over one.
  let host = that._portalEl ?? null;
  if (!host || !host.isConnected) {
    host = document.createElement("div");
    host.setAttribute("class", "d3plus-tooltip-portal");
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.pointerEvents = "none";
    document.body.appendChild(host);
    that._portalEl = host;
  }
  return select(host) as unknown as D3Selection;
}

/**
    Creates DIV elements with a unique class and styles.
    @private
*/
function divElement(
  that: Tooltip,
  enter: D3Selection,
  update: D3Selection,
  cat: string,
): void {
  enter
    .append("div")
    .attr("class", `d3plus-tooltip-${cat}`)
    .attr(
      "id",
      ((d: DataPoint, i: number) =>
        `d3plus-tooltip-${cat}-${d ? that.schema.id(d, i) : ""}`) as never,
    );

  const div = update
    .select(`.d3plus-tooltip-${cat}`)
    .html(
      ((d: DataPoint, i: number) =>
        (
          that.schema as Record<
            string,
            (d: DataPoint, i: number) => unknown
          >
        )[cat](d, i) as string) as never,
    )
    .style("display", ((d: DataPoint, i: number) => {
      const val = (
        that.schema as Record<
          string,
          (d: DataPoint, i: number) => unknown
        >
      )[cat](d, i);
      const visible = val !== false && val !== undefined && val !== null;
      return visible ? "block" : "none";
    }) as never);

  stylize(
    div,
    (that.schema as Record<string, Record<string, string>>)[
      `${cat}Style`
    ],
  );
}

/**
    Sets styles for both enter and update.
    @private
*/
function boxStyles(that: Tooltip, box: D3Selection): void {
  box
    .style("background", that.schema.background as never)
    .style("border-radius", that.schema.borderRadius as never)
    .style("pointer-events", that.schema.pointerEvents as never)
    .style("padding", that.schema.padding as never)
    .style("max-width", that.schema.maxWidth as never)
    .style("min-width", that.schema.minWidth as never)
    .style("width", that.schema.width as never)
    .style("height", that.schema.height as never)
    .style("border", that.schema.border as never);
}

/**
    Builds the tooltip table (thead + tbody) from the configured columns/rows.
    @private
*/
function buildTable(
  that: Tooltip,
  enter: D3Selection,
  update: D3Selection,
  cellContent: (this: HTMLElement, d: unknown) => string,
): void {
  const tableEnter = enter
    .append("table")
    .attr("class", "d3plus-tooltip-table");
  const table = update.select(".d3plus-tooltip-table");
  stylize(table, that.schema.tableStyle);

  tableEnter.append("thead").attr("class", "d3plus-tooltip-thead");
  const tableHead = update.select(".d3plus-tooltip-thead");
  stylize(tableHead, that.schema.theadStyle);
  const theadTr = tableHead.selectAll("tr").data([0]);
  const theadTrEnter = theadTr.enter().append("tr");
  theadTr.exit().remove();
  const theadTrUpdate = theadTr.merge(theadTrEnter as never);
  stylize(theadTrUpdate as never, that.schema.trStyle as Record<string, string | number | boolean | null>);
  const th = theadTrUpdate.selectAll("th").data(that.schema.thead);
  th.enter()
    .append("th")
    .merge(th as never)
    .html(cellContent as never);
  th.exit().remove();

  tableEnter.append("tbody").attr("class", "d3plus-tooltip-tbody");
  const tableBody = update.select(".d3plus-tooltip-tbody");
  stylize(tableBody, that.schema.tbodyStyle);
  const tr = tableBody.selectAll("tr").data(that.schema.tbody);
  const trEnter = tr.enter().append("tr");
  tr.exit().remove();
  const trUpdate = tr.merge(trEnter as never);
  stylize(trUpdate as never, that.schema.trStyle as Record<string, string | number | boolean | null>);
  const td = trUpdate.selectAll("td").data((d: unknown) => d as unknown[]);
  td.enter()
    .append("td")
    .merge(td as never)
    .html(cellContent as never);
  stylize(td, that.schema.tdStyle);
}

/**
    Binds enter/update/exit: assigns ids, positions each tooltip via Floating
    UI, refreshes positions on update, and cleans up refs on exit.
    @private
*/
function bindTooltips(
  that: Tooltip,
  enter: D3Selection,
  update: D3Selection,
  tooltips: D3Selection,
): void {
  enter
    .attr(
      "id",
      ((d: DataPoint, i: number) =>
        `d3plus-tooltip-${d ? that.schema.id(d, i) : ""}`) as never,
    )
    .style("visibility", "hidden")
    .call(box => boxStyles(that, box as never))
    .each(function (this: unknown, d: DataPoint, i: number) {
      const id = that.schema.id(d, i);
      const tooltip = document.getElementById(`d3plus-tooltip-${id}`)!;
      const arrowEl = document.getElementById(`d3plus-tooltip-arrow-${id}`)!;
      const arrowHeight = arrowEl.offsetHeight;
      const arrowDistance = arrowEl.getBoundingClientRect().height / 2;
      arrowEl.style.bottom = `-${arrowHeight / 2}px`;

      const position = that.schema.position(d, i);
      const reference: VirtualElement | HTMLElement = Array.isArray(position)
        ? generateReference(position)
        : position as HTMLElement;

      that._tooltipRefs[id] = {reference, arrowEl, tooltip, arrowHeight, arrowDistance};
      positionTooltip(reference, tooltip, arrowEl, that.schema.offset(d, i), arrowDistance, arrowHeight);
    } as never);

  update
    .each(function (this: unknown, d: DataPoint, i: number) {
      const id = that.schema.id(d, i);
      const position = that.schema.position(d, i);
      const ref = that._tooltipRefs[id];

      if (ref) {
        ref.reference = Array.isArray(position)
          ? generateReference(position as number[])
          : position as HTMLElement;
        positionTooltip(ref.reference, ref.tooltip, ref.arrowEl, that.schema.offset(d, i), ref.arrowDistance, ref.arrowHeight);
      }
    } as never)
    .call(box => boxStyles(that, box as never));

  tooltips
    .exit()
    .each(function (this: unknown, d: unknown, i: number) {
      const id = that.schema.id(d as DataPoint, i);
      delete that._tooltipRefs[id];
    })
    .remove();
}

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
  _tooltipRefs: Record<string, {reference: VirtualElement | HTMLElement; arrowEl: HTMLElement; tooltip: HTMLElement; arrowHeight: number; arrowDistance: number}>;

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
      "text-align": "center"
    };
    this.schema.tooltipStyle = {
      "box-shadow": "0 1px 5px rgba(0, 0, 0, 0.25)",
      color: ((d: DataPoint, i: number) => colorContrast(this.schema.background(d, i) as string)) as unknown as string,
      "font-family": fontFamilyStringify(fontFamily),
    };
    this.schema.trStyle = {
      "border-top": (d: unknown, i: number) =>
        i ? "1px solid rgba(0, 0, 0, 0.1)" : "none",
    };
    this.schema.tdStyle = {};
  }

  /**
      The inner return object and draw function that gets assigned the public methods.
      @private
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    const that = this;

    const portal = resolvePortal(this);
    const tooltips = portal
      .selectAll(`.${this.schema.className}`)
      .data(this._data, this.schema.id) as unknown as D3Selection;

    const enter = tooltips.enter().append("div").attr("class", this.schema.className) as unknown as D3Selection;

    const update = tooltips.merge(enter as never) as unknown as D3Selection;
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
      CSS styles applied to the arrow element.
*/
  arrowStyle(): Record<string, string>;
  arrowStyle(_: Record<string, string>): this;
  arrowStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.arrowStyle = assign(this.schema.arrowStyle, _!)), this)
      : this.schema.arrowStyle;
  }

  /**
      CSS styles applied to the body element.
*/
  bodyStyle(): Record<string, string>;
  bodyStyle(_: Record<string, string>): this;
  bodyStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.bodyStyle = assign(this.schema.bodyStyle, _!)), this)
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
      ? ((this.schema.footerStyle = assign(this.schema.footerStyle, _!)), this)
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
      ? ((this.schema.tableStyle = assign(this.schema.tableStyle, _!)), this)
      : this.schema.tableStyle;
  }

  /**
      CSS styles applied to the table body element.
*/
  tbodyStyle(): Record<string, string>;
  tbodyStyle(_: Record<string, string>): this;
  tbodyStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.tbodyStyle = assign(this.schema.tbodyStyle, _!)), this)
      : this.schema.tbodyStyle;
  }

  /**
      CSS styles applied to the table head element.
*/
  theadStyle(): Record<string, string>;
  theadStyle(_: Record<string, string>): this;
  theadStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.theadStyle = assign(this.schema.theadStyle, _!)), this)
      : this.schema.theadStyle;
  }

  /**
      CSS styles applied to the title element.
*/
  titleStyle(): Record<string, string>;
  titleStyle(_: Record<string, string>): this;
  titleStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.titleStyle = assign(this.schema.titleStyle, _!)), this)
      : this.schema.titleStyle;
  }

  /**
      Overall CSS styles applied to the tooltip container.
*/
  tooltipStyle(): Record<string, string>;
  tooltipStyle(_: Record<string, string>): this;
  tooltipStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.tooltipStyle = assign(this.schema.tooltipStyle, _!)), this)
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
      ? ((this.schema.trStyle = assign(this.schema.trStyle, _!)), this)
      : this.schema.trStyle;
  }

  /**
      An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.
*/
  tdStyle(): Record<string, string>;
  tdStyle(_: Record<string, string>): this;
  tdStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this.schema.tdStyle = assign(this.schema.tdStyle, _!)), this)
      : this.schema.tdStyle;
  }
}
