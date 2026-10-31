import {regression} from "@d3plus/math";

const points = [
  [1, 3.1],
  [2, 3.044],
  [3, 5.819],
  [4, 6.34],
  [5, 9.463],
  [6, 11.299],
  [7, 16.532],
  [8, 22.746],
  [9, 29.359],
  [10, 40.271],
];
regression(points, "exponential");
