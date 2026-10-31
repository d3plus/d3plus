import {largestRect} from "@d3plus/math";

const poly = [
  [30, 60],
  [120, 15],
  [230, 40],
  [245, 150],
  [150, 190],
  [40, 165],
];
largestRect(poly, {angle: 0});
