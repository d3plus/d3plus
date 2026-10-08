/* global console */
import assert from "assert";
import {BarChart, configWarnings, Network, Pack, Pie, Treemap, Viz} from "../../es/index.js";

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

it("shapeConfig() validates on charts whose def seeds shapeConfig, as on a Viz", () => {
  for (const Chart of [Viz, Network, Pack, Pie, Treemap]) {
    const name = Chart.name;
    const warnings = captureWarnings(() => {
      new Chart().shapeConfig({fill: "red", fll: "blue", Circle: {r: 4, rr: 4}});
    });
    assert.deepStrictEqual(warnings, [
      `${name}.shapeConfig() received unknown property "fll".`,
      `${name}.shapeConfig() received unknown property "Circle.rr".`,
    ]);
  }
});

it("shapeConfig() deep-merges into a fresh copy of a def-seeded bag", () => {
  const chart = new Treemap();
  const seeded = chart.shapeConfig();
  assert.strictEqual(seeded.labelConfig.fontMax, 32, "Treemap seeds labelConfig.fontMax");
  chart.shapeConfig({labelConfig: {fontWeight: 700}});
  const next = chart.shapeConfig();
  assert.notStrictEqual(next, seeded, "the stored bag is a fresh object");
  assert.strictEqual(seeded.labelConfig.fontWeight, undefined, "the previous bag is untouched");
  assert.strictEqual(next.labelConfig.fontWeight, 700, "the new key is set");
  assert.strictEqual(next.labelConfig.fontMax, 32, "the seeded sibling keys are kept");
  assert.strictEqual(typeof next.ariaLabel, "function", "top-level seeded keys are kept");
});
