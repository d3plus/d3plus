import {unique} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import type Viz from "../Viz.js";

const cartesian = (
  a: DataPoint[keyof DataPoint][],
  b: DataPoint[keyof DataPoint][],
): [DataPoint[keyof DataPoint], DataPoint[keyof DataPoint]][] =>
  ([] as [DataPoint[keyof DataPoint], DataPoint[keyof DataPoint]][]).concat(
    ...a.map(d =>
      b.map(
        e => [d, e] as [DataPoint[keyof DataPoint], DataPoint[keyof DataPoint]],
      ),
    ),
  );

/**
    @module matrixData
    @private
 */
export default function (
  this: Viz,
  _data?: DataPoint[],
): {
  rowValues: DataPoint[keyof DataPoint][];
  columnValues: DataPoint[keyof DataPoint][];
  shapeData: Record<string, unknown>[];
} {
  const data = this._filteredData;
  const rowValues = (this.schema.rowList || unique(data.map(this.schema.row))).sort(
    this.schema.rowSort,
  );
  const columnValues = (
    this.schema.columnList || unique(data.map(this.schema.column))
  ).sort(this.schema.columnSort);

  if (!rowValues.length || !columnValues.length)
    return {rowValues: [], columnValues: [], shapeData: []};

  const shapeData = cartesian(rowValues, columnValues).map(
    ([rowValue, columnValue]) => {
      const dataObj: Record<string, unknown> = {
        __d3plusTooltip__: true,
        __d3plus__: true,
        column: columnValue,
        row: rowValue,
      };
      const dataIndex = data.findIndex(
        (d: DataPoint, i: number) =>
          this.schema.row(d, i) === rowValue && this.schema.column(d, i) === columnValue,
      );
      if (dataIndex >= 0) {
        dataObj.i = dataIndex;
        dataObj.data = data[dataIndex];
      } else {
        dataObj.data = {row: rowValue, column: columnValue};
      }
      return dataObj;
    },
  );

  return {rowValues, columnValues, shapeData};
}
