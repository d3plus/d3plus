/* global console */
import assert from "assert";
import {BarChart, configWarnings, Treemap} from "../../es/index.js";

/**
    Charts warn (once per message) about config keys they don't support,
    including keys inside the shared `shapeConfig` bag.
*/
function captureWarnings(fn) {
  const warn = console.warn,
    warnings = [];
  console.warn = msg => warnings.push(msg);
  try {
    fn();
  }
  finally {
    console.warn = warn;
  }
  return warnings;
}

it("config() warns about unknown chart and shapeConfig keys", () => {
  const warnings = captureWarnings(() => {
    new BarChart().config({
      colr: "id",
      shapeConfig: {
        fill: "red",
        r: 5,
        fil: "blue",
        Bar: {stroke: "black", strok: "black"},
        Circle: {trailPersist: true},
      },
    });
  });
  assert.deepStrictEqual(warnings, [
    'BarChart.config() received unknown property "colr".',
    'BarChart.shapeConfig() received unknown property "fil".',
    'BarChart.shapeConfig() received unknown property "Bar.strok".',
  ]);
});

it("repeated unknown keys only warn once", () => {
  const warnings = captureWarnings(() => {
    new Treemap().config({sizz: "value"});
    new Treemap().config({sizz: "value"});
  });
  assert.deepStrictEqual(warnings, ['Treemap.config() received unknown property "sizz".']);
});

it("configWarnings(false) silences unknown-key warnings", () => {
  assert.strictEqual(configWarnings(), true, "on by default");
  configWarnings(false);
  let warnings;
  try {
    warnings = captureWarnings(() => {
      new Treemap().config({silencedKey: 1, shapeConfig: {silencedShapeKey: 1}});
    });
    assert.strictEqual(configWarnings(), false);
  }
  finally {
    configWarnings(true);
  }
  assert.deepStrictEqual(warnings, []);
});
