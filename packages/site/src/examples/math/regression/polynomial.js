import {regression} from "@d3plus/math";

const points = [
  [1, 7.9],
  [2, 5.4],
  [3, 6.4],
  [4, 5.7],
  [5, 8],
  [6, 9.2],
  [7, 13.7],
  [8, 18.7],
  [9, 23.1],
  [10, 30.1],
];
regression(points, "polynomial", {order: 2});
