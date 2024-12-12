import isData from "./isData.js";
import load from "./load.js";

/**
  @function isData
  @desc Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.
  @param {Array|String|Object} data The data to be loaded
  @param {Function} [data] An optional data formatter/callback
  @param {String} data The internal Viz method to be modified
*/
export default function(_, f, key) {
  if (!(_ instanceof Array)) _ = [_];
  const needToLoad = _.find(isData);
  if (needToLoad) {
    const prev = this._queue.find(q => q[3] === key);
    const d = [load.bind(this), _, f, key];
    if (prev) this._queue[this._queue.indexOf(prev)] = d;
    else this._queue.push(d);
  }
  else {
    this[`_${key}`] = _;
  }
}
