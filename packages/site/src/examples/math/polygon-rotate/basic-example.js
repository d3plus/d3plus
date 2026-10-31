import {polygonRotate} from "@d3plus/math";

const poly = [
  [60, 70],
  [200, 60],
  [210, 130],
  [90, 150],
];
polygonRotate(poly, Math.PI / 6, [140, 100]);
