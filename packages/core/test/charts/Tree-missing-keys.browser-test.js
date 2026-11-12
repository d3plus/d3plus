import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A row without a `groupBy` key at some level is drawn as a leaf of the
    group above that level, beside the group's other rows and sub-groups,
    named at the deepest level it has a key, on either renderer.
*/

const body = `
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Draws a Tree and returns what its scene and the page hold. */
const draw = async ({rows, groupBy, renderer}) => {
  const viz = new window.d3plus.Tree()
    .config({data: rows, duration: 0, groupBy, legend: false})
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
  const named = type =>
    nodes.filter(n => n.type === type).map(n => [n.key, n.aria.label]);
  return {
    circles: named("circle"),
    links: named("path").map(d => d[0]),
    labels: nodes
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" ")),
    domCircles: [
      ...document.querySelectorAll("#viz svg circle[aria-label]"),
    ].map(e => e.getAttribute("aria-label")),
  };
};

for (const renderer of ["svg", "canvas"]) {
  for (const key of [null, ""]) {
    const name = JSON.stringify(key);

    it(`Tree missing keys (${renderer}): a row whose middle key is ${name} is a leaf of its group`, async () => {
      const rows = [
        {top: "T", parent: "P1", id: "a", value: 1},
        {top: "T", parent: "P1", id: "b", value: 2},
        {top: "T", parent: key, id: "c", value: 3},
      ];
      const drawn = await render(body, draw, {
        rows,
        groupBy: ["top", "parent", "id"],
        renderer,
      });
      assert.deepStrictEqual(drawn.circles, [
        ["tree-Circle-T", "T."],
        ["tree-Circle-P1", "P1."],
        [`tree-Circle-T/${key}/c`, "c."],
        ["tree-Circle-a", "a."],
        ["tree-Circle-b", "b."],
      ]);
      assert.deepStrictEqual(drawn.links, [
        "tree-link-P1",
        `tree-link-T/${key}/c`,
        "tree-link-a",
        "tree-link-b",
      ]);
      assert.deepStrictEqual(drawn.labels, ["T", "P1", "c", "a", "b"]);
      if (renderer === "svg")
        assert.deepStrictEqual(drawn.domCircles, [
          "T.",
          "P1.",
          "c.",
          "a.",
          "b.",
        ]);
    });
  }
}
