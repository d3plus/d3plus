import assert from "assert";
import * as d3plus from "../es/index.js";
import {version} from "../es/build/package.js";

it("version matches package.json", () => {
  assert.strictEqual(d3plus.version, version);
});

/** */
function testModule(name, obj) {
  it(`exports everything from ${name}`, () => {
    for (const symbol in obj) {
      if ({}.hasOwnProperty.call(obj, symbol)) {
        assert.ok(symbol in d3plus, `${name} exports ${symbol}`);
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

import * as format from "d3plus-format";
testModule("d3plus-format", format);

import * as geomap from "d3plus-geomap";
testModule("d3plus-geomap", geomap);

import * as hierarchy from "d3plus-hierarchy";
testModule("d3plus-hierarchy", hierarchy);

import * as legend from "d3plus-legend";
testModule("d3plus-legend", legend);

import * as matrix from "d3plus-matrix";
testModule("d3plus-matrix", matrix);

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
