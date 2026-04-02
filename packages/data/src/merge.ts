import {merge, sum} from "d3-array";
import unique from "./unique.js";

import type {DataPoint} from "./DataPoint.js";

type DataValue = DataPoint[keyof DataPoint];
type MergedValue = DataValue | DataValue[] | MergedDataPoint;

export interface MergedDataPoint {
  [key: string]: MergedValue;
}

type AggregationFunction = (
  objects: DataPoint[],
  accessor: (d: DataPoint) => DataValue,
) => MergedValue;

/**
    @function merge
    @desc Combines an Array of Objects together and returns a new Object.
    @param {Array} objects The Array of objects to be merged together.
    @param {Object} aggs An object containing specific aggregation methods (functions) for each key type. By default, numbers are summed and strings are returned as an array of unique values.
    @example <caption>this</caption>
merge([
  {id: "foo", group: "A", value: 10, links: [1, 2]},
  {id: "bar", group: "A", value: 20, links: [1, 3]}
]);
    @example <caption>returns this</caption>
{id: ["bar", "foo"], group: "A", value: 30, links: [1, 2, 3]}
*/
function objectMerge(
  objects: DataPoint[],
  aggs: Record<string, AggregationFunction> = {},
): MergedDataPoint {
  const availableKeys = unique(merge(objects.map(o => Object.keys(o)))),
    newObject: MergedDataPoint = {};

  availableKeys.forEach((k: string) => {
    let value: MergedValue;
    if (aggs[k]) value = aggs[k](objects, (o: DataPoint) => o[k]);
    else {
      const values: DataValue[] = objects.map(o => o[k]);
      const types = values
        .map(v =>
          v || v === false ? (v as string | number | boolean).constructor : v,
        )
        .filter(v => v !== void 0);
      if (!types.length) value = undefined as unknown as MergedValue;
      else if (types.indexOf(Array) >= 0) {
        const flattened: DataValue[] = merge(
          values.map(v =>
            v instanceof Array ? v : [v],
          ) as unknown as DataValue[][],
        );
        const merged = unique(flattened);
        value = merged.length === 1 ? merged[0] : merged;
      } else if (types.indexOf(String) >= 0) {
        const uniq = unique(values as unknown as string[]);
        value = uniq.length === 1 ? uniq[0] : uniq;
      } else if (types.indexOf(Number) >= 0)
        value = sum(values as unknown as number[]);
      else if (types.indexOf(Object) >= 0) {
        const filtered = unique(
          values.filter(v => v) as unknown as DataPoint[],
        );
        value =
          filtered.length === 1
            ? (filtered[0] as DataValue)
            : objectMerge(filtered);
      } else {
        const filtered = unique(
          values.filter(v => v !== void 0) as unknown as DataValue[],
        );
        value = filtered.length === 1 ? filtered[0] : filtered;
      }
    }
    newObject[k] = value;
  });

  return newObject;
}

export default objectMerge;
