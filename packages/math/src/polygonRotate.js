import pointRotate from "./pointRotate.js";

/**
    @function polygonRotate
    @desc Rotates a point around a given origin.
    @param {Array} poly The polygon to be rotated, which should be an Array of `[x, y]` values.
    @param {Number} alpha The angle in radians to rotate.
    @param {Array} [origin = [0, 0]] The origin point of the rotation, which should be an `[x, y]` formatted Array.
    @returns {Boolean}
*/
export default (poly, alpha, origin = [0, 0]) => poly.map(p => pointRotate(p, alpha, origin));
