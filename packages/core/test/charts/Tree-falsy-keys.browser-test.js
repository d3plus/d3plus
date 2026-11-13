import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A group whose `groupBy` key is `0` or `false` draws like any other group:
    a node labelled with the key, over its children and the links to them. A
    key of `null` or `""` is no key: its row draws as one without it.
*/

const body = `
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Draws a Tree and returns what its scene and the page hold. */
const draw = async ({rows, renderer}) => {
  const viz = new window.d3plus.Tree()
    .config({
      data: rows,
      duration: 0,
      groupBy: ["parent", "id"],
      legend: false,
    })
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
  const keys = type => nodes.filter(n => n.type === type).map(n => n.key);
  return {
    circles: keys("circle"),
    links: keys("path"),
    labels: nodes
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" ")),
    domCircles: document.querySelectorAll("#viz svg circle[aria-label]").length,
    domLabels: [...document.querySelectorAll("#viz svg text")].map(
      t => t.textContent,
    ),
  };
};

for (const renderer of ["svg", "canvas"]) {
  for (const key of [0, false]) {
    it(`Tree falsy keys (${renderer}): a group keyed ${key} draws over its children`, async () => {
      const rows = [
        {parent: key, id: "a", value: 1},
        {parent: key, id: "b", value: 2},
        {parent: "P2", id: "c", value: 3},
        {parent: "P2", id: "d", value: 4},
      ];
      const drawn = await render(body, draw, {rows, renderer});
      const labels = [`${key}`, "P2", "a", "b", "c", "d"];
      assert.deepStrictEqual(drawn.circles, [
        `tree-Circle-${key}`,
        "tree-Circle-P2",
        "tree-Circle-a",
        "tree-Circle-b",
        "tree-Circle-c",
        "tree-Circle-d",
      ]);
      assert.deepStrictEqual(drawn.links, [
        "tree-link-a",
        "tree-link-b",
        "tree-link-c",
        "tree-link-d",
      ]);
      assert.deepStrictEqual(drawn.labels, labels);
      if (renderer === "svg") {
        assert.strictEqual(drawn.domCircles, 6);
        assert.deepStrictEqual(drawn.domLabels, labels);
      }
    });

    it(`Tree falsy keys (${renderer}): a leaf keyed ${key} draws under its group`, async () => {
      const rows = [
        {parent: "P1", id: key, value: 1},
        {parent: "P1", id: "b", value: 2},
        {parent: "P2", id: "c", value: 3},
        {parent: "P2", id: "d", value: 4},
      ];
      const drawn = await render(body, draw, {rows, renderer});
      const labels = ["P1", "P2", `${key}`, "b", "c", "d"];
      assert.deepStrictEqual(drawn.circles, [
        "tree-Circle-P1",
        "tree-Circle-P2",
        `tree-Circle-${key}`,
        "tree-Circle-b",
        "tree-Circle-c",
        "tree-Circle-d",
      ]);
      assert.deepStrictEqual(drawn.links, [
        `tree-link-${key}`,
        "tree-link-b",
        "tree-link-c",
        "tree-link-d",
      ]);
      assert.deepStrictEqual(drawn.labels, labels);
      if (renderer === "svg") {
        assert.strictEqual(drawn.domCircles, 6);
        assert.deepStrictEqual(drawn.domLabels, labels);
      }
    });
  }

  for (const key of [null, ""]) {
    it(`Tree falsy keys (${renderer}): a row whose deepest key is ${JSON.stringify(key)} draws as one without it`, async () => {
      const rows = [
        {parent: "P1", id: key, value: 1},
        {parent: "P2", id: "c", value: 3},
        {parent: "P2", id: "d", value: 4},
      ];
      const drawn = await render(body, draw, {rows, renderer});
      assert.deepStrictEqual(drawn.circles, [
        "tree-Circle-P1",
        "tree-Circle-P2",
        "tree-Circle-c",
        "tree-Circle-d",
      ]);
      assert.deepStrictEqual(drawn.links, ["tree-link-c", "tree-link-d"]);
      assert.deepStrictEqual(drawn.labels, ["P1", "P2", "c", "d"]);
      const missing = rows.map(({id, ...d}) => (id === key ? d : {...d, id}));
      assert.deepStrictEqual(
        drawn,
        await render(body, draw, {rows: missing, renderer}),
      );
    });
  }
}
