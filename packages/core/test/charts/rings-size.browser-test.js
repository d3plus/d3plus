import assert from "assert";

import {closeBrowser, render} from "../playwright.js";

/**
    Rings sizing regression (#83). Rings used to build its radius domain from
    a `size` property no node ever carried, so every sized node collapsed to
    `sizeMin` (and the center's radius went NaN, hiding it); `sizeScale` was
    ignored; and `sizeMax` never applied while `sizeMin` was set. Sized
    nodes now run through one `sizeScale` scale, clamped to both bounds.
*/

after(async () => {
  await closeBrowser();
});

const nodes = `[{id: "a", v: 50}, {id: "b", v: 100}, {id: "c", v: 10}, {id: "d", v: 400},
  {id: "e", v: 25}, {id: "f", v: 800}, {id: "g", v: 60}]`;
const links = `[{source: "a", target: "b"}, {source: "a", target: "c"}, {source: "a", target: "d"},
  {source: "b", target: "e"}, {source: "b", target: "f"}, {source: "c", target: "g"}]`;

/** Each node's rendered radius, by id. */
const radii = extra =>
  render('<div id="viz" style="width:800px;height:600px"></div>', src =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const out = {};
          const walk = n => {
            if (n.type === "circle" && n.datum) {
              const d = n.datum.data || n.datum;
              if (d.id !== undefined && !(d.id in out)) out[d.id] = n.r;
            }
            (n.children || []).forEach(walk);
          };
          walk(viz.toScene().root);
          resolve(out);
        } catch (e) {
          reject(e);
        }
      });
    }), `lib => new lib.Rings().nodes(${nodes}).links(${links}).center("a")${extra}`);

const values = {a: 50, b: 100, c: 10, d: 400, e: 25, f: 800, g: 60};

it("Rings: sized nodes get radii that grow with their value", async () => {
  const r = await radii(`.size("v")`);
  const ids = Object.keys(values).sort((x, y) => values[x] - values[y]);
  ids.forEach(id => assert.ok(Number.isFinite(r[id]), `${id} has a radius`));
  for (let i = 1; i < ids.length; i++)
    assert.ok(r[ids[i]] > r[ids[i - 1]], `${ids[i]} (${values[ids[i]]}) is larger than ${ids[i - 1]}`);
});

it("Rings: sizeMax caps the largest node and sizeMin floors the smallest", async () => {
  const r = await radii(`.size("v").sizeMin(3).sizeMax(12)`);
  assert.strictEqual(Math.max(...Object.values(r)), 12);
  assert.ok(Math.min(...Object.values(r)) >= 3);
});

it("Rings: sizeScale shapes the curve", async () => {
  const sqrt = await radii(`.size("v")`);
  const linear = await radii(`.size("v").sizeScale("linear")`);
  // Same extremes, but sqrt lifts the middle values.
  assert.strictEqual(sqrt.f, linear.f);
  assert.ok(sqrt.d > linear.d);
});

it("Rings: unsized nodes keep the fixed per-ring radii", async () => {
  const r = await radii("");
  assert.strictEqual(r.b, r.c);
  assert.strictEqual(r.b, r.d);
  assert.strictEqual(r.e, r.f);
  assert.ok(r.b > r.e, "inner ring nodes are larger than outer ring nodes");
});

/** Renders sized Rings centered on `center`, optionally re-centering on `click`, and reports the center label and feature panels. */
const centerProbe = (center, click) =>
  render('<div id="viz" style="width:800px;height:600px"></div>', ([src, clickId]) =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        if (clickId) viz.schema.on["click.shape"]({id: clickId});
        window.setTimeout(() => {
          try {
            const id = viz.schema.center;
            const node = viz.ctx.nodeLookup[id];
            const texts = [];
            const walk = n => {
              if (n.type === "text" && (n.lines || []).some(l => l.text.startsWith(id))) texts.push(n);
              (n.children || []).forEach(walk);
            };
            walk(viz.toScene().root);
            resolve({
              r: node.r,
              inside: node.labelInside,
              bounds: node.labelBounds,
              fill: texts[0] && texts[0].paint && texts[0].paint.fill,
              panels: viz._featurePanels.map(p => p.key),
            });
          } catch (e) {
            reject(e);
          }
        }, 300);
      });
    }), [`lib => new lib.Rings().nodes(${nodes}).links(${links}).center("${center}").size("v")`, click]);

it("Rings: a center too small for its label puts it below the circle, in dark text", async () => {
  const small = await centerProbe("c");
  assert.strictEqual(small.inside, false);
  assert.ok(small.bounds.y >= small.r, "label bounds start below the circle");
  assert.notStrictEqual(small.fill, "#fff");
  assert.notStrictEqual(small.fill, "#ffffff");
  const big = await centerProbe("f");
  assert.strictEqual(big.inside, true, "a large center keeps its label inside");
  assert.ok(big.bounds.y < 0);
});

it("Rings: re-centering on click keeps the corner controls and size legend", async () => {
  const before = await centerProbe("a");
  const after = await centerProbe("a", "d");
  ["viz-top-left-controls", "viz-zoom-controls", "viz-bottomRight"].forEach(key => {
    assert.ok(before.panels.includes(key), `${key} present before`);
    assert.ok(after.panels.includes(key), `${key} still present after the click`);
  });
});
