/**
    The `colorScaleFeature` FeatureModule, re-exported from `features.ts`.
    The colorScale either claims a margin band along its position side, or —
    while it's being laid out for the chart's interior (see
    `pipeline/insetPlacement.ts`) — lays out at the origin and claims nothing.
*/
import {min, rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint, MergedDataPoint} from "@d3plus/data";
import {elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import {resolveSpec} from "../pipeline/resolveSpec.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {bottomRightClearance} from "../drawSteps/bottomRightControlsMarkup.js";
import type {FeatureModule} from "./features.js";
import {sanitizePosition} from "./features.js";
import {insetFrame, insetOrient, isInsetPending} from "./insetState.js";
import type {InsetOrient} from "./insetState.js";
import type {FacetAccessor} from "../facet/facetConfig.js";
import {facetKey} from "../facet/facetData.js";

/** Where and how the colorScale lays itself out for one render. */
interface ColorScaleFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The side the scale's labels face, which also sets its direction. */
  orient: string | false;
  align: string;
}

/**
    The colorScale's data: the chart's data rolled up per time/id (and per
    small-multiples panel, the values the panels color by), keeping rows with
    a colorScale value.
*/
function colorScaleData(viz: VizInstance): MergedDataPoint[] {
  const facet = viz.schema.facet as FacetAccessor | undefined;
  const data = Array.from(
    rollup(
      viz._data,
      (leaves: DataPoint[]) => merge(leaves, viz.schema.aggs),
      (d: DataPoint, i: number) =>
        `${viz.schema.time ? viz.schema.time(d, i) : "all"}-${facet ? facetKey(facet(d, i)) : "all"}-${viz._ids(d, i).join("_")}`,
    ).values(),
  );
  return data.filter((d: MergedDataPoint, i: number) => {
    const c = viz.schema.colorScale(d as unknown as DataPoint, i);
    return c !== undefined && c !== null;
  });
}

/**
    Configures and lays out the chart's `_colorScaleClass` into `frame`. It
    always runs in compute mode: Viz.toScene composes its scene, so the
    colorScale never paints a DOM copy of its own.
*/
function paintColorScale(viz: VizInstance, frame: ColorScaleFrame, show: boolean): void {
  const transform = {
    opacity: frame.orient ? 1 : 0,
    transform: `translate(${frame.x}, ${frame.y})`,
  };

  const scaleGroup = elem("g.d3plus-viz-colorScale", {
    condition: show && !viz.schema.colorScaleConfig.select,
    enter: transform,
    parent: viz._select as unknown as D3Selection,
    duration: viz.schema.duration,
    update: transform,
  }).node();

  if (!viz.schema.colorScale) return;

  viz._colorScaleClass!
    .renderMode("compute")
    .align(frame.align)
    .duration(viz.schema.duration)
    .data(colorScaleData(viz))
    .height(frame.height)
    .locale(viz.schema.locale)
    .orient(frame.orient)
    .select(scaleGroup)
    .value(viz.schema.colorScale)
    .width(frame.width)
    .config(viz.schema.colorScaleConfig)
    .render();
}

/** The colorScale's sanitized position side (false when hidden). */
function colorScalePosition(viz: VizInstance): ReturnType<typeof sanitizePosition> {
  return sanitizePosition(viz.schema.colorScalePosition.bind(viz)(resolveSpec(viz)));
}

/**
    Lays the colorScale out to be drawn inside the chart: at the origin —
    Viz.toScene moves it into place — vertically (`"column"`) or
    horizontally (`"row"`), sized against the chart area `area`. Returns its
    measured size, or null when it isn't showing.
*/
export function paintColorScaleInset(
  viz: VizInstance,
  orient: InsetOrient,
  area: {width: number; height: number},
): {width: number; height: number} | null {
  const show = Boolean(viz.schema.colorScale) && colorScalePosition(viz) !== false &&
    !viz.schema.colorScaleConfig.select;
  const frame = insetFrame(orient, area);
  const maxSize = viz.schema.colorScaleMaxSize;
  paintColorScale(viz, {
    x: 0,
    y: 0,
    width: orient === "row" ? min([maxSize, frame.width])! : frame.width,
    height: orient === "column" ? min([maxSize, frame.height])! : frame.height,
    orient: orient === "column" ? "right" : "bottom",
    align: "start",
  }, show);
  if (!show) return null;
  const {width, height} = viz._colorScaleClass!.outerBounds();
  return width && height ? {width, height} : null;
}

