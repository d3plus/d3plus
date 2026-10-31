import {nest} from "@d3plus/data";

const data = [
  {region: "North", year: 2023, sales: 120},
  {region: "North", year: 2024, sales: 135},
  {region: "South", year: 2023, sales: 80},
];

nest(data, d => d.region);
