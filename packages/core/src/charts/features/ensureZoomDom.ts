/**
    `ensureZoomDom(viz, kind)` — sets up the inner `<svg>` + zoom group +
    hitArea that d3-zoom and tile-loading need.

    This is the lifecycle half of v4 zoom support. The CONTROLS (zoom-in/
    zoom-out/etc.) ride the scene graph as an HtmlOverlay (see
    `drawSteps/zoomControls.ts`). The zoom-transform application also
    rides the scene graph (`viz._zoomTransform` composed into
    `Viz.toScene()`). But d3-zoom's *event binding* needs a real DOM
    element to bind to, and Geomap's tile-loading mutates the inner
    `<g>` directly — so this helper exists as the documented home for
    that imperative setup.

    Idempotent: calling it again returns the existing nodes. Mutates the
    viz instance with `_container` / `_zoomGroup` (and the Network
    variant also wires the hitArea click handler).

    The helper stays as long as d3-zoom owns event binding and Geomap's
    tile-loading mounts `<g>` elements directly. An eventual fully
    scene-graph-native interaction path (renderer.on(...) dispatch +
    tile-data → image scene nodes) would let this go away; until then,
    it's the documented home for the imperative half of v4 zoom.
*/

import {select} from "d3-selection";

import type {VizInstance as Viz} from "../viz/vizTypes.js";

export type ZoomDomKind = "network" | "geomap" | "generic";

interface SetupOpts {
  /**
      "network" or "geomap" — picks the css class + behavior tweaks. "generic"
      is the bare surface (zoom group + brush host) every other chart gets
      when `zoom` is enabled.
  */
  kind: ZoomDomKind;
  /** Chart-area width (margin-adjusted). */
  width: number;
  /** Chart-area height (margin-adjusted). */
  height: number;
  /** Transition duration for fade-in. */
  duration: number;
  /** Geomap-only: ocean fill color (also used as the svg background). */
  ocean?: string;
}

/** The HTML element the chart's <svg> (and, on canvas, its <canvas>) mount in. */
function hostElement(viz: Viz): HTMLElement | null {
  let host = viz._select?.node()?.parentNode ?? null;
  while (host && !(host instanceof HTMLElement)) host = host.parentNode;
  return host instanceof HTMLElement ? host : null;
}

/**
    Where the zoom DOM mounts. Normally the chart's own <svg>, beneath the
    painted scene. On the Canvas backend that <svg> overlays the <canvas>, so
    Geomap's opaque ocean and basemap tiles would hide the geography painted
    on it; they mount instead in an underlay <svg> stacked beneath the canvas
    (the canvas is transparent wherever there is no geography).
*/
function zoomDomParent(viz: Viz, kind: ZoomDomKind): NonNullable<Viz["_select"]> {
  const host = kind === "geomap" && viz._renderer === "canvas" && !viz._ssr ? hostElement(viz) : null;
  if (!host) return viz._select!;
  // `isolation` makes the host a stacking context, so the underlay's
  // negative z-index puts it beneath the (in-flow) canvas but not beneath
  // the host's own background.
  host.style.isolation = "isolate";
  const underlay = select(host).selectAll<SVGSVGElement, number>(":scope > svg.d3plus-geomap-underlay").data([0]);
  return underlay
    .enter()
    .insert("svg", ":first-child")
    .attr("class", "d3plus-geomap-underlay")
    .style("position", "absolute")
    .style("top", "0")
    .style("left", "0")
    .style("z-index", "-1")
    .style("overflow", "hidden")
    .style("pointer-events", "none")
    .merge(underlay)
    .attr("width", viz.schema.width)
    .attr("height", viz.schema.height) as unknown as NonNullable<Viz["_select"]>;
}

/** Drops a canvas-mode tile underlay once the chart renders to SVG again. */
function removeTileUnderlay(viz: Viz): void {
  const host = hostElement(viz);
  if (host) host.querySelector(":scope > svg.d3plus-geomap-underlay")?.remove();
}

export function ensureZoomDom(viz: Viz, opts: SetupOpts): void {
  const {kind, width, height, duration, ocean} = opts;
  const cls = `d3plus-${kind === "generic" ? "zoom" : kind}`;
  const bg = kind === "geomap" ? ocean || "transparent" : "transparent";

  const parent = zoomDomParent(viz, kind);
  // Adopt a container mounted under the other parent (the renderer changed).
  const existing = viz._container && viz._container.classed(cls) ? viz._container.node() : null;
  if (existing && existing.parentNode !== parent.node())
    parent.node().insertBefore(existing, parent.node().firstChild);
  if (parent !== viz._select) viz._select!.selectAll(":scope > svg.d3plus-geomap").remove();
  else removeTileUnderlay(viz);

  let container = parent.selectAll(`:scope > svg.${cls}`).data([0]);
  container = container
    .enter()
    // First child: beneath the scene, which the renderer paints after it.
    .insert("svg", ":first-child")
    .attr("class", cls)
    .attr("opacity", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("x", viz._margin.left)
    .attr("y", viz._margin.top)
    .style("background-color", bg)
    .merge(container);
  viz._container = container;

  container
    .transition()
    .duration(duration)
    .attr("opacity", 1)
    .attr("width", width)
    .attr("height", height)
    .attr("x", viz._margin.left)
    .attr("y", viz._margin.top);

  if (kind === "generic") {
    let zoomGroup = container.selectAll(`g.${cls}-zoomGroup`).data([0]);
    zoomGroup = zoomGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-zoomGroup`)
      .merge(zoomGroup);
    viz._zoomGroup = zoomGroup;
  } else if (kind === "network") {
    // Hit-area for "click outside any node" → reset focus + zoom.
    const hitArea = container.selectAll(`rect.${cls}-hitArea`).data([0]);
    hitArea
      .enter()
      .append("rect")
      .attr("class", `${cls}-hitArea`)
      .merge(hitArea)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("click", () => {
        if (viz._focus) {
          viz.active!(false);
          viz._focus = undefined;
          viz._zoomToBounds!(null);
        }
      });

    let zoomGroup = container.selectAll(`g.${cls}-zoomGroup`).data([0]);
    zoomGroup = zoomGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-zoomGroup`)
      .merge(zoomGroup);
    viz._zoomGroup = zoomGroup;
  } else {
    // Geomap also needs an ocean rect (under tiles + paths) and the tile
    // group that `_renderTiles` mutates with map imagery.
    const oceanRect = container.selectAll(`rect.${cls}-ocean`).data([0]);
    oceanRect
      .enter()
      .append("rect")
      .attr("class", `${cls}-ocean`)
      .merge(oceanRect)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", ocean || "transparent");

    let tileGroup = container.selectAll(`g.${cls}-tileGroup`).data([0]);
    tileGroup = tileGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-tileGroup`)
      .merge(tileGroup);
    viz._tileGroup = tileGroup;

    let zoomGroup = container.selectAll(`g.${cls}-zoomGroup`).data([0]);
    zoomGroup = zoomGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-zoomGroup`)
      .merge(zoomGroup);
    viz._zoomGroup = zoomGroup;
  }
}
