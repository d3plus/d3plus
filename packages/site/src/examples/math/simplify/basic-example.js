import {simplify} from "@d3plus/math";

const r = n => Math.round(n * 100) / 100;
const poly = Array.from({length: 21}, (_, i) => [
  20 + i * 11,
  r(100 + Math.sin(i / 2) * 40 + ((i % 3) - 1) * 3),
]);

simplify(poly, 4);
