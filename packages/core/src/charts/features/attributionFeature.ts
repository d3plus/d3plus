/**
    The tile/data credit, an HTML overlay in the chart area's bottom-right
    corner. It sits outside the SVG plane, so rather than encode it into the
    scene graph this feature creates it imperatively from inside `layout()`
    (funneled through `runLayout` like the other features); it claims zero
    margin and emits no panel.

    A credit that would take up more than half the chart's width collapses to
    an ⓘ badge that expands on hover, focus, or click — the compact
    attribution modern web maps use — so a long required credit (Esri's
    basemap credit, for one) doesn't lay a banner across a small map.

    The badge is an inline SVG by default; `attributionIcon` overrides it with
    raw HTML or a mount function (a live component escape hatch — see its doc
    and `zoomControlsMarkup.ts`'s matching `zoomControlIcons`, which this
    mirrors).

    @module
*/

import {select} from "d3-selection";

import {stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import type {FeatureModule} from "./features.js";
import {chartBounds} from "./chartGeometry.js";
import {attributionStyleDarkDefault, attributionStyleDefault} from "../viz/vizDefaults.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** An "i" in a circle, drawn like the zoom-control icons (see `zoomControlsMarkup.ts`). */
const INFO_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;display:block"><circle cx="12" cy="12" r="10"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="12" y1="7" x2="12" y2="7.01"/></svg>';

/** Markup for a mount-function icon — see `zoomControlsMarkup.ts`'s `iconSlot`. */
const CUSTOM_ICON_SLOT =
  '<span class="d3plus-attribution-icon" style="display:inline-block;width:12px;height:12px;vertical-align:middle;flex-shrink:0"></span>';

/** The toggle button's glyph markup: a custom override, or the built-in "i". */
function toggleIcon(viz: VizInstance): string {
  const icon = viz.schema.attributionIcon;
  if (typeof icon === "string") return icon;
  if (typeof icon === "function") return CUSTOM_ICON_SLOT;
  return INFO_ICON;
}

/**
    Mounts a custom `attributionIcon` mount function into the toggle's
    reserved slot, running any previous mount's cleanup first. Called only
    when the credit's html was JUST rewritten (see the `__d3plusHTML` diff in
    `layout()` below) — i.e. once per fresh slot element, not on every draw.
*/
function mountCustomAttributionIcon(viz: VizInstance, node: HTMLElement): void {
  const icon = viz.schema.attributionIcon;
  if (typeof icon !== "function") return;
  const slot = node.querySelector<HTMLElement>(".d3plus-attribution-icon");
  if (!slot) return;
  viz._attributionIconCleanup?.();
  viz._attributionIconCleanup = icon(slot) || undefined;
}

/** The credit wider than this share of the chart area collapses to a badge. */
const COMPACT_SHARE = 0.5;

/** Shows or hides a compact credit's text. */
function setExpanded(node: HTMLElement, open: boolean): void {
  const text = node.querySelector<HTMLElement>(".d3plus-attribution-text");
  const toggle = node.querySelector<HTMLElement>(".d3plus-attribution-toggle");
  if (text) text.style.display = open ? "" : "none";
  if (toggle) toggle.setAttribute("aria-expanded", String(open));
  node.style.borderRadius = open ? "3px 0 0 0" : "3px 0 0 0";
  node.style.padding = open ? "4px 6px" : "2px";
}

export const attributionFeature: FeatureModule = {
  name: "attribution",
  configFields: ["attribution", "attributionIcon", "attributionStyle"],
  layout: ({viz}) => {
    let attr: D3Selection = select(viz._select.node().parentNode)
      .selectAll("div.d3plus-attribution")
      .data(viz.schema.attribution ? [0] : []) as unknown as D3Selection;

    const attrEnter = attr
      .enter()
      .append("div")
      .attr("class", "d3plus-attribution");

    attr.exit().remove();

    const style =
      viz.schema.attributionStyle === attributionStyleDefault && viz._basemapDark
        ? attributionStyleDarkDefault
        : viz.schema.attributionStyle;

    attr = attr
      .merge(attrEnter as never)
      .style("position", "absolute")
      .style("right", `${viz._margin.right}px`)
      .style("bottom", `${viz._margin.bottom}px`)
      .call(stylize as never, style);

    // Rewrite the markup — and remount a custom icon — only when it actually
    // changed (the credit text, locale, theme, or icon override), the same
    // `__d3plusHTML`-diff idiom `@d3plus/render`'s overlay host uses. `.html()`
    // runs unconditionally on every draw otherwise, which would tear down and
    // rebuild a mounted `attributionIcon` (a React root, say) on every redraw
    // instead of only when its content is due to change.
    const html =
      `<span class="d3plus-attribution-text">${viz.schema.attribution}</span>` +
      `<button type="button" class="d3plus-attribution-toggle" aria-label="${viz.schema.translate("Attribution")}" aria-expanded="true">${toggleIcon(viz)}</button>`;
    const rewriteNode = attr.node() as (HTMLElement & {__d3plusHTML?: string}) | null;
    if (rewriteNode && rewriteNode.__d3plusHTML !== html) {
      rewriteNode.innerHTML = html;
      rewriteNode.__d3plusHTML = html;
      rewriteNode
        .querySelectorAll<HTMLElement>("a")
        .forEach(a => {
          a.style.color = "inherit";
          a.style.textDecoration = "none";
        });
      const toggleEl = rewriteNode.querySelector<HTMLElement>(".d3plus-attribution-toggle");
      if (toggleEl) {
        toggleEl.style.border = "0";
        toggleEl.style.background = "transparent";
        toggleEl.style.color = "inherit";
        toggleEl.style.padding = "0";
        toggleEl.style.flexShrink = "0";
      }
      mountCustomAttributionIcon(viz, rewriteNode);
    }

    const node = attr.node() as HTMLElement | null;
    if (!node) return {panel: null, margin: {}};
    const {width} = chartBounds(viz);
    node.style.maxWidth = `${Math.min(280, width)}px`;

    // Measure the credit on one line to decide whether it collapses.
    const text = node.querySelector<HTMLElement>(".d3plus-attribution-text")!;
    text.style.whiteSpace = "nowrap";
    const compact = text.getBoundingClientRect().width > width * COMPACT_SHARE;
    text.style.whiteSpace = "";
    const toggle = select(node).select(".d3plus-attribution-toggle").style("display", compact ? "" : "none");

    if (!compact) {
      select(node).on(".compact", null);
      setExpanded(node, true);
      return {panel: null, margin: {}};
    }

    // Hover or focus previews the credit; a click pins it open (or closed).
    const show = () => setExpanded(node, Boolean(viz._attributionPinned || node.matches(":hover, :focus-within")));
    select(node)
      .on("mouseenter.compact focusin.compact", () => setExpanded(node, true))
      .on("mouseleave.compact focusout.compact", () => window.setTimeout(show, 0));
    toggle.on("click.compact", () => {
      viz._attributionPinned = !viz._attributionPinned;
      setExpanded(node, viz._attributionPinned);
    });
    setExpanded(node, Boolean(viz._attributionPinned));

    return {panel: null, margin: {}};
  },
};
