import assert from "assert";
import it from "../jsdom.js";
import {BarChart, barChart} from "../../es/index.js";

/**
    RFC §9.1 conformance gate. Per the v4 RFC, the eventual `createFluent`
    flip (RFC §3.3 / strangler step 4) MUST reproduce the existing class API's
    `.config()` output byte-for-byte — the React wrapper's `hash()` and any
    user-side config diffing depend on the keys and shapes.

    Today the class is the only source of that surface. This test captures
    the contract: every key, every default value, every key shape. When the
    `barChart()` factory eventually ships (or any other "is this still the
    same chart" gate), it must produce a `.config()` whose key set is a
    superset of the snapshot below (additions OK, removals/renames not).

    Update this snapshot ONLY when you're consciously adding or renaming a
    public config key — and update the migration notes in the v4 RFC.
*/

const expectedKeyCount = 80; // grew to this in 4.x; locked here so a future
// refactor that accidentally shrinks the surface fails loud.

const requiredKeys = [
  // BarChart-specific defaults (set by Plot/BarChart constructors)
  "baseline",
  "discrete",
  "shape",
  // Plot's identity-coerce accessors (E4)
  "barPadding",
  "lineLabels",
  "shapeSort",
  "sizeMax",
  "sizeMin",
  "sizeScale",
  "stacked",
  "xCutoff",
  "xDomain",
  "x2Domain",
  "xSort",
  "x2Sort",
  "yCutoff",
  "yDomain",
  "y2Domain",
  "ySort",
  "y2Sort",
  // Viz identity-coerce accessors (E4)
  "ariaHidden",
  "cache",
  "dataCutoff",
  "depth",
  "duration",
  "filter",
  "height",
  "legendSort",
  "svgDesc",
  "svgTitle",
  "timeFilter",
  "timeline",
  "width",
  "zoom",
  "zoomFactor",
  "zoomMax",
  "zoomPan",
  "zoomScroll",
];

it("BarChart .config() output exposes the v4 RFC §9.1 conformance surface", () => {
  const chart = new BarChart();
  const config = chart.config();
  const keys = Object.keys(config);

  for (const key of requiredKeys) {
    assert.ok(
      key in config,
      `Missing required key "${key}" in BarChart.config() output. Present keys: ${keys.slice(0, 30).join(", ")}…`,
    );
  }

  // Lock the key count too — catches both silent removals and inadvertent
  // additions that should be reviewed (and added to requiredKeys above).
  assert.ok(
    keys.length >= expectedKeyCount,
    `BarChart.config() exposes ${keys.length} keys, expected at least ${expectedKeyCount}. Did a recent refactor remove a public accessor? If a new accessor was added, bump expectedKeyCount + add it to requiredKeys.`,
  );
});

it("BarChart .config() round-trips identity-coerce values", () => {
  const chart = new BarChart();
  chart.config({
    baseline: 5,
    barPadding: 3,
    width: 800,
    height: 400,
    duration: 0,
  });
  const config = chart.config();
  assert.strictEqual(config.baseline, 5, "baseline round-trips");
  assert.strictEqual(config.barPadding, 3, "barPadding round-trips");
  assert.strictEqual(config.width, 800, "width round-trips");
  assert.strictEqual(config.height, 400, "height round-trips");
  assert.strictEqual(config.duration, 0, "duration round-trips");
});

it("barChart() factory produces .config() byte-equivalent to new BarChart()", () => {
  // RFC §3.3: factory + class must produce identical config output (the
  // factory is a thin alias today; the test locks the contract so any
  // future decoupling preserves byte-equivalence).
  const classChart = new BarChart();
  const factoryChart = barChart();
  const classConfig = classChart.config();
  const factoryConfig = factoryChart.config();

  const classKeys = Object.keys(classConfig).sort();
  const factoryKeys = Object.keys(factoryConfig).sort();

  assert.deepStrictEqual(
    factoryKeys,
    classKeys,
    "factory and class expose the same set of config keys",
  );

  // Walk required keys and assert deep equality of default values. Function
  // identity is intentionally NOT asserted (each instance has its own closure
  // bindings); for function values we just assert typeof match.
  for (const key of requiredKeys) {
    if (typeof classConfig[key] === "function") {
      assert.strictEqual(
        typeof factoryConfig[key],
        "function",
        `key "${key}" is function on class but not factory`,
      );
    } else {
      assert.deepStrictEqual(
        factoryConfig[key],
        classConfig[key],
        `key "${key}" diverges between factory and class`,
      );
    }
  }
});

it("barChart() factory accessors round-trip values", () => {
  const chart = barChart()
    .baseline(10)
    .barPadding(2)
    .width(600)
    .height(300);
  const config = chart.config();
  assert.strictEqual(config.baseline, 10);
  assert.strictEqual(config.barPadding, 2);
  assert.strictEqual(config.width, 600);
  assert.strictEqual(config.height, 300);
});
