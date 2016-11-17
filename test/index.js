import {test} from "tape";
import * as d3plus from "../";
import {version} from "../build/package";

test("version matches package.json", assert => {
  assert.equal(d3plus.version, version);
  assert.end();
});

function testModule(name, module) {
  test(`d3 exports everything from ${name}`, assert => {
    for (const symbol in module) {
      if ({}.hasOwnProperty.call(module, symbol)) {
        assert.equal(symbol in d3plus, true, `${name} exports ${symbol}`);
      }
    }
    assert.end();
  });
}

testModule("d3plus-axis", require("d3plus-axis"));
testModule("d3plus-color", require("d3plus-color"));
testModule("d3plus-common", require("d3plus-common"));
testModule("d3plus-geomap", require("d3plus-geomap"));
testModule("d3plus-hierarchy", require("d3plus-hierarchy"));
testModule("d3plus-legend", require("d3plus-legend"));
testModule("d3plus-plot", require("d3plus-plot"));
testModule("d3plus-priestley", require("d3plus-priestley"));
testModule("d3plus-shape", require("d3plus-shape"));
testModule("d3plus-text", require("d3plus-text"));
testModule("d3plus-timeline", require("d3plus-timeline"));
testModule("d3plus-tooltip", require("d3plus-tooltip"));
testModule("d3plus-viz", require("d3plus-viz"));
