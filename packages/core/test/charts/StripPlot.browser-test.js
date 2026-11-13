import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    StripPlot (Plot's `jitter`) and barcode plots (the Tick shape) in a real
    browser, on SVG and Canvas: points spread across their category's band
    by offsets seeded from their ids, so a filter or a resize leaves each
    point at the same share of its band, and ticks span 0.6 of the band.
*/

const probe = ([renderer, steps]) =>
  new Promise(resolve => {
    const rows = Array.from({length: 60}, (_, i) => ({
      id: `p${i}`,
      cat: ["A", "B", "C"][i % 3],
      v: (i * 37) % 100,
      keep: i % 2 === 0,
    }));
    const el = document.createElement("div");
    document.body.appendChild(el);
    const walk = (nodes, out = []) => {
      for (const n of nodes || []) {
        if (n.type === "group") walk(n.children, out);
        else out.push(n);
      }
      return out;
    };
    // Each data mark's center, offset from its category, as a share of the band.
    const read = viz => {
      const scale = viz._xAxis._d3Scale;
      const domain = scale.domain();
      const at = c => viz._xAxis._getPosition(c);
      const step = at(domain[1]) - at(domain[0]);
      const marks = {};
      let nan = 0;
      for (const n of walk(viz._chartScene)) {
        if (!["Circle", "Tick"].includes(n.shapeType) || !n.datum) continue;
        if (String(n.key).endsWith("::hit")) continue;
        const d = n.datum.data;
        const x = n.transform.x;
        if (!Number.isFinite(x)) nan++;
        marks[d.id] = {
          share: (x - at(d.cat)) / step,
          width: n.width,
          height: n.height,
        };
      }
      return {marks, step, nan};
    };
    const out = [];
    const viz = new window.d3plus.StripPlot()
      .select(el)
      .renderer(renderer)
      .detectVisible(false)
      .duration(0)
      .width(600)
      .height(400)
      .data(rows)
      .groupBy("id")
      .x("cat")
      .y("v");
    const next = () => {
      const step = steps.shift();
      if (!step) return resolve(out);
      // `keep` redraws with half the rows, as a filter would.
      if (step.keep) viz.data(rows.filter(d => d.keep));
      else viz.config(step);
      viz.render(() => {
        out.push(read(viz));
        next();
      });
    };
    next();
  });

for (const renderer of ["svg", "canvas"]) {
  it(`StripPlot: points spread across 0.6 of their band, and stay put through a filter and a resize (${renderer})`, async function () {
    const [first, filtered, resized, narrow] = await render("", probe, [
      renderer,
      [{}, {keep: true}, {width: 900}, {jitter: 0.2}],
    ]);
    assert.strictEqual(first.nan, 0);
    const shares = Object.values(first.marks).map(m => m.share);
    assert.strictEqual(shares.length, 60);
    assert.ok(
      shares.every(s => Math.abs(s) <= 0.3 + 1e-9),
      "inside the band",
    );
    assert.ok(
      Math.max(...shares) - Math.min(...shares) > 0.45,
      "spread across it",
    );
    for (const [id, m] of Object.entries(filtered.marks))
      assert.ok(Math.abs(m.share - first.marks[id].share) < 1e-6, id);
    assert.strictEqual(Object.keys(filtered.marks).length, 30);
    assert.ok(resized.step > first.step);
    for (const [id, m] of Object.entries(resized.marks))
      assert.ok(Math.abs(m.share - first.marks[id].share) < 1e-6, id);
    for (const [id, m] of Object.entries(narrow.marks))
      assert.ok(Math.abs(m.share - first.marks[id].share / 3) < 1e-6, id);
  });

  it(`StripPlot: shape "Tick" draws a barcode, each tick 0.6 of the band (${renderer})`, async function () {
    const [ticks, vertical] = await render("", probe, [
      renderer,
      [{shape: "Tick"}, {shape: "Tick", discrete: "y", x: "v", y: "cat"}],
    ]);
    assert.strictEqual(ticks.nan, 0);
    const marks = Object.values(ticks.marks);
    assert.strictEqual(marks.length, 60);
    for (const m of marks) {
      assert.ok(Math.abs(m.share) < 1e-6, "ticks sit on their category");
      assert.ok(Math.abs(m.width - ticks.step * 0.6) < 1e-6);
      assert.strictEqual(m.height, 2);
    }
    // Along a discrete y axis the ticks stand upright.
    const upright = Object.values(vertical.marks);
    assert.ok(upright.every(m => m.width === 2 && m.height > 2));
  });
}
