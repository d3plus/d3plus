/**
    Room on the value axis for the labels past each waterfall bar's end.
*/
import type {DataPoint} from "@d3plus/data";

import type {D3Scale} from "../../utils/index.js";
import {endsForward, LABEL_SPAN} from "./labels.js";
import type {WaterfallStep} from "./steps.js";

/**
    Widens `domain` so a label `fraction` of the axis long fits past the
    highest end of any bar ending forward and the lowest end of any bar ending
    backward. `domain` is `[low, high]`.
*/
export function labelHeadroom(
  domain: [number, number],
  steps: WaterfallStep[],
  fraction: number,
): [number, number] {
  let [lo, hi] = domain;
  const f = Math.min(Math.max(fraction, 0), 0.45);
  if (!f || !steps.length) return [lo, hi];
  let top = -Infinity, bottom = Infinity;
  for (const step of steps) {
    if (endsForward(step)) top = Math.max(top, step.end);
    else bottom = Math.min(bottom, step.end);
  }
  // Each widening shrinks the scale, so settle on the span that fits both ends.
  for (let k = 0; k < 8; k++) {
    const span = hi - lo;
    if (Number.isFinite(top)) hi = Math.max(hi, top + f * span);
    if (Number.isFinite(bottom)) lo = Math.min(lo, bottom - f * span);
  }
  return [lo, hi];
}

/** What Plot hands a shape's axis buffer. */
interface BufferInput {
  data: {data?: DataPoint}[];
  x: D3Scale;
  y: D3Scale;
  x2?: boolean;
}

/**
    Plot's Bar axis buffer for a waterfall: widens the value axis so every
    value label fits inside the plot. Skipped for the secondary axes and when
    bar labels are off.
*/
export function waterfallBuffer(
  stepOf: (row: DataPoint) => WaterfallStep | undefined,
  options: {vertical: () => boolean; labels: () => boolean},
) {
  return ({data, x, y, x2}: BufferInput): [D3Scale, D3Scale] => {
    if (x2 || !options.labels()) return [x, y];
    const vertical = options.vertical();
    const scale = vertical ? y : x;
    const steps = data.map(d => (d.data ? stepOf(d.data) : undefined)).filter((s): s is WaterfallStep => !!s);
    const range = scale.range() as number[];
    const length = Math.abs(range[range.length - 1] - range[0]);
    if (!steps.length || !length) return [x, y];
    const domain = (scale.domain() as number[]).slice();
    // A vertical value axis runs top-down, so its domain is stored high first.
    if (vertical) domain.reverse();
    const px = vertical ? LABEL_SPAN.height + LABEL_SPAN.gap : LABEL_SPAN.width + LABEL_SPAN.gap;
    const next: number[] = labelHeadroom([domain[0], domain[1]], steps, px / length);
    if (vertical) next.reverse();
    scale.domain(next);
    return [x, y];
  };
}
