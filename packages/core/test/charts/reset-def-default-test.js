import {describe, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import * as core from "../../index.ts";
import {installFluent, nestedReset, resetArg} from "../../src/fluent.ts";
import {default as BaseClass} from "../../src/utils/BaseClass.ts";

useJsdom();

const {
  BubbleChart,
  Chord,
  Donut,
  Geomap,
  LinePlot,
  Parliament,
  Pie,
  Plot,
  RESET,
  Rings,
  Sankey,
  Scatter,
  StripPlot,
  Waffle,
} = core;

/** A value's structure, with functions called on an empty row, for comparing across instances. */
function shape(value) {
  if (typeof value === "function") {
    try {
      return {fn: shape(value({}, 0))};
    } catch {
      return "[fn]";
    }
  }
  if (Array.isArray(value)) return value.map(shape);
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, shape(v)]),
    );
  return value;
}

/**
    [Chart, Base, key, a value to set]: fields a chart's definition gives a
    default of its own over the base chart's.
*/
const overrides = [
  [Donut, Pie, "padPixel", 9],
  [LinePlot, Plot, "discrete", "y"],
  [StripPlot, Plot, "jitter", false],
  [StripPlot, Plot, "tooltipShared", true],
  [BubbleChart, Scatter, "sizeMax", 12],
  [Parliament, Waffle, "layout", "grid"],
];

describe("RESET restores a chart definition's own field default", () => {
  for (const [Chart, Base, key, value] of overrides) {
    const name = `${Chart.name || "Chart"}.${key}`;
    const fresh = () => shape(new Chart()[key]());

    it(`${name}: the definition's default differs from the base chart's`, () => {
      assert.notDeepStrictEqual(fresh(), shape(new Base()[key]()));
    });

    it(`${name}: config({${key}: RESET}) after a setter call`, () => {
      const viz = new Chart();
      viz[key](value);
      viz.config({[key]: RESET});
      assert.deepStrictEqual(shape(viz[key]()), fresh());
    });

    it(`${name}: config({${key}: RESET}) after config()`, () => {
      const viz = new Chart().config({[key]: value});
      viz.config({[key]: RESET});
      assert.deepStrictEqual(shape(viz[key]()), fresh());
    });

    it(`${name}: viz.${key}(RESET)`, () => {
      const viz = new Chart();
      viz[key](value);
      assert.strictEqual(viz[key](RESET), viz, "chains");
      assert.deepStrictEqual(shape(viz[key]()), fresh());
    });
  }

  it("a merged config bag restores the definition's defaults, not values set before the first RESET", () => {
    const viz = new StripPlot().shapeConfig({Circle: {r: 9, label: true}});
    viz.config({shapeConfig: RESET});
    assert.deepStrictEqual(
      shape(viz.shapeConfig()),
      shape(new StripPlot().shapeConfig()),
    );
    assert.strictEqual(viz.shapeConfig().Circle.label, false);
  });

  it("a hand-written setter restores the default it had before the first RESET", () => {
    const viz = new Donut().locale("es-ES");
    viz.config({locale: RESET});
    assert.strictEqual(viz.locale(), "en-US");
  });

  it("a chart class snapshots its defaults once it is constructed", () => {
    assert.ok(new Donut()._configDefault, "Donut");
    assert.strictEqual(new Donut()._configDefault.padPixel, 2);
  });

  it("a subclass's own constructor still seeds the defaults RESET restores", () => {
    class WideDonut extends Donut {
      constructor() {
        super();
        this.schema.padPixel = 6;
      }
    }
    const viz = new WideDonut().config({padPixel: 1});
    viz.config({padPixel: RESET});
    assert.strictEqual(viz.padPixel(), 6);
    viz.padPixel(1).padPixel(RESET);
    assert.strictEqual(viz.padPixel(), 6);
  });

  it("a generated accessor resolves a nested RESET like config() does", () => {
    const viz = new Geomap().ocean({light: "red", dark: "blue"});
    viz.ocean({light: RESET, dark: "green"});
    const direct = viz.ocean();
    const other = new Geomap().config({ocean: {light: "red", dark: "blue"}});
    other.config({ocean: {light: RESET, dark: "green"}});
    assert.deepStrictEqual(direct, other.ocean());
    assert.strictEqual(direct.light, new Geomap().ocean().light);
    assert.strictEqual(direct.dark, "green");
  });

  it("a generated accessor runs its field's onSet for a RESET", () => {
    const seen = [];
    class Host {}
    const host = new Host();
    installFluent(host, [
      {key: "size", default: 4, onSet: (_, v) => seen.push(v)},
    ]);
    host.size(8).size(RESET);
    assert.deepStrictEqual(seen, [4, 8, 4]);
  });

  it("a generated accessor on a host with no snapshot restores its field's seed", () => {
    class Host {}
    const host = new Host();
    installFluent(host, [{key: "mode", default: "full"}]);
    host.mode("compute").mode(RESET);
    assert.strictEqual(host.mode(), "full");
  });

  it("an overriding field with no default of its own restores the field it overrides", () => {
    class Base {}
    const host = new Base();
    const base = [{key: "gap", default: 3}];
    const child = [{key: "gap", coerce: "identity"}];
    installFluent(host, base);
    installFluent(host, child);
    host.gap(10).gap(RESET);
    assert.strictEqual(host.gap(), 3);
  });
});

