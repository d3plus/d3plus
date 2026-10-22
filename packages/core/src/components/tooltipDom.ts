/**
    The DOM side of `Tooltip`: the portal its tooltips mount into, each
    tooltip's parts (title, body, table, footer, arrow), and their placement
    via Floating UI.
*/
import {select} from "d3-selection";
import {
  computePosition,
  arrow as arrowMiddleware,
  offset,
  flip,
  shift,
} from "@floating-ui/dom";
import type {VirtualElement} from "@floating-ui/dom";

import type {DataPoint} from "@d3plus/data";
import {elem, stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import type Tooltip from "./Tooltip.js";

/**
 * Creates a virtual reference element for Floating UI.
 * @param {Number[]} position
 * @private
 */
function generateReference(position: number[] = [0, 0]): VirtualElement {
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
  const {x, y, placement, middlewareData} = await computePosition(
    reference,
    tooltip,
    {
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
    },
  );

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
  arrowEl.style.left =
    middlewareData.arrow?.x != null ? `${middlewareData.arrow.x}px` : "";
}

/**
    The tooltip's own elements, guarded against generic page CSS (see
    `resetInjectedBoxes`): the portals, the default tooltip box, and its
    parts. The box's `padding`/`border` and each part's `*Style` are inline,
    so tooltip configuration still applies.
*/
export const TOOLTIP_SELECTORS = [
  '[id="d3plus-portal"]',
  ".d3plus-tooltip-portal",
  ".d3plus-tooltip",
  ".d3plus-tooltip-title",
  ".d3plus-tooltip-body",
  ".d3plus-tooltip-footer",
  ".d3plus-tooltip-arrow",
  ".d3plus-tooltip-table",
  ".d3plus-tooltip-thead",
  ".d3plus-tooltip-tbody",
];

/**
    Resolves the portal selection the tooltips mount into: a per-instance
    `.d3plus-tooltip-portal` appended to `<body>`, or the global portal div.
*/
export function resolvePortal(that: Tooltip): D3Selection {
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
    The DOM id of a tooltip (or of its `cat` child element): prefixed with the
    Tooltip instance's uuid so that ids stay unique across charts, then keyed
    per datum by the `id` accessor.
    @private
*/
function elementId(
  that: Tooltip,
  d: DataPoint,
  i: number,
  cat?: string,
): string {
  const prefix = cat ? `d3plus-tooltip-${cat}` : "d3plus-tooltip";
  return `${prefix}-${that._uuid}-${d ? that.schema.id(d, i) : ""}`;
}

/**
    Creates DIV elements with a unique class and styles.
    @private
*/
export function divElement(
  that: Tooltip,
  enter: D3Selection,
  update: D3Selection,
  cat: string,
): void {
  enter
    .append("div")
    .attr("class", `d3plus-tooltip-${cat}`)
    .attr("id", ((d: DataPoint, i: number) =>
      elementId(that, d, i, cat)) as never);

  const div = update
    .select(`.d3plus-tooltip-${cat}`)
    .html(
      ((d: DataPoint, i: number) =>
        (that.schema as Record<string, (d: DataPoint, i: number) => unknown>)[
          cat
        ](d, i) as string) as never,
    )
    .style("display", ((d: DataPoint, i: number) => {
      const val = (
        that.schema as Record<string, (d: DataPoint, i: number) => unknown>
      )[cat](d, i);
      const visible = val !== false && val !== undefined && val !== null;
      return visible ? "block" : "none";
    }) as never);

  stylize(
    div,
    (that.schema as Record<string, Record<string, string>>)[`${cat}Style`],
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
export function buildTable(
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
  stylize(
    theadTrUpdate as never,
    that.schema.trStyle as Record<string, string | number | boolean | null>,
  );
  const th = theadTrUpdate.selectAll("th").data(that.schema.thead);
  const thUpdate = th
    .enter()
    .append("th")
    .merge(th as never)
    .html(cellContent as never);
  stylize(thUpdate as never, that.schema.thStyle);
  th.exit().remove();

  tableEnter.append("tbody").attr("class", "d3plus-tooltip-tbody");
  const tableBody = update.select(".d3plus-tooltip-tbody");
  stylize(tableBody, that.schema.tbodyStyle);
  const tr = tableBody.selectAll("tr").data(that.schema.tbody);
  const trEnter = tr.enter().append("tr");
  tr.exit().remove();
  const trUpdate = tr.merge(trEnter as never);
  stylize(
    trUpdate as never,
    that.schema.trStyle as Record<string, string | number | boolean | null>,
  );
  const td = trUpdate.selectAll("td").data((d: unknown) => d as unknown[]);
  const tdUpdate = td
    .enter()
    .append("td")
    .merge(td as never)
    .html(cellContent as never);
  stylize(tdUpdate as never, that.schema.tdStyle);
}

/**
    Binds enter/update/exit: assigns ids, positions each tooltip via Floating
    UI, refreshes positions on update, and cleans up refs on exit.
    @private
*/
export function bindTooltips(
  that: Tooltip,
  enter: D3Selection,
  update: D3Selection,
  tooltips: D3Selection,
): void {
  enter
    .attr("id", ((d: DataPoint, i: number) => elementId(that, d, i)) as never)
    .style("visibility", "hidden")
    .call(box => boxStyles(that, box as never))
    .each(function (this: HTMLElement, d: DataPoint, i: number) {
      const id = that.schema.id(d, i);
      // Read the entered node and its own arrow, never a document-wide id
      // lookup: another Tooltip's element could answer to the same id.
      const tooltip = this;
      const arrowEl = tooltip.querySelector<HTMLElement>(
        ".d3plus-tooltip-arrow",
      )!;
      const arrowHeight = arrowEl.offsetHeight;
      const arrowDistance = arrowEl.getBoundingClientRect().height / 2;
      arrowEl.style.bottom = `-${arrowHeight / 2}px`;

      const position = that.schema.position(d, i);
      const reference: VirtualElement | HTMLElement = Array.isArray(position)
        ? generateReference(position)
        : (position as HTMLElement);

      that._tooltipRefs[id] = {
        reference,
        arrowEl,
        tooltip,
        arrowHeight,
        arrowDistance,
      };
      positionTooltip(
        reference,
        tooltip,
        arrowEl,
        that.schema.offset(d, i),
        arrowDistance,
        arrowHeight,
      );
    } as never);

  update
    .each(function (this: unknown, d: DataPoint, i: number) {
      const id = that.schema.id(d, i);
      const position = that.schema.position(d, i);
      const ref = that._tooltipRefs[id];

      if (ref) {
        ref.reference = Array.isArray(position)
          ? generateReference(position as number[])
          : (position as HTMLElement);
        positionTooltip(
          ref.reference,
          ref.tooltip,
          ref.arrowEl,
          that.schema.offset(d, i),
          ref.arrowDistance,
          ref.arrowHeight,
        );
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
