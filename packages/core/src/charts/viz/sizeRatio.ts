import type Viz from "./Viz.js";
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
    Sets the height of a chart with a `sizeRatio` and no height of its own from
    its width, once its width is known and any `responsive` breakpoint has
    applied. A chart whose ratio was just removed measures its container's
    height again, after giving up the space the ratio reserved in it.
    @private
*/
export function applySizeRatio(viz: Viz): void {
  const auto = heightIsAuto(viz);
  const height = auto
    ? ratioHeight(viz.schema.sizeRatio, viz.schema.width)
    : undefined;
  const had = !!viz._sizeRatioHeight;
  viz._sizeRatioHeight = height !== undefined;
  if (height === undefined) {
    if (had && auto && viz.schema.width) {
      reserveContainerSize(viz);
      viz._autoHeight = true;
      viz._setSVGSize();
    }
    return;
  }
  viz._autoHeight = true;
  viz._measuredHeight = height;
  if (viz.schema.height !== height) viz.schema.height = height;
}
