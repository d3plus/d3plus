import type {DataPoint} from "@d3plus/data";

/**
    @type AccessorFn
    A function that accesses a property from a DataPoint.
*/
export type AccessorFn = (
  d: DataPoint,
  i?: number,
) => DataPoint[keyof DataPoint];
