import assert from "assert";
import it from "../jsdom.js";
import {
  // Class constructors
  AreaPlot,
  BarChart,
  BumpChart,
  Donut,
  LinePlot,
  Pie,
  Pack,
  Plot,
  Treemap,
  Tree,
  // v4 factories (alias-mode today)
  areaPlot,
  barChart,
  bumpChart,
  donut,
  linePlot,
  pie,
  pack,
  plot,
  treemap,
  tree,
} from "../../es/index.js";

/**
    Cross-chart factory ↔ class parity gate. The RFC §3.3 factory functions
    must produce `.config()` output byte-equivalent to their class
    counterparts. Today the factories are thin aliases (`barChart = () =>
    new BarChart()`); this test locks the contract so any future decoupling
    (extracting `runPipeline(def, config)` as a free function, etc.) cannot
    silently drift from the class shape.

    Chart selection: one from each public ancestry layer.
      - Plot subclasses (Plot defaults + Viz defaults): BarChart, AreaPlot,
        LinePlot, BumpChart, Plot itself.
      - Viz subclasses (Viz defaults + chart specifics): Treemap, Pack, Pie,
        Tree.
      - Class-extends-class: Donut (extends Pie).
*/

const cases = [
  ["BarChart", BarChart, barChart],
  ["AreaPlot", AreaPlot, areaPlot],
  ["LinePlot", LinePlot, linePlot],
  ["BumpChart", BumpChart, bumpChart],
  ["Plot", Plot, plot],
  ["Treemap", Treemap, treemap],
  ["Pack", Pack, pack],
  ["Pie", Pie, pie],
  ["Tree", Tree, tree],
  ["Donut", Donut, donut],
];

for (const [name, Cls, factory] of cases) {
  it(`${name}: factory and class expose the same .config() key set`, () => {
    const classKeys = Object.keys(new Cls().config()).sort();
    const factoryKeys = Object.keys(factory().config()).sort();
    assert.deepStrictEqual(
      factoryKeys,
      classKeys,
      `${name}: factory keys diverge from class keys`,
    );
  });

  it(`${name}: factory and class round-trip non-function values identically`, () => {
    const classCfg = new Cls().config();
    const factoryCfg = factory().config();
    // Functions can't be compared by reference (each instance closes over
    // its own `this`), so swap them for a "<fn>" sentinel before comparing.
    // Effectively asserts: same structure modulo function identity.
    const stripFns = v => {
      if (typeof v === "function") return "<fn>";
      if (Array.isArray(v)) return v.map(stripFns);
      if (v && typeof v === "object")
        return Object.fromEntries(Object.entries(v).map(([k, vv]) => [k, stripFns(vv)]));
      return v;
    };
    for (const key of Object.keys(classCfg)) {
      if (typeof classCfg[key] === "function") continue;
      let stripped, expected;
      try {
        stripped = stripFns(factoryCfg[key]);
        expected = stripFns(classCfg[key]);
      } catch {
        // Some config values are getters that touch jsdom-unsupported APIs
        // (e.g. localStorage on opaque origins). Skip those; the key-set
        // assertion above still locks the surface.
        continue;
      }
      assert.deepStrictEqual(
        stripped,
        expected,
        `${name}.${key} diverges`,
      );
    }
  });
}
