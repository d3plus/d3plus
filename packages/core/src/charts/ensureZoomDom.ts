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

    Once the v5 interaction-layer redesign lands (DOM-free zoom event
    dispatching, tile-data → image scene nodes), this helper goes away.
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Viz = any;

export type ZoomDomKind = "network" | "geomap";

interface SetupOpts {
  /** "network" or "geomap" — picks the css class + behavior tweaks. */
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

export function ensureZoomDom(viz: Viz, opts: SetupOpts): void {
  const {kind, width, height, duration, ocean} = opts;
  const cls = kind === "network" ? "d3plus-network" : "d3plus-geomap";
  const bg = kind === "geomap" ? ocean || "transparent" : "transparent";

  viz._container = viz._select.selectAll(`svg.${cls}`).data([0]);
  viz._container = viz._container
    .enter()
    .append("svg")
    .attr("class", cls)
    .attr("opacity", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("x", viz._margin.left)
    .attr("y", viz._margin.top)
    .style("background-color", bg)
    .merge(viz._container);

  viz._container
    .transition()
    .duration(duration)
    .attr("opacity", 1)
    .attr("width", width)
    .attr("height", height)
    .attr("x", viz._margin.left)
    .attr("y", viz._margin.top);

  if (kind === "network") {
    // Hit-area for "click outside any node" → reset focus + zoom.
    const hitArea = viz._container
      .selectAll(`rect.${cls}-hitArea`)
      .data([0]);
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
          viz.active(false);
          viz._focus = undefined;
          viz._zoomToBounds(null);
        }
      });

    viz._zoomGroup = viz._container
      .selectAll(`g.${cls}-zoomGroup`)
      .data([0]);
    viz._zoomGroup = viz._zoomGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-zoomGroup`)
      .merge(viz._zoomGroup);
  } else {
    // Geomap also needs an ocean rect (under tiles + paths) and the tile
    // group that `_renderTiles` mutates with map imagery.
    const oceanRect = viz._container
      .selectAll(`rect.${cls}-ocean`)
      .data([0]);
    oceanRect
      .enter()
      .append("rect")
      .attr("class", `${cls}-ocean`)
      .merge(oceanRect)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", ocean || "transparent");

    viz._tileGroup = viz._container
      .selectAll(`g.${cls}-tileGroup`)
      .data([0]);
    viz._tileGroup = viz._tileGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-tileGroup`)
      .merge(viz._tileGroup);

    viz._zoomGroup = viz._container
      .selectAll(`g.${cls}-zoomGroup`)
      .data([0]);
    viz._zoomGroup = viz._zoomGroup
      .enter()
      .append("g")
      .attr("class", `${cls}-zoomGroup`)
      .merge(viz._zoomGroup);
  }
}
