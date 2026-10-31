import {polygonInside} from "@d3plus/math";

const polyA = [
  [150, 60],
  [300, 70],
  [290, 140],
  [160, 130],
];
const polyB = [
  [20, 20],
  [240, 30],
  [230, 180],
  [30, 170],
];
polygonInside(polyA, polyB);
