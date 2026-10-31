import {load} from "@d3plus/data";

load.call({}, "/data/city_coords.json", undefined, undefined, (error, rows) => {
  // rows is the parsed JSON array
});
