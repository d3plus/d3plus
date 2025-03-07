import {max, min, sum} from "d3-array";
import {nest} from "d3-collection";

/**
    @module barBuffer
    @desc Adds a buffer to either side of the non-discrete axis.
    @param {Array} data
    @param {D3Scale} x
    @param {D3Scale} y
    @param {Object} [config]
    @param {Number} [buffer = 10]
    @private
*/
export default function({data, x, y, x2, y2, buffer = 10}) {
  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  const oppScale = this._discrete === "x" ? y : x;

  const oppDomain = oppScale.domain().slice();

  const isDiscreteX = this._discrete === "x";

  if (isDiscreteX) oppDomain.reverse();

  let negVals, posVals;
  if (this._stacked) {
    const groupedData = nest()
      .key(d => `${d[this._discrete]}_${d.group}`)
      .entries(data)
      .map(d => d.values.map(x => x[isDiscreteX ? yKey : xKey]));
    posVals = groupedData.map(arr => sum(arr.filter(d => d > 0)));
    negVals = groupedData.map(arr => sum(arr.filter(d => d < 0)));
  }
  else {
    const allValues = data.map(d => d[isDiscreteX ? yKey : xKey]);
    posVals = allValues.filter(d => d > 0);
    negVals = allValues.filter(d => d < 0);
  }

  let bMax = oppScale(max(posVals));
  if (isDiscreteX ? bMax < oppScale(0) : bMax > oppScale(0)) bMax += isDiscreteX ? -buffer : buffer;
  bMax = oppScale.invert(bMax);

  let bMin = oppScale(min(negVals));
  if (isDiscreteX ? bMin > oppScale(0) : bMin < oppScale(0)) bMin += isDiscreteX ? buffer : -buffer;
  bMin = oppScale.invert(bMin);

  if (bMax > oppDomain[1]) oppDomain[1] = bMax;
  if (bMin < oppDomain[0]) oppDomain[0] = bMin;

  if (isDiscreteX) oppDomain.reverse();
  
  oppScale.domain(oppDomain);

  return [x, y];

}
