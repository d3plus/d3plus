import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `depth` sets the deepest `groupBy` level a Tree draws: no node, link or
    label is drawn below it, and the chart is the one a Tree grouped by those
    levels alone draws.
*/

const body = `
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

const rows = [
  {top: "T", parent: "P1", id: "a", value: 1},
  {top: "T", parent: "P1", id: "b", value: 2},
  {top: "T", parent: "P2", id: "c", value: 3},
  {top: "T", parent: "P2", id: "d", value: 4},
];

/** Draws a Tree and returns what its scene and the page hold. */
const draw = async ({config, renderer}) => {
  const viz = new window.d3plus.Tree()
    .config({duration: 0, legend: false, ...config})
    .renderer(renderer)
    .select("#viz");
  await new Promise(resolve => viz.render(resolve));
  const nodes = [];
  const walk = list =>
    list.forEach(n => {
      nodes.push(n);
      if (n.children) walk(n.children);
    });
  walk(viz._chartScene);
  const of = type => nodes.filter(n => n.type === type);
  const labelled = tag =>
    [...document.querySelectorAll(`#viz svg ${tag}[aria-label]`)].map(e =>
      e.getAttribute("aria-label"),
    );
  return {
    circles: of("circle").map(n => [n.key, n.cx, n.cy]),
    links: of("path").map(n => [n.key, n.d, n.transform]),
    labels: of("text").map(n => [
      n.lines.map(l => l.text).join(" "),
      n.x,
      n.y,
      n.transform,
    ]),
    domCircles: labelled("circle"),
    domLinks: labelled("path"),
    domLabels: [...document.querySelectorAll("#viz svg text")].map(
      t => t.textContent,
    ),
  };
};

const keys = list => list.map(d => d[0]);

for (const renderer of ["svg", "canvas"]) {
  it(`Tree depth (${renderer}): depth(0) draws the first groupBy level alone`, async () => {
    const config = {data: rows, groupBy: ["parent", "id"], depth: 0};
    const drawn = await render(body, draw, {config, renderer});
    assert.deepStrictEqual(keys(drawn.circles), [
      "tree-Circle-P1",
      "tree-Circle-P2",
    ]);
    assert.deepStrictEqual(drawn.links, []);
    assert.deepStrictEqual(keys(drawn.labels), ["P1", "P2"]);
    if (renderer === "svg") {
      assert.deepStrictEqual(drawn.domCircles, ["P1.", "P2."]);
      assert.deepStrictEqual(drawn.domLinks, []);
      assert.deepStrictEqual(drawn.domLabels, ["P1", "P2"]);
    }
  });

  it(`Tree depth (${renderer}): depth(1) stops at the second of three groupBy levels`, async () => {
    const config = {data: rows, groupBy: ["top", "parent", "id"], depth: 1};
    const drawn = await render(body, draw, {config, renderer});
    assert.deepStrictEqual(keys(drawn.circles), [
      "tree-Circle-T",
      "tree-Circle-P1",
      "tree-Circle-P2",
    ]);
    assert.deepStrictEqual(keys(drawn.links), ["tree-link-P1", "tree-link-P2"]);
    assert.deepStrictEqual(keys(drawn.labels), ["T", "P1", "P2"]);
    if (renderer === "svg") {
      assert.strictEqual(drawn.domCircles.length, 3);
      assert.strictEqual(drawn.domLinks.length, 2);
      assert.deepStrictEqual(drawn.domLabels, ["T", "P1", "P2"]);
    }
  });

  for (const orient of ["vertical", "horizontal"]) {
    it(`Tree depth (${renderer}): depth(0) draws what grouping by the first level alone draws (${orient})`, async () => {
      const shallow = await render(body, draw, {
        config: {data: rows, groupBy: ["parent", "id"], depth: 0, orient},
        renderer,
      });
      const single = await render(body, draw, {
        config: {data: rows, groupBy: ["parent"], orient},
        renderer,
      });
      assert.deepStrictEqual(shallow, single);
    });
  }
}
