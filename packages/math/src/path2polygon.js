/**
    @function path2polygon
    @desc Transforms a path string into an Array of points.
    @param {String} path An SVG string path, commonly the "d" property of a <path> element.
    @param {Number} [segmentLength = 50] The length of line segments when converting curves line segments. Higher values lower computation time, but will result in curves that are more rigid.
    @returns {Array}
*/
export default (path, segmentLength = 50) => {

  if (typeof document === "undefined") return [];

  const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svgPath.setAttribute("d", path);

  const len = svgPath.getTotalLength();
  const NUM_POINTS = len / segmentLength < 10 ? len / 10 : len / segmentLength;

  const points = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const pt = svgPath.getPointAtLength(i * len / (NUM_POINTS-1));
    points.push([pt.x, pt.y]);
  }
  
  return points;

};
