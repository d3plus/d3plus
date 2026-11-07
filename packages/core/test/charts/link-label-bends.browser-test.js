import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `linkLabelConfig.minRadius` in Chromium, on SVG and Canvas: self-loops
    of growing size, each labelled, keep a straight label while they bend
    tighter than `minRadius` ems and curve their label once they are wider.
*/

const box = "<div id='viz' style='width:900px;height:300px'></div>";

/**
    Runs in the page: a row of nodes of growing size, each with a loop, and
    which loops' labels follow the curve (a text node with a path), by node.
*/
const draw = ([renderer, linkLabelConfig]) =>
  new Promise(resolve => {
    const nodes = Array.from({length: 8}, (_, i) => ({
      id: `n${i}`,
      x: i,
      y: 0,
      size: i + 1,
    }));
    const viz = new window.d3plus.Network()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config({
        nodes,
        data: nodes,
        links: nodes.map(n => ({source: n.id, target: n.id})),
        size: "size",
        sizeMin: 4,
        sizeMax: 34,
        label: () => "",
        legend: false,
        linkLabel: () => "42",
        linkLabelConfig,
      });
    viz.render(() => {
      const curved = [];
      const straight = [];
      const walk = node => {
        const key = String(node.key);
        if (/-label-group$/.test(key)) {
          const text = (node.children || []).find(c => c.type === "text");
          const id = node.datum?.source?.id;
          if (text) (text.path ? curved : straight).push(id);
          return;
        }
        (node.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      resolve({
        curved: curved.sort(),
        straight: straight.sort(),
        textPaths: document.querySelectorAll("#viz textPath").length,
      });
    });
  });

const index = id => Number(id.slice(1));

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: a loop tighter than minRadius keeps a straight label`, async () => {
    const tight = await render(box, draw, [renderer, {minRadius: 1}]);
    const base = await render(box, draw, [renderer, {}]);
    const loose = await render(box, draw, [renderer, {minRadius: 4}]);
    for (const out of [tight, base, loose])
      assert.strictEqual(out.curved.length + out.straight.length, 8);
    // Each larger cutoff straightens more loops: the smallest ones.
    assert.ok(
      tight.curved.length > base.curved.length,
      `${tight.curved} vs ${base.curved}`,
    );
    assert.ok(base.curved.length > 0, "the widest loops still curve");
    assert.strictEqual(loose.curved.length, 0, "no loop is 4em wide");
    for (const out of [tight, base]) {
      const smallestCurved = Math.min(...out.curved.map(index));
      const largestStraight = Math.max(...out.straight.map(index));
      assert.ok(
        smallestCurved > largestStraight,
        `small loops straight, large ones curved (${out.straight} | ${out.curved})`,
      );
    }
    assert.ok(base.straight.includes("n0") && base.curved.includes("n7"));
    if (renderer === "svg")
      for (const out of [tight, base, loose])
        assert.strictEqual(out.textPaths, out.curved.length);
  });
}
