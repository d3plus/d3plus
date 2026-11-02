import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Sankey links that loop back through several nodes (A → B → C → A), in
    Chromium on SVG and Canvas: the chart draws the rest, leaving out the
    lightest link on each loop with one warning.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

/**
    Runs in the page: draws a Sankey from `config`, logging console warnings
    to `window.__warnings`, then resolves with how long it took once it has
    painted.
*/
const draw = ([config, renderer]) =>
  new Promise(resolve => {
    window.__warnings = [];
    const warn = console.warn;
    console.warn = (...args) => {
      window.__warnings.push(args.join(" "));
      warn.apply(console, args);
    };
    const start = performance.now();
    const viz = new window.d3plus.Sankey()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .value("value")
      .config(config);
    window.__viz = viz;
    viz.render(() => resolve(performance.now() - start));
  });

/** Runs in the page: the painted links and nodes, with their geometry, by key. */
const sceneNodes = () => {
  const out = {};
  const walk = n => {
    if (n.key !== undefined && n.type !== "group")
      out[String(n.key)] = {
        d: n.d,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
      };
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  return out;
};

/** Opens a page, draws a Sankey, and runs `check(page, time)` on it. */
async function withSankey(args, check) {
  const {page, errors, close} = await openPage(box);
  try {
    const time = await page.evaluate(draw, args);
    await check(page, time);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

const finite = node =>
  Object.values(node).every(
    v => v === undefined || !/NaN|Infinity/.test(String(v)),
  );

for (const renderer of ["svg", "canvas"]) {
  it(`Sankey ${renderer}: leaves out the links that close loops, with one warning`, async () => {
    const links = [
      {source: "A", target: "B", value: 6},
      {source: "B", target: "C", value: 4},
      {source: "C", target: "A", value: 1},
      {source: "C", target: "D", value: 3},
      {source: "D", target: "B", value: 2},
      {source: "E", target: "E", value: 5},
      {source: "D", target: "E", value: 2},
    ];
    await withSankey([{links}, renderer], async page => {
      const scene = await page.evaluate(sceneNodes);
      const drawn = Object.keys(scene)
        .filter(k => /^sankey-link-[A-E]-[A-E]$/.test(k))
        .sort();
      assert.deepStrictEqual(drawn, [
        "sankey-link-A-B",
        "sankey-link-B-C",
        "sankey-link-C-D",
        "sankey-link-D-E",
      ]);
      for (const id of "ABCDE") {
        const node = scene[`sankey-Rect-${id}`];
        assert.ok(node && node.height > 0, `node ${id} is drawn`);
      }
      for (const [key, node] of Object.entries(scene))
        assert.ok(finite(node), `${key}: ${JSON.stringify(node)}`);
      const warnings = await page.evaluate(() => window.__warnings);
      assert.deepStrictEqual(warnings, [
        "Sankey can't draw a flow that loops back into a node it left, so it leaves out 3 links (C → A, D → B, E → E).",
      ]);

      // Redrawing doesn't warn again.
      await page.evaluate(
        () => new Promise(r => window.__viz.render(() => r(true))),
      );
      assert.strictEqual(
        (await page.evaluate(() => window.__warnings)).length,
        1,
      );
    });
  });

  it(`Sankey ${renderer}: draws a 200-node graph full of loops`, async () => {
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const links = [];
    for (let s = 0; s < 200; s++)
      for (let k = 0; k < 4; k++) {
        const t = Math.floor(random() * 200);
        if (t !== s)
          links.push({source: `n${s}`, target: `n${t}`, value: random() * 9});
      }
    await withSankey([{links}, renderer], async (page, time) => {
      assert.ok(time < 5000, `drawn in ${time}ms`);
      const scene = await page.evaluate(sceneNodes);
      const nodes = Object.keys(scene).filter(k => k.startsWith("sankey-Rect"));
      assert.strictEqual(nodes.length, 200);
      const drawn = Object.keys(scene).filter(k =>
        /^sankey-link-n\d+-n\d+$/.test(k),
      );
      assert.ok(
        drawn.length > 0 && drawn.length < links.length,
        `${drawn.length} of ${links.length}: ${drawn.slice(0, 5)}`,
      );
      for (const [key, node] of Object.entries(scene))
        assert.ok(finite(node), `${key}: ${JSON.stringify(node)}`);
      const warnings = await page.evaluate(() => window.__warnings);
      assert.strictEqual(warnings.length, 1, String(warnings));
      assert.ok(
        /leaves out \d+ links \(.*, and \d+ more\)\.$/.test(warnings[0]),
      );
    });
  });
}
