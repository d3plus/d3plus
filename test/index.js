import {test} from "tape";
import * as d3plus from "../";
// import {dependencies, version} from "../build/package";

// test("version matches package.json", assert => {
//   assert.equal(d3plus.version, version);
//   assert.end();
// });

test("d3 exports everything from d3plus-color", assert => {

  for (const symbol in require("d3plus-color")) {
    if (module.hasOwnProperty.call(this, symbol)) {
      assert.equal(symbol in d3plus, true, `d3plus-color export ${symbol}`);
    }
  }
  assert.end();

});
//
// for (const dependency in dependencies) {
//
//   if (dependencies.hasOwnProperty.call(this, dependency)) {
//     console.log(dependency);
//     const module = require(dependency);
//     test(`d3 exports everything from ${dependency}`, assert => {
//
//       for (const symbol in module) {
//         if (module.hasOwnProperty.call(this, symbol)) {
//           assert.equal(symbol in d3plus, true, `${dependency} export ${symbol}`);
//         }
//       }
//       assert.end();
//
//     });
//
//   }
//
// }