describe("RESET on the chart setters a definition writes by hand", () => {
  const cases = [
    [Chord, "value", "weight"],
    [Sankey, "value", "weight"],
    [Sankey, "nodeAlign", "left"],
    [Rings, "linkSize", 4],
    [Geomap, "point", [1, 2]],
    [Geomap, "pointSize", 6],
    [Geomap, "topojsonFill", "red"],
    [Geomap, "topojsonFilter", ["840"]],
    [Geomap, "projectionPadding", 4],
    [Geomap, "fitObject", {type: "Topology", objects: {}}],
    [Geomap, "topojson", {type: "Topology", objects: {}}],
  ];
  for (const [Chart, key, value] of cases) {
    it(`${Chart.name}.${key}(RESET) and config({${key}: RESET})`, () => {
      const want = shape(new Chart()[key]());
      const direct = new Chart();
      direct[key](value);
      direct[key](RESET);
      assert.deepStrictEqual(shape(direct[key]()), want, "direct");
      const config = new Chart();
      config[key](value);
      config.config({[key]: RESET});
      assert.deepStrictEqual(shape(config[key]()), want, "config");
    });
  }

  it("Geomap.projectionPadding takes back the sides object it returns", () => {
    const viz = new Geomap().projectionPadding("4 8");
    const sides = viz.projectionPadding();
    assert.deepStrictEqual(
      new Geomap().projectionPadding(sides).projectionPadding(),
      {
        top: 4,
        right: 8,
        bottom: 4,
        left: 8,
      },
    );
    assert.notStrictEqual(
      viz.projectionPadding(sides).projectionPadding(),
      sides,
    );
  });

  it("data(RESET) restores an empty data array", () => {
    const viz = new Donut().data([{id: "a", value: 1}]);
    viz.data(RESET);
    assert.deepStrictEqual(viz.data(), []);
  });
});

describe("resetArg", () => {
  it("swaps a whole-value RESET for the host's default snapshot entry", () => {
    const host = new BaseClass();
    host.schema.locale = "en-US";
    host._defaultConfig();
    assert.strictEqual(resetArg(host, "locale", RESET), "en-US");
  });

  it("passes any other value through untouched", () => {
    const host = new BaseClass();
    const value = {a: RESET};
    assert.strictEqual(resetArg(host, "locale", value), value);
    assert.strictEqual(resetArg(host, "locale", "fr-FR"), "fr-FR");
  });

  it("gives undefined for a host with no snapshot", () => {
    assert.strictEqual(resetArg({schema: {}}, "x", RESET), undefined);
  });
});

describe("nestedReset", () => {
  it("swaps nested RESETs for the matching defaults and drops those with none", () => {
    const value = {a: RESET, b: {c: RESET, d: 2}, e: RESET};
    const out = nestedReset(value, {a: 1, b: {c: 3}});
    assert.deepStrictEqual(out, {a: 1, b: {c: 3, d: 2}});
    assert.deepStrictEqual(value, {a: RESET, b: {c: RESET, d: 2}, e: RESET});
  });

  it("returns a value with no RESET as is", () => {
    const value = {a: 1};
    assert.strictEqual(nestedReset(value, {a: 2}), value);
    assert.strictEqual(nestedReset("x", {}), "x");
  });

  it("leaves underscore keys alone", () => {
    assert.deepStrictEqual(nestedReset({_a: RESET, b: RESET}, {_a: 1, b: 2}), {
      _a: RESET,
      b: 2,
    });
  });
});
