import {regression} from "@d3plus/math";

const points = [
  [1, 3.4],
  [2, 4.4],
  [3, 7.9],
  [4, 8.7],
  [5, 11.5],
  [6, 12.2],
  [7, 15.2],
  [8, 17.7],
  [9, 18.6],
  [10, 21.1],
];
regression(points, "linear");
