import discreteBuffer from "./discreteBuffer.js";
import numericBuffer from "./numericBuffer.js";

/**
    @module rectBuffer
    @desc Adds a buffer to either side of the non-discrete axis.
    @param {Array} data
    @param {D3Scale} x
    @param {D3Scale} y
    @param {Object} [config]
    @param {Number} [buffer] Defaults to the width/height of the largest Rect.
    @private
*/
export default function({data, x, y, x2, y2, yScale, xScale, config}) {

  x = x.copy();
  y = y.copy();

  const xKey = x2 ? "x2" : "x";
  const yKey = y2 ? "y2" : "y";

  let xD = x.domain().slice(),
      yD = y.domain().slice();

  const xR = x.range(),
        yR = y.range();

  if (!x.invert && x.padding) discreteBuffer(x, data, this._discrete);
  if (!y.invert && y.padding) discreteBuffer(y, data, this._discrete);

  if (x.invert || y.invert) {

    data.forEach(d => {

      if (x.invert) {
        const w = config.width(d.data, d.i);
        xD = numericBuffer(x, xScale, d[xKey], w, xR, xD, 0, false);
        xD = numericBuffer(x, xScale, d[xKey], w, xR, xD, 1, false);
      }

      if (y.invert) {
        const h = config.height(d.data, d.i);
        yD = numericBuffer(y, yScale, d[yKey], h, yR, yD, 0, true);
        yD = numericBuffer(y, yScale, d[yKey], h, yR, yD, 1, true);
      }

    });

  }

  return [x, y];

}

