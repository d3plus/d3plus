import {polygonRayCast} from "@d3plus/math";

const poly = [
  [40, 30],
  [200, 20],
  [250, 100],
  [210, 180],
  [60, 170],
  [20, 90],
];
polygonRayCast(poly, [130, 100]);
