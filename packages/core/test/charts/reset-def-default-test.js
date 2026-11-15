import {describe, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import * as core from "../../index.ts";
import {installFluent, nestedReset, resetArg} from "../../src/fluent.ts";
import {default as BaseClass} from "../../src/utils/BaseClass.ts";

useJsdom();

const {
  Axis,
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
  TextBox,
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

  describe("a user's subclass snapshots at the end of the last d3plus constructor", () => {
    /**
        [name, base class, key, the value the subclass's constructor sets,
        a value set before the first config()].
    */
    const cases = [
      ["a makeChart chart", Donut, "padPixel", 6, 9],
      ["Plot", Plot, "discreteCutoff", 7, 3],
      ["Axis", Axis, "orient", "left", "top"],
      ["TextBox", TextBox, "delay", 40, 12],
    ];
    for (const [label, Base, key, own, early] of cases) {
      it(`${label}: what its own constructor sets is not a default`, () => {
        class Custom extends Base {
          constructor() {
            super();
            this[key](own);
          }
        }
        const want = new Base()[key]();
        const viz = new Custom();
        assert.strictEqual(viz[key](), own, "the constructor sets it");
        assert.strictEqual(viz._configDefault[key], want, "snapshot");
        viz.config({[key]: RESET});
        assert.strictEqual(viz[key](), want, "config({key: RESET})");
        viz[key](own)[key](RESET);
        assert.strictEqual(viz[key](), want, "x.key(RESET)");
        const set = new Custom()[key](early);
        set.config({[key]: RESET});
        assert.strictEqual(
          set[key](),
          want,
          "nor is a value set before config()",
        );
      });
    }

    it("a user's class built straight on BaseClass keeps its constructor's defaults", () => {
      class Widget extends BaseClass {
        constructor() {
          super();
          this._size = 10;
        }
        size(_) {
          return arguments.length ? ((this._size = _), this) : this._size;
        }
      }
      class Gadget extends Widget {}
      for (const Cls of [Widget, Gadget]) {
        const widget = new Cls();
        assert.strictEqual(widget._configDefault, undefined, "first use");
        widget.config({size: 20});
        widget.size(RESET);
        assert.strictEqual(widget.size(), 10, `${Cls.name}: size(RESET)`);
        widget.size(30).config({size: RESET});
        assert.strictEqual(widget.size(), 10, `${Cls.name}: config RESET`);
      }
    });

    it("a subclass of a user's subclass snapshots at the same point", () => {
      class A extends Donut {
        constructor() {
          super();
          this.padPixel(6);
        }
      }
      class B extends A {}
      const viz = new B().padPixel(4);
      viz.config({padPixel: RESET});
      assert.strictEqual(viz.padPixel(), 2);
    });
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

  it("Geomap.projectionRotate(RESET) turns the tiles back to what they were", () => {
    const on = new Geomap().projectionRotate([90, 0]);
    assert.strictEqual(on.tiles(), false, "a rotation turns tiles off");
    on.projectionRotate([45, 10]).projectionRotate(RESET);
    assert.strictEqual(on.projectionRotate(), undefined);
    assert.deepStrictEqual(on.projection().rotate(), [0, 0, 0]);
    assert.strictEqual(on.tiles(), true, "tiles back on");
    const off = new Geomap().tiles(false).projectionRotate([90, 0]);
    off.config({projectionRotate: RESET});
    assert.strictEqual(off.tiles(), false, "tiles stay off");
    const plain = new Geomap().tiles(false).projectionRotate(RESET);
    assert.strictEqual(plain.tiles(), false, "no rotation to undo");
    const byHand = new Geomap().projectionRotate([90, 0]).tiles(false);
    byHand.projectionRotate(RESET);
    assert.strictEqual(byHand.tiles(), false, "tiles set by hand stay so");
    const turnedOn = new Geomap().tiles(false).projectionRotate([90, 0]);
    turnedOn.tiles(true).projectionRotate([10, 0]).projectionRotate(RESET);
    assert.strictEqual(turnedOn.tiles(), true, "the later call wins");
  });

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
