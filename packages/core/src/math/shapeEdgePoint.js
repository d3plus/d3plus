const pi = Math.PI;

/**
    @function shapeEdgePoint
    @desc Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.
    @param {Number} angle The angle, in radians, of the offset point.
    @param {Number} distance The pixel distance away from the origin.
    @returns {String} [shape = "circle"] The type of shape, which can be either "circle" or "square".
*/
export default (angle, distance, shape = "circle") => {

  if (angle < 0) angle = pi * 2 + angle;

  if (shape === "square") {

    const diagonal = 45 * (pi / 180);
    let x = 0, y = 0;

    if (angle < pi / 2) {
      const tan = Math.tan(angle);
      x += angle < diagonal ? distance : distance / tan;
      y += angle < diagonal ? tan * distance : distance;
    }
    else if (angle <= pi) {
      const tan = Math.tan(pi - angle);
      x -= angle < pi - diagonal ? distance / tan : distance;
      y += angle < pi - diagonal ? distance : tan * distance;
    }
    else if (angle < diagonal + pi) {
      x -= distance;
      y -= Math.tan(angle - pi) * distance;
    }
    else if (angle < 3 * pi / 2) {
      x -= distance / Math.tan(angle - pi);
      y -= distance;
    }
    else if (angle < 2 * pi - diagonal) {
      x += distance / Math.tan(2 * pi - angle);
      y -= distance;
    }
    else {
      x += distance;
      y -= Math.tan(2 * pi - angle) * distance;
    }

    return [x, y];

  }
  else if (shape === "circle") {
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  }
  else return null;

};
