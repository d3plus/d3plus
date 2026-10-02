/**
    @name bottomRightControlsFeature
    The bottom-right corner panel: chart chrome anchored in the corner below
    the chart body, currently the size legend. Like the top-left panel it's
    fed by independent contributor functions — a new corner item appends
    its own to `BOTTOM_RIGHT_CONTRIBUTORS`.

    Two steps, split around the chart's layout:
      1. `reserveBottomRight` (called from `vizDrawPure`, before the legend
         and colorScale lay out) measures every contribution from a
         pre-layout estimate and stores the box on `viz._bottomRightBox`, so
         bottom-band content insets around it and the chart body stays
         clear of it.
      2. `bottomRightControlsFeature` (post-draw, see `runVizPipeline`)
         paints each contribution from its final, laid-out state into the
         reserved box.

    @module
*/
import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

import type {FeatureModule} from "../features/features.js";
import {isInsetPending} from "../features/insetState.js";
import {resolveSpec} from "../pipeline/resolveSpec.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {zoomSizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import {buildBottomRightPanel, bottomRightControlsBox, measureBottomRight} from "./bottomRightControlsMarkup.js";
import type {BottomRightContribution} from "./bottomRightControlsMarkup.js";

/** The chart area a contribution may size itself against, before layout. */
export interface BottomRightAvailable {
  width: number;
  height: number;
}

/** The text/stroke color that reads against the chart's background. */
function inkColor(viz: VizInstance): string {
  const node = viz._select && typeof viz._select.node === "function" ? viz._select.node() : null;
  const bg = node ? backgroundColor(node) : "rgb(255, 255, 255)";
  return colorContrast(bg, viz.schema.colorDefaults);
}

/** Configures the size legend for a scale and lays it out, returning its size. */
function layoutSizeLegend(viz: VizInstance, scale: SizeLegendScale): {width: number; height: number} {
  const ink = inkColor(viz);
  const legend = viz._sizeLegendClass!;
  legend
    .renderMode("compute")
    .locale(viz.schema.locale)
    .title(viz._sizeKey)
    .labelConfig({fontColor: ink, fontFamily: viz.schema.fontFamily})
    .titleConfig({fontColor: ink, fontFamily: viz.schema.fontFamily})
    .lineConfig({stroke: ink})
    .shapeConfig({fill: ink, stroke: ink})
    .config(viz.schema.sizeLegendConfig)
    .scale(scale);
  const {width, height} = legend.layout();
  return {width, height};
}

/**
    The size legend's contribution: sized from the chart's pre-layout scale
    estimate, painted from the scale the chart's layout actually drew with.
*/
export function sizeLegendContribution(
  viz: VizInstance,
  available: BottomRightAvailable,
): BottomRightContribution | null {
  if (!viz._sizeLegendClass || typeof viz._sizeLegendScale !== "function") return null;
  const scale = viz._sizeLegendScale(available);
  if (!scale) return null;
  viz._sizeLegendClass._maxRadius = undefined;
  const {width, height} = layoutSizeLegend(viz, scale);
  if (!width || !height) return null;
  const size = {width, height, availableWidth: available.width, availableHeight: available.height};
  if (!viz.schema.sizeLegend.bind(viz)(resolveSpec(viz), scale, size)) return null;
  return {
    key: "sizeLegend",
    width,
    height,
    paint: zoom => {
      const final = viz._sizeLegendFinal;
      if (!final) return null;
      viz._sizeLegendClass!._maxRadius = zoom === 1 ? undefined : final(final.domain()[1]);
      const size = layoutSizeLegend(viz, zoomSizeLegendScale(final, zoom));
      if (!size.width || !size.height) return null;
      return {node: viz._sizeLegendClass!.toScene(), ...size};
    },
  };
}

/**
    Ordered contributors to the bottom-right panel, right to left.
*/
export const BOTTOM_RIGHT_CONTRIBUTORS: Array<
  (viz: VizInstance, available: BottomRightAvailable) => BottomRightContribution | null
> = [sizeLegendContribution];

/**
    Measures the panel for this draw and stores it on `viz._bottomRightBox`
    (null when nothing contributes). `bottom` is how far above the chart's
    bottom edge the panel sits (below it: the timeline); `available` is the
    chart area left after the claims made so far. `sizeLegendPosition`
    picks the margin it claims (see `BottomRightBox.side`).
*/
export function reserveBottomRight(
  viz: VizInstance,
  bottom: number,
  available: BottomRightAvailable,
): void {
  const items: BottomRightContribution[] = [];
  for (const fn of BOTTOM_RIGHT_CONTRIBUTORS) {
    const c = fn(viz, available);
    if (c) items.push(c);
  }
  const side = viz.schema.sizeLegendPosition === "bottom" ? "bottom" : "right";
  const inset = isInsetPending(viz, "sizeLegend");
  viz._bottomRightBox = items.length ? {...measureBottomRight(items), bottom, side, inset, items} : null;
}

export const bottomRightControlsFeature: FeatureModule = {
  name: "bottomRightControls",
  configFields: ["sizeLegend", "sizeLegendConfig", "sizeLegendPosition"],
  layout: ({viz}) => {
    const box = bottomRightControlsBox(viz);
    return {panel: box ? buildBottomRightPanel(viz, box) : null, margin: {}};
  },
};
