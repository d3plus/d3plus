import {linearConfidence} from "@d3plus/math";

const points = [
  [1, 3.8],
  [2, 3.8],
  [3, 8.8],
  [4, 8.4],
  [5, 12],
  [6, 11.4],
  [7, 15.4],
  [8, 18.4],
  [9, 18.2],
  [10, 21.2],
];
const band = linearConfidence(points, 0.99);
[1, 5.5, 10].map(band);
