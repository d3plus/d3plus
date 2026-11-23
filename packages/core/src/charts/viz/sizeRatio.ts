import type Viz from "./Viz.js";
import {chartWidth, setLetterbox} from "./letterbox.js";
import {reserveContainerSize} from "./reserveContainerSize.js";

/**
    The height a `sizeRatio` gives a chart `width` pixels wide: the width
    divided by the ratio. Undefined when the ratio is not a positive, finite
    number or the width is not a positive one.
    @param ratio The chart's `sizeRatio`, width ÷ height.
    @param width The chart's width, in pixels.
*/
export function ratioHeight(
  ratio: unknown,
  width: unknown,
): number | undefined {
  if (typeof ratio !== "number" || !isFinite(ratio) || ratio <= 0)
    return undefined;
  if (typeof width !== "number" || !isFinite(width) || width <= 0)
    return undefined;
  return width / ratio;
}

/** The sum of the pixel values of `props` in `style`. */
function sumPx(style: CSSStyleDeclaration, props: string[]): number {
  return props.reduce(
    (sum, prop) => sum + (parseFloat(style.getPropertyValue(prop)) || 0),
    0,
  );
}

/**
    The height the chart's container leaves it when the chart asks for
    `height`: measured with an invisible block of that height added to the
    container, so a container without a height of its own grows to hold it
    (leaving at least `height`), while one whose height is set (by CSS, a
    flex or grid layout, or a `max-height`) keeps its own. Undefined when the
    container cannot be measured (no layout, as in a headless DOM).
    @param viz The chart.
    @param height The height the chart asks for, in pixels.
*/
export function containerRoom(viz: Viz, height: number): number | undefined {
  const svg = viz._select?.node?.() as Element | null | undefined;
  const parent = svg?.parentNode as HTMLElement | null | undefined;
  const view = parent?.ownerDocument?.defaultView;
  if (!parent || parent.nodeType !== 1 || !view) return undefined;
  const probe = parent.ownerDocument.createElement("div");
  probe.style.cssText = `display: block; flex: none; width: 0; height: ${height}px; margin: 0; padding: 0; border: 0; visibility: hidden`;
  parent.appendChild(probe);
  const box = parent.getBoundingClientRect().height;
  const style = view.getComputedStyle(parent);
  probe.remove();
  const room =
    box -
    sumPx(style, [
      "padding-top",
      "padding-bottom",
      "border-top-width",
      "border-bottom-width",
    ]);
  return room > 0 ? room : undefined;
}

/** The size `sizeRatio` gives a chart. */
export interface RatioSize {
  width: number;
  height: number;
}

/**
    The size `sizeRatio` gives a chart in a frame `width` pixels wide (its
    container's width, or its explicit `width`), kept inside its container:
    the width divided by the ratio for the height, unless the container's own
    height is less. Then the chart takes the container's height and narrows
    to keep its ratio, to be centered in the frame (like `object-fit:
    contain`).
    @param viz The chart.
    @param ratio The chart's `sizeRatio`.
    @param width The width of the chart's frame.
*/
export function ratioSize(
  viz: Viz,
  ratio: unknown,
  width: unknown,
): RatioSize | undefined {
  const height = ratioHeight(ratio, width);
  if (height === undefined) return undefined;
  const room = containerRoom(viz, height);
  if (room === undefined || room >= height)
    return {width: width as number, height};
  return {width: room * (ratio as number), height: room};
}

/**
    Whether the size `sizeRatio` gives the chart differs from the size it has:
    its container's own height changed. A container the chart props open
    measures the same height again, so the resize the chart's own height
    causes does not redraw it.
    @private
*/
export function sizeRatioMoved(viz: Viz): boolean {
  const size = ratioSize(viz, viz.schema.sizeRatio, viz.schema.width);
  return (
    size !== undefined &&
    (size.height !== viz.schema.height || size.width !== chartWidth(viz))
  );
}

/**
    Whether the chart's height is its own to measure: unset, or the height it
    measured (or took from `sizeRatio`) on an earlier render.
    @private
*/
function heightIsAuto(viz: Viz): boolean {
  return (
    viz.schema.height === undefined ||
    (!!viz._autoHeight && viz.schema.height === viz._measuredHeight)
  );
}

/**
    Sizes a chart with a `sizeRatio` and no height of its own from its width
    (see `ratioSize`), once that width is known and any `responsive`
    breakpoint has applied, and records its letterbox: the narrower width it
    draws at (see `chartWidth`), while its `width` keeps the frame's. A chart
    whose ratio was just removed measures its container's height again,
    after giving up the space the ratio reserved in it.
    @private
*/
export function applySizeRatio(viz: Viz): void {
  const auto = heightIsAuto(viz);
  const size = auto
    ? ratioSize(viz, viz.schema.sizeRatio, viz.schema.width)
    : undefined;
  const had = !!viz._sizeRatioHeight;
  viz._sizeRatioHeight = size !== undefined;
  setLetterbox(viz, size?.width, viz.schema.width);
  if (size === undefined) {
    if (had && auto && viz.schema.width) {
      reserveContainerSize(viz);
      viz._autoHeight = true;
      viz._setSVGSize();
    }
    return;
  }
  viz._autoHeight = true;
  viz._measuredHeight = size.height;
  if (viz.schema.height !== size.height) viz.schema.height = size.height;
}
