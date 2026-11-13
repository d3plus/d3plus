import type Viz from "../viz/Viz.js";

/** Bounds in the zoom surface's unzoomed coordinates: top-left, bottom-right. */
export type Bounds = [[number, number], [number, number]];

/** A zoom transform: scale `k`, then translate by `x`, `y`. */
export interface FitTransform {
  k: number;
  x: number;
  y: number;
}

/**
    Which screen dimensions the zoom actually scales. Every chart zooms its
    picture uniformly, except a Plot, which rescales only its linear and time
    axes: a LinePlot or a bar chart with a discrete x axis zooms vertically
    alone.
    @param viz The chart.
*/
export function zoomedDims(viz: Viz): {x: boolean; y: boolean} {
  const scales = viz._plotZoomBase?.scales;
  if (!scales) return {x: true, y: true};
  return {x: Boolean(scales.x || scales.x2), y: Boolean(scales.y || scales.y2)};
}

/**
    The area zoomed bounds fill, in surface coordinates: a Plot's plot rect,
    where its axes read their values, so a brushed range becomes the axes'
    exact domain; any other chart's zoom area less `zoomPadding`.
    @param viz The chart.
*/
function fitArea(viz: Viz): Bounds {
  const base = viz._plotZoomBase;
  if (base) {
    const {layout, chartTransform: ct, pCtx} = base;
    // Axis ranges are measured from the plot body; y also sits below the x2 axis.
    const top = ct.y - pCtx.x2Height;
    return [
      [layout.xRange[0] + ct.x, layout.yRange[0] + top],
      [layout.xRange[1] + ct.x, layout.yRange[1] + top],
    ];
  }
  const [[x0, y0], [x1, y1]] = viz._zoomBehavior.translateExtent(),
    pad = viz.schema.zoomPadding;
  return [
    [x0 + pad, y0 + pad],
    [x1 - pad, y1 - pad],
  ];
}

/**
    The zoom transform that fits `bounds` (unzoomed surface coordinates) to
    the chart's zoom area along each dimension the zoom scales (see
    `zoomedDims`): the dimension with less room fills the area, and the other
    is centered in it. A dimension the zoom doesn't scale (a Plot's discrete
    axis) has no say in the scale.
    @param viz The chart.
    @param bounds The bounds to show.
*/
export function fitBounds(viz: Viz, bounds: Bounds): FitTransform {
  const [[ax0, ay0], [ax1, ay1]] = fitArea(viz),
    [[bx0, by0], [bx1, by1]] = bounds,
    dims = zoomedDims(viz);
  const kx = (ax1 - ax0) / (bx1 - bx0),
    ky = (ay1 - ay0) / (by1 - by0);
  const k = dims.x && dims.y ? Math.min(kx, ky) : dims.x ? kx : ky;
  return {
    k,
    x: (ax0 + ax1) / 2 - (k * (bx0 + bx1)) / 2,
    y: (ay0 + ay1) / 2 - (k * (by0 + by1)) / 2,
  };
}
