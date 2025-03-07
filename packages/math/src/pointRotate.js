/**
    @function pointRotate
    @desc Rotates a point around a given origin.
    @param {Array} p The point to be rotated, which should always be an `[x, y]` formatted Array.
    @param {Number} alpha The angle in radians to rotate.
    @param {Array} [origin = [0, 0]] The origin point of the rotation, which should always be an `[x, y]` formatted Array.
    @returns {Boolean}
*/
export default function(p, alpha, origin = [0, 0]) {

  const cosAlpha = Math.cos(alpha),
        sinAlpha = Math.sin(alpha),
        xshifted = p[0] - origin[0],
        yshifted = p[1] - origin[1];

  return [
    cosAlpha * xshifted - sinAlpha * yshifted + origin[0],
    sinAlpha * xshifted + cosAlpha * yshifted + origin[1]
  ];

}
