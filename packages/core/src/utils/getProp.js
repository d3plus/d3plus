/**
    @module getProp
    @param {String} type
    @param {Object} d
    @param {Number} i
    @private
*/
export default function(type, d, i) {
  return d[type] || this[`_${type}`](d, i);
}
