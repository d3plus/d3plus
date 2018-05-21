import test from "zora";
import * as d3plus from "../";
import {version} from "../build/package";

test("version matches package.json", assert => {
  assert.equal(d3plus.version, version);
});

function testModule(name, module) {
  test(`exports everything from ${name}`, assert => {
    for (const symbol in module) {
      if ({}.hasOwnProperty.call(module, symbol)) {
        assert.equal(symbol in d3plus, true, `${name} exports ${symbol}`);
      }
    }
  });
}

import * as axis from "d3plus-axis";
testModule("d3plus-axis", axis);

import * as color from "d3plus-color";
testModule("d3plus-color", color);

import * as common from "d3plus-common";
testModule("d3plus-common", common);

import * as geomap from "d3plus-geomap";
testModule("d3plus-geomap", geomap);

import * as hierarchy from "d3plus-hierarchy";
testModule("d3plus-hierarchy", hierarchy);

import * as legend from "d3plus-legend";
testModule("d3plus-legend", legend);

import * as network from "d3plus-network";
testModule("d3plus-network", network);

import * as plot from "d3plus-plot";
testModule("d3plus-plot", plot);

import * as priestley from "d3plus-priestley";
testModule("d3plus-priestley", priestley);

import * as shape from "d3plus-shape";
testModule("d3plus-shape", shape);

import * as text from "d3plus-text";
testModule("d3plus-text", text);

import * as timeline from "d3plus-timeline";
testModule("d3plus-timeline", timeline);

import * as tooltip from "d3plus-tooltip";
testModule("d3plus-tooltip", tooltip);

import * as viz from "d3plus-viz";
testModule("d3plus-viz", viz);

export default test;
