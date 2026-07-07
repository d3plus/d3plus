import assert from "assert";
import it from "../jsdom.js";
import {BarChart} from "../../es/index.js";
import {runLayout} from "../../es/internal.js";

/**
    `FeatureLayout.vizUpdate` — the v4 cross-feature write mechanism. A
    feature returns `{panel, margin, vizUpdate: {_foo: value, ...}}` and
    the `runLayout` engine applies the writes after the layout call. This
    lets features publish state declaratively instead of mutating viz
    from inside their layout body.

    Today's chart-bundled features (legend, timeline) still write directly
    because their OWN configuration calls in the same layout body read
    the just-written value — see comments in features.ts. The vizUpdate
    mechanism exists for FUTURE features that don't need intra-body reads
    (and as the eventual purification target for the current exceptions).
*/

it("runLayout applies a feature's vizUpdate to viz after layout", () => {
  const viz = new BarChart();
  viz._featurePanels = [];
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};

  const customFeature = {
    name: "test",
    layout() {
      return {
        panel: null,
        margin: {top: 10},
        vizUpdate: {_myCustomField: "applied"},
      };
    },
  };

  runLayout({viz}, [customFeature]);
  assert.strictEqual(
    viz._myCustomField,
    "applied",
    "vizUpdate key written to viz",
  );
});

it("runLayout's vizUpdate writes multiple keys at once", () => {
  const viz = new BarChart();
  viz._featurePanels = [];
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};

  const feature = {
    name: "multi",
    layout() {
      return {
        panel: null,
        margin: {},
        vizUpdate: {_a: 1, _b: "two", _c: [3]},
      };
    },
  };
  runLayout({viz}, [feature]);
  assert.strictEqual(viz._a, 1);
  assert.strictEqual(viz._b, "two");
  assert.deepStrictEqual(viz._c, [3]);
});

it("runLayout treats vizUpdate as optional — features without it still work", () => {
  const viz = new BarChart();
  viz._featurePanels = [];
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};

  const feature = {
    name: "no-update",
    layout() {
      return {panel: null, margin: {bottom: 5}};
    },
  };

  // Shouldn't throw.
  const result = runLayout({viz}, [feature]);
  assert.strictEqual(result.margin.bottom, 5);
});

it("Later features see earlier features' vizUpdate writes", () => {
  const viz = new BarChart();
  viz._featurePanels = [];
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};

  const writer = {
    name: "writer",
    layout() {
      return {panel: null, margin: {}, vizUpdate: {_published: 42}};
    },
  };
  let observed;
  const reader = {
    name: "reader",
    layout({viz}) {
      observed = viz._published;
      return {panel: null, margin: {}};
    },
  };
  runLayout({viz}, [writer, reader]);
  assert.strictEqual(observed, 42, "reader saw writer's vizUpdate");
});
