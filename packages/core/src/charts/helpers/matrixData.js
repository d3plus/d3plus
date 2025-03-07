import {unique} from "@d3plus/data";

const cartesian = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));

/**
    @module matrixData
    @private
 */
export default function() {

  const data = this._filteredData;
  const rowValues = (this._rowList || unique(data.map(this._row))).sort(this._rowSort);
  const columnValues = (this._columnList || unique(data.map(this._column))).sort(this._columnSort);

  if (!rowValues.length || !columnValues.length) return this;

  const shapeData = cartesian(rowValues, columnValues)
    .map(([rowValue, columnValue]) => {
      const dataObj = {
        __d3plusTooltip__: true,
        __d3plus__: true,
        column: columnValue,
        row: rowValue
      };
      const dataIndex = data
        .findIndex((d, i) => this._row(d, i) === rowValue && this._column(d, i) === columnValue);
      if (dataIndex >= 0) {
        dataObj.i = dataIndex;
        dataObj.data = data[dataIndex];
      }
      else {
        dataObj.data = {row: rowValue, column: columnValue};
      }
      return dataObj;
    });

  return {rowValues, columnValues, shapeData};

}
