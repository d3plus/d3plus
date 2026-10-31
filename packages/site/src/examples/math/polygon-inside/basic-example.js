import {polygonInside} from "@d3plus/math";

const polyA = [
  [70, 60],
  [180, 70],
  [170, 140],
  [80, 130],
];
const polyB = [
  [20, 20],
  [240, 30],
  [230, 180],
  [30, 170],
];
polygonInside(polyA, polyB);
