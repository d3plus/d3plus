import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `colorScaleConfig.scale` as a function picks the scale on every render
    from the values the colorScale is built from: a small range draws a
    linear gradient, a large one jenks buckets, and new data re-picks.
*/

const box = "<div id='viz' style='width:700px;height:400px'></div>";

const rows = values => values.map((value, i) => ({id: `item ${i}`, value}));
const small = rows([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]);
const large = rows([1, 4, 9, 18, 30, 55, 80, 120]);

/**
    Renders a Treemap colored by `value` with a scale function on each data
    set in turn, and reports what the colorScale drew after each render.
*/
const probe = ({renderer, datasets, pick}) =>
  new Promise(resolve => {
    const calls = [];
    const warnings = [];
    const warn = console.warn;
    console.warn = msg => warnings.push(String(msg));
    const scale = new Function("return " + pick)();
    const viz = new window.d3plus.Treemap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .sum("value")
      .colorScale("value")
      .colorScaleConfig({
        scale(values, extent) {
          calls.push({values, extent, self: this === viz._colorScaleClass});
          return scale(values, extent);
        },
      });
    const results = [];
    const drawn = () => {
      const all = [];
      const visit = n => {
        if (!n) return;
        all.push(n);
        (n.children || []).forEach(visit);
      };
      visit(viz.toScene().root);
      const bucket = n => {
        let d = n.datum;
        while (d && d.__d3plus__ && d.data) d = d.data;
        return Boolean(d && d._isColorScaleBucket);
      };
      return {
        scale: viz._colorScaleClass._scaleType,
        gradient: all.some(
          n =>
            n.type === "rect" &&
            String(n.paint && n.paint.fill).startsWith("gradient:"),
        ),
        swatches: all.filter(
          n => n.type === "rect" && bucket(n) && !n.key.endsWith("::hit"),
        ).length,
      };
    };
    const next = i => {
      if (i === datasets.length) {
        console.warn = warn;
        resolve({results, calls, warnings});
        return;
      }
      viz.data(datasets[i]).render(() => {
        results.push(drawn());
        next(i + 1);
      });
    };
    next(0);
  });

const byRange = `(values, [min, max]) => (max - min > 5 ? "jenks" : "linear")`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a scale function draws a gradient for a small range and buckets for a large one`, async () => {
    const {results, calls} = await render(box, probe, {
      renderer,
      datasets: [small, large, small],
      pick: byRange,
    });
    assert.deepStrictEqual(
      results.map(r => r.scale),
      ["linear", "jenks", "linear"],
      "re-picks the scale on each render",
    );
    assert.ok(results[0].gradient, "linear draws a gradient bar");
    assert.strictEqual(results[0].swatches, 0, "linear draws no swatches");
    assert.ok(!results[1].gradient, "jenks draws no gradient bar");
    assert.ok(results[1].swatches > 1, "jenks draws a swatch per bucket");
    assert.ok(results[2].gradient, "back to a gradient for small data");
    assert.ok(
      calls.every(c => c.self),
      "called with the ColorScale as this",
    );
    const last = calls.filter(c => c.extent[1] === 120).pop();
    assert.deepStrictEqual(last.extent, [1, 120]);
    assert.deepStrictEqual(
      last.values,
      large.map(d => d.value),
      "called with the sorted values",
    );
  });
}

it("a scale function returning an unknown name warns and draws a linear scale", async () => {
  const {results, warnings} = await render(box, probe, {
    renderer: "svg",
    datasets: [large],
    pick: `() => "rainbow"`,
  });
  assert.strictEqual(results[0].scale, "linear");
  assert.ok(results[0].gradient, "falls back to a gradient bar");
  assert.ok(
    warnings.some(w => /unknown scale "rainbow"; using "linear"/.test(w)),
    "warns about the unknown scale",
  );
});
