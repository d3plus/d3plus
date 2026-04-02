import type {DataPoint} from "@d3plus/data";

/**
    @module getProp
    @param {String} type
    @param {Object} d
    @param {Number} i
    @private
*/
export default function getProp(
  this: Record<string, (d: DataPoint, i: number) => DataPoint[keyof DataPoint]>,
  type: string,
  d: DataPoint,
  i: number,
): DataPoint[keyof DataPoint] {
  return d[type] || this[`_${type}`](d, i);
}
