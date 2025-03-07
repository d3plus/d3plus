/**
    @function pointDistanceSquared
    @desc Returns the squared euclidean distance between two points.
    @param {Array} p1 The first point, which should always be an `[x, y]` formatted Array.
    @param {Array} p2 The second point, which should always be an `[x, y]` formatted Array.
    @returns {Number}
*/
export default (p1, p2) => {

  const dx = p2[0] - p1[0],
        dy = p2[1] - p1[1];

  return dx * dx + dy * dy;

};
