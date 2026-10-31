import {load} from "@d3plus/data";

load.call(
  {},
  [
    "/data/fruits.csv",
    [{name: "Durian", color: "green", sweet: true, calories: 147}],
  ],
  undefined,
  undefined,
  (error, rows) => {
    // the fetched rows followed by the inline row
  },
);