/**
    Converts `drawColorScale.ts` to a FeatureModule.

    Visible only when `_colorScale` is truthy and `_colorScalePosition` resolves
    to a side. Renders the chart's `_colorScaleClass` ColorScale instance and
    claims margin along its position side.
*/
export const colorScaleFeature: FeatureModule = {
  name: "colorScale",
  configFields: [
    "colorScale",
    "colorScaleConfig",
    "colorScaleMaxSize",
    "colorScalePadding",
    "colorScalePosition",
  ],
  layout: ({viz, layoutMargin}) => {
    if (isInsetPending(viz, "colorScale")) {
      paintColorScaleInset(viz, insetOrient(viz, "colorScale"), {
        width: viz.schema.width - layoutMargin.left - layoutMargin.right,
        height: viz.schema.height - layoutMargin.top - layoutMargin.bottom,
      });
      return {panel: null, margin: {}};
    }

    const position = colorScalePosition(viz);
    const wide = ["top", "bottom"].includes(position as string);
    const showColorScale = viz.schema.colorScale && position;
    const padding = viz.schema.colorScalePadding(viz)
      ? viz._padding
      : {top: 0, right: 0, bottom: 0, left: 0};

    // Share the bottom band with the bottom-right corner panel (size legend):
    // a bottom colorScale fits beside it, a side one ends above it.
    const corner = bottomRightClearance(
      viz, position, layoutMargin.bottom + padding.bottom, layoutMargin.right + padding.right,
    );

    const availableWidth =
      viz.schema.width -
      (layoutMargin.left + layoutMargin.right + padding.left + padding.right) -
      corner.inset;
    const width = wide
      ? min([viz.schema.colorScaleMaxSize, availableWidth])!
      : viz.schema.width - (layoutMargin.left + layoutMargin.right);

    const availableHeight =
      viz.schema.height -
      (layoutMargin.bottom + layoutMargin.top + padding.bottom + padding.top) -
      corner.drop;
    const height = !wide
      ? min([viz.schema.colorScaleMaxSize, availableHeight])!
      : viz.schema.height - (layoutMargin.bottom + layoutMargin.top);

    paintColorScale(viz, {
      x: wide
        ? layoutMargin.left + padding.left + (availableWidth - width) / 2
        : layoutMargin.left,
      y: wide
        ? layoutMargin.top
        : layoutMargin.top + padding.top + (availableHeight - height) / 2,
      width,
      height,
      orient: position,
      align:
        ({bottom: "end", left: "start", right: "end", top: "start"} as Record<string, string>)[
          position as string
        ] || "bottom",
    }, Boolean(showColorScale));

    const margin: Record<string, number> = {};
    if (showColorScale) {
      const scaleBounds = viz._colorScaleClass.outerBounds();
      if (!viz.schema.colorScaleConfig.select && scaleBounds.height) {
        // Use the colorScale's OWN padding for its margin claim — not the
        // legend's, so a custom legendPadding doesn't shift the
        // colorScale's claim when the legend is hidden. The colorScale
        // class is the source of truth.
        const csPadding =
          typeof viz._colorScaleClass.padding === "function"
            ? viz._colorScaleClass.padding()
            : viz._legendClass.padding();
        if (wide) margin[position as string] = scaleBounds.height + csPadding * 2;
        else margin[position as string] = scaleBounds.width + csPadding * 2;
      }
    }
    return {panel: null, margin};
  },
};
