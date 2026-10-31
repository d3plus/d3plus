import {negativeSpace} from "@d3plus/math";

const bounds = {x: 0, y: 0, width: 260, height: 200};
const marks = [
  {x: 60, y: 50, width: 40, height: 40},
  {x: 120, y: 90, width: 50, height: 30},
  {x: 90, y: 140, width: 30, height: 30},
];
negativeSpace(bounds, marks).slice(0, 3);
