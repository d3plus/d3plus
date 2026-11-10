import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Tree node's accessible name is its label at its own `groupBy` level, the
    one drawn beside it and titling its tooltip: a branch node is named after
    its group, and so is the link that leads to it. SVG writes the name as
    each shape's `aria-label`; on both renderers keyboard navigation announces
    it in the chart's live region.
*/

const body = `
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

const rows = [
  {top: "T", parent: "P1", id: "a", value: 1},
  {top: "T", parent: "P1", id: "b", value: 2},
  {top: "T", parent: "P2", id: "c", value: 3},
  {top: "T", parent: "P2", id: "d", value: 4},
];

/**
    Draws a Tree, then focuses it and presses each of `keys`. Returns the
    accessible names in its scene and in the page, its drawn labels, and after
    the focus and each key what the live region announces beside the title of
    the tooltip showing.
*/
const draw = async ({groupBy, keys, renderer}) => {
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
  const dom = tag =>
    [...document.querySelectorAll(`#viz svg ${tag}[aria-label]`)]
      .map(e => e.getAttribute("aria-label"))
      .sort();

  const host = document.querySelector("#viz .d3plus-keyboard-nav");
  const settle = () =>
    new Promise(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 40)),
    );
  const announced = [];
  const read = async () => {
    await settle();
    const title = document.querySelector(".d3plus-tooltip-title");
    announced.push([
      host.querySelector("[aria-live]").textContent,
      title ? title.textContent : null,
    ]);
  };
  host.focus();
  await read();
  for (const key of keys) {
    host.dispatchEvent(new KeyboardEvent("keydown", {key, bubbles: true}));
    await read();
  }

  return {
    circles: named("circle"),
    links: named("path"),
    labels: nodes
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" ")),
    domCircles: dom("circle"),
    domLinks: dom("path"),
    announced,
  };
};

for (const renderer of ["svg", "canvas"]) {
  it(`Tree aria (${renderer}): a branch node is named after its group`, async () => {
    const drawn = await render(body, draw, {
      groupBy: ["parent", "id"],
      keys: ["ArrowUp", "ArrowUp", "ArrowRight"],
      renderer,
    });
    assert.deepStrictEqual(drawn.circles, [
      ["tree-Circle-P1", "P1."],
      ["tree-Circle-P2", "P2."],
      ["tree-Circle-a", "a."],
      ["tree-Circle-b", "b."],
      ["tree-Circle-c", "c."],
      ["tree-Circle-d", "d."],
    ]);
    assert.deepStrictEqual(
      drawn.circles.map(d => d[1]),
      drawn.labels.map(label => `${label}.`),
      "each node's name is its drawn label",
    );
    assert.deepStrictEqual(drawn.links, [
      ["tree-link-a", "a."],
      ["tree-link-b", "b."],
      ["tree-link-c", "c."],
      ["tree-link-d", "d."],
    ]);
    if (renderer === "svg") {
      assert.deepStrictEqual(drawn.domCircles, [
        "P1.",
        "P2.",
        "a.",
        "b.",
        "c.",
        "d.",
      ]);
      assert.deepStrictEqual(drawn.domLinks, ["a.", "b.", "c.", "d."]);
    }
    // Focus lands on the leftmost node, a leaf. Up from it is its link, then
    // its group, and right of that the next group.
    assert.deepStrictEqual(drawn.announced, [
      ["a.", "a"],
      ["a.", "a"],
      ["P1.", "P1"],
      ["P2.", "P2"],
    ]);
  });

  it(`Tree aria (${renderer}): every level of a three-level tree is named at its own depth`, async () => {
    const drawn = await render(body, draw, {
      groupBy: ["top", "parent", "id"],
      keys: ["ArrowUp", "ArrowUp", "ArrowUp", "ArrowUp"],
      renderer,
    });
    assert.deepStrictEqual(drawn.circles, [
      ["tree-Circle-T", "T."],
      ["tree-Circle-P1", "P1."],
      ["tree-Circle-P2", "P2."],
      ["tree-Circle-a", "a."],
      ["tree-Circle-b", "b."],
      ["tree-Circle-c", "c."],
      ["tree-Circle-d", "d."],
    ]);
    assert.deepStrictEqual(drawn.links, [
      ["tree-link-P1", "P1."],
      ["tree-link-P2", "P2."],
      ["tree-link-a", "a."],
      ["tree-link-b", "b."],
      ["tree-link-c", "c."],
      ["tree-link-d", "d."],
    ]);
    if (renderer === "svg") {
      assert.deepStrictEqual(drawn.domCircles, [
        "P1.",
        "P2.",
        "T.",
        "a.",
        "b.",
        "c.",
        "d.",
      ]);
      assert.deepStrictEqual(drawn.domLinks, [
        "P1.",
        "P2.",
        "a.",
        "b.",
        "c.",
        "d.",
      ]);
    }
    // Up from the leftmost leaf: its link, its group, the group's link, and
    // the top-level node.
    assert.deepStrictEqual(drawn.announced, [
      ["a.", "a"],
      ["a.", "a"],
      ["P1.", "P1"],
      ["P1.", "P1"],
      ["T.", "T"],
    ]);
  });
}
