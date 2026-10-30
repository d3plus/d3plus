/**
    @module discreteBuffer
    Adds left/right padding to a point or time scale.
    @private
*/
import {
  scaleTimeShift,
  scaleTimeStep,
} from "../../components/Axis/brokenTimeScale.js";
import type {D3Scale} from "../../utils/index.js";

const discreteBuffer = (
  scale: D3Scale,
  data: Record<string, unknown>[],
  discrete: string,
): void => {
  if (scale.padding) scale.padding(0.5);
  else {
    const uniqueValues = Array.from(
      new Set(
        data.map((d: Record<string, unknown>) => +(d[discrete] as number)),
      ),
    );
    const closest = uniqueValues.reduce(
      (acc: number, curr: number, i: number, arr: number[]) => {
        if (!i) return acc;
        const prev = arr[i - 1];
        // On a time scale with hidden time, only the time it shows counts.
        const step = scaleTimeStep(scale, prev, curr);
        if (!acc || step < acc) return step;
        else return acc;
      },
      0,
    );
    const domain = scale.domain().slice() as (number | string | Date)[];
    if (discrete === "y") domain.reverse();
    domain[0] = scaleTimeShift(scale, +domain[0], -closest / 2);
    domain[1] = scaleTimeShift(scale, +domain[1], closest / 2);
    if (discrete === "y") domain.reverse();
    scale.domain(domain);
  }
};

export default discreteBuffer;
