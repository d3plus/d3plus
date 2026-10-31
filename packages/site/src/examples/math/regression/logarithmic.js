import {regression} from "@d3plus/math";

const points = [
  [1, 5.4],
  [2, 6.479],
  [3, 9.196],
  [4, 8.859],
  [5, 10.328],
  [6, 9.575],
  [7, 11.038],
  [8, 11.938],
  [9, 11.192],
  [10, 12.008],
];
regression(points, "logarithmic");
