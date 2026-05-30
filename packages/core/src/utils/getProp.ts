import type {DataPoint} from "@d3plus/data";

/**
    @module getProp
    @param type
    @param d
    @param i
    @private
*/
export default function getProp(
  this: {schema: Record<string, (d: DataPoint, i: number) => DataPoint[keyof DataPoint]>},
  type: string,
  d: DataPoint,
  i: number,
): DataPoint[keyof DataPoint] {
  return d[type] || this.schema[type](d, i);
}
