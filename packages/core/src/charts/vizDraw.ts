/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizDraw(viz)` — the Viz `_draw` phase as a free function.

    RFC §3.1 architectural seam: the chart-shell layout phase (feature
    panel reset, legend/colorScale margin claims, title/subtitle/total
    block layout, timeline + top/bottom legend & colorScale claims) used
    to live as `Viz._draw`; extracting it lets callers drive the step
    without going through the class. `Viz._draw` is now a thin shim that
    calls into here, so behavior is unchanged.

    Note: Plot (and other Viz subclasses) OVERRIDE `_draw` and call
    `super._draw(callback)` — that still works through the shim, which
    in turn invokes `vizDraw(this)` with `this` bound to the subclass
    instance.

    @param viz The Viz instance (or any subclass).
*/

import {
  backFeature,
  colorScaleFeature,
  legendFeature,
  runLayout,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./features.js";

export function vizDraw(viz: any): void {
  // E2: reset feature-emitted scene panels at the start of each draw.
  viz._featurePanels = [];
  // Charts that drive emit() (Treemap/Pack/etc.) populate `_chartScene`
  // from within `_draw`. Reset on every draw.
  viz._chartScene = [];
  viz._chartTransform = undefined;
  // Sanitizes user input for legendPosition and colorScalePosition
  let legendPosition = viz._legendPosition.bind(viz)(viz.config());
  if (![false, "top", "bottom", "left", "right"].includes(legendPosition))
    legendPosition = "bottom";
  let colorScalePosition = viz._colorScalePosition.bind(viz)(viz.config());
  if (![false, "top", "bottom", "left", "right"].includes(colorScalePosition))
    colorScalePosition = "bottom";

  // E2: legend (left/right) and colorScale (left/right/hidden) lay out
  // first so the chart body and top-anchored features (title etc.) see
  // their margin claim.
  if (legendPosition === "left" || legendPosition === "right") {
    const claim = runLayout({viz} as any, [legendFeature]);
    viz._margin.left += claim.margin.left;
    viz._margin.right += claim.margin.right;
  }
  if (
    colorScalePosition === "left" ||
    colorScalePosition === "right" ||
    colorScalePosition === false
  ) {
    const claim = runLayout({viz} as any, [colorScaleFeature]);
    viz._margin.left += claim.margin.left;
    viz._margin.right += claim.margin.right;
  }

  // E2: back / title / subtitle / total / timeline / attribution all run
  // through the layout engine. Each feature returns a panel + margin claim;
  // subsequent features see the updated margin and position themselves
  // accordingly.
  const topBlocks = runLayout({viz} as any, [
    backFeature,
    titleFeature,
    subtitleFeature,
    totalFeature,
  ]);
  viz._featurePanels.push(...topBlocks.panels);
  viz._margin.top += topBlocks.margin.top;
  const timelineClaim = runLayout({viz} as any, [timelineFeature]);
  viz._margin.bottom += timelineClaim.margin.bottom;

  // E2: legend (top/bottom) and colorScale (top/bottom).
  if (legendPosition === "top" || legendPosition === "bottom") {
    const claim = runLayout({viz} as any, [legendFeature]);
    viz._margin.top += claim.margin.top;
    viz._margin.bottom += claim.margin.bottom;
  }
  if (colorScalePosition === "top" || colorScalePosition === "bottom") {
    const claim = runLayout({viz} as any, [colorScaleFeature]);
    viz._margin.top += claim.margin.top;
    viz._margin.bottom += claim.margin.bottom;
  }

  viz._shapes = [];

  // Draws a container and zoomGroup to test functionality.
  // viz._testGroup = viz._select.selectAll("g.d3plus-viz-testGroup").data([0]);
  // const enterTest = viz._testGroup.enter().append("g").attr("class", "d3plus-viz-testGroup")
  //   .merge(viz._testGroup);
  // viz._testGroup = enterTest.merge(viz._testGroup);
  // const bgHeight = viz._height - viz._margin.top - viz._margin.bottom;
  // const bgWidth = viz._width - viz._margin.left - viz._margin.right;
  // new Rect()
  //   .data([{id: "background"}])
  //   .select(viz._testGroup.node())
  //   .x(bgWidth / 2 + viz._margin.left)
  //   .y(bgHeight / 2 + viz._margin.top)
  //   .width(bgWidth)
  //   .height(bgHeight)
  //   .fill("#ccc")
  //   .render();

  // viz._zoomGroup = viz._select.selectAll("g.d3plus-viz-zoomGroup").data([0]);
  // const enter = viz._zoomGroup.enter().append("g").attr("class", "d3plus-viz-zoomGroup")
  //   .merge(viz._zoomGroup);

  // viz._zoomGroup = enter.merge(viz._zoomGroup);
  // const testConfig = {
  //   on: {
  //     click: viz._on["click.shape"],
  //     mouseenter: viz._on.mouseenter,
  //     mouseleave: viz._on.mouseleave,
  //     mousemove: viz._on["mousemove.shape"]
  //   }
  // };

  // const testWidth = 50;
  // viz._shapes.push(new Rect()
  //   .config(viz._shapeConfig)
  //   .config(configPrep.bind(viz)(testConfig))
  //   .data(viz._filteredData)
  //   .label("Test Label")
  //   .select(viz._zoomGroup.node())
  //   .id(viz._id)
  //   .x(d => {
  //     if (!d.x) d.x = Math.random() * bgWidth;
  //     return d.x;
  //   })
  //   .y(d => {
  //     if (!d.y) d.y = Math.random() * bgHeight;
  //     return d.y;
  //   })
  //   .width(testWidth)
  //   .height(testWidth)
  //   .render());
}
