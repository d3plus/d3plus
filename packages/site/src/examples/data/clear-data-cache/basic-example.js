import {clearDataCache, load} from "@d3plus/data";

const chart = {schema: {cache: true}, config() {}};
const fruits = () =>
  new Promise(resolve =>
    load.call(chart, "/data/fruits.csv", undefined, "data", (error, rows) =>
      resolve(rows.length),
    ),
  );

fruits();
clearDataCache();
fruits();
