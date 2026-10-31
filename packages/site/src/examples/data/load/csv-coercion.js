import {load} from "@d3plus/data";

load.call({}, "/data/fruits.csv", undefined, undefined, (error, rows) => {
  // rows[0] → {name: "Apple", color: "red", sweet: true, calories: 95}
});
