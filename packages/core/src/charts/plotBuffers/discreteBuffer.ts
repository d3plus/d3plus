/**
    @module discreteBuffer
    Adds left/right padding to a point or time scale.
    @private
*/
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
        if (!acc || curr - prev < acc) return curr - prev;
        else return acc;
      },
      0,
    );
    const domain = scale.domain().slice() as (number | string | Date)[];
    if (discrete === "y") domain.reverse();
    domain[0] = new Date(+domain[0] - closest / 2);
    domain[1] = new Date(+domain[1] + closest / 2);
    if (discrete === "y") domain.reverse();
    scale.domain(domain);
  }
};

export default discreteBuffer;
