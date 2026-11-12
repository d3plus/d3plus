import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Pack's circles, on SVG and Canvas, are keyed by their path of keys and
    group circles are named after their own group: every scene key is unique
    (the same id under two parents included), a redraw that reorders the
    circles pairs each with itself, and a group's accessible name (the SVG
    `aria-label`, and what keyboard navigation announces, the only name Canvas
    exposes) is the group's name and value. Circles were keyed by their
    parent's key and their position in the layout, and groups were named
    "undefined".
*/

const rows = [
  {top: "T1", parent: "P1", id: "A", value: 3},
  {top: "T1", parent: "P1", id: "B", value: 4},
  {top: "T1", parent: "P2", id: "C", value: 5},
  {top: "T1", parent: "P2", id: "D", value: 6},
  {top: "T2", parent: "P3", id: "E", value: 7},
  {top: "T2", parent: "P3", id: "F", value: 5},
  {top: "T2", parent: "P4", id: "G", value: 2},
  {top: "T2", parent: "P4", id: "H", value: 1},
];

// Runs in the page: draws the Pack, then reads each circle's key and name off
// the scene and the SVG, and what keyboard navigation announces as the
// arrow keys move over the chart.
const draw = async ([renderer, data, groupBy]) => {
  const viz = new window.d3plus.Pack()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .width(600)
    .height(400)
    .groupBy(groupBy)
    .sum("value")
    .data(data);
  await new Promise(r => viz.render(r));
  const walk = (nodes, out = []) => {
    for (const n of nodes || []) {
      if (n.type === "group") walk(n.children, out);
      else out.push(n);
    }
    return out;
  };
  const scene = walk(viz._chartScene)
    .filter(n => n.type === "circle")
    .map(n => ({key: n.key, label: n.aria.label}));
  const svg = [...document.querySelectorAll("#viz circle[data-key^='pack-']")]
    .filter(c => c.hasAttribute("aria-label"))
    .map(c => ({
      key: c.getAttribute("data-key"),
      label: c.getAttribute("aria-label"),
    }));

  const host = document.querySelector("#viz .d3plus-keyboard-nav");
  const live = host.querySelector("[aria-live]");
  const wait = () =>
    new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
  const announced = new Set();
  host.focus();
  await wait();
  announced.add(live.textContent);
  for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
    for (let k = 0; k < 6; k++) {
      host.dispatchEvent(new KeyboardEvent("keydown", {key, bubbles: true}));
      await wait();
      announced.add(live.textContent);
    }
  }
  return {scene, svg, announced: [...announced]};
};

// Runs in the page: draws the Pack, then redraws it with `next`, and reads
// every scene key and each circle's name (and, on SVG, its element) after
// each draw.
const redraw = async ([renderer, data, next, groupBy, depth]) => {
  const viz = new window.d3plus.Pack()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .width(600)
    .height(400)
    .groupBy(groupBy)
    .depth(depth)
    .sum("value")
    .data(data);
  const elements = new Map();
  const read = () => {
    const walk = (nodes, out = []) => {
      for (const n of nodes || []) {
        out.push(n);
        if (n.type === "group") walk(n.children, out);
      }
      return out;
    };
    const nodes = walk(viz._chartScene);
    const circles = {};
    for (const n of nodes)
      if (n.type === "circle") circles[n.key] = n.aria.label.split(",")[0];
    const same = [];
    for (const el of document.querySelectorAll(
      "#viz circle[data-key^='pack-']",
    )) {
      const key = el.getAttribute("data-key");
      if (elements.get(key) === el) same.push(key);
      elements.set(key, el);
    }
    return {keys: nodes.map(n => String(n.key)), circles, same};
  };
  await new Promise(r => viz.render(r));
  const before = read();
  await new Promise(r => viz.data(next).render(r));
  return {before, after: read()};
};

const html = '<div id="viz" style="width:600px;height:400px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] keys and names each group circle after its group`, async () => {
    const {scene, svg} = await render(html, draw, [
      renderer,
      rows,
      ["top", "parent", "id"],
    ]);
    const keys = scene.map(d => d.key);
    assert.strictEqual(new Set(keys).size, keys.length, keys.join(", "));
    const groups = scene.filter(d => d.key.startsWith("pack-group-"));
    assert.deepStrictEqual(groups.map(d => `${d.key} | ${d.label}`).sort(), [
      "pack-group-T1 | T1, 18.",
      "pack-group-T1/P1 | P1, 7.",
      "pack-group-T1/P2 | P2, 11.",
      "pack-group-T2 | T2, 15.",
      "pack-group-T2/P3 | P3, 12.",
      "pack-group-T2/P4 | P4, 3.",
    ]);
    assert.strictEqual(
      scene.find(d => d.key === "pack-root-0").label,
      "Total, 33.",
    );
    assert.ok(
      scene.every(d => !/undefined/.test(`${d.key} ${d.label}`)),
      JSON.stringify(scene),
    );
    if (renderer === "svg") assert.deepStrictEqual(svg, scene);
    else assert.deepStrictEqual(svg, []);
  });

  it(`[${renderer}] keyboard navigation announces a group circle by its group`, async () => {
    const {announced} = await render(html, draw, [
      renderer,
      rows.slice(0, 6),
      ["parent", "id"],
    ]);
    assert.ok(announced.includes("Total, 30."), announced.join(" / "));
    assert.ok(
      announced.some(t => /^P[123], \d+\.$/.test(t)),
      announced.join(" / "),
    );
    assert.ok(
      announced.every(t => !/undefined/.test(t)),
      announced.join(" / "),
    );
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] keys leaves by path, apart under two parents and kept across a reordering redraw`, async () => {
    const twoParents = rows.map(d =>
      d.parent === "P4" ? {...d, parent: "P1"} : d,
    );
    const reordered = twoParents.map(d =>
      d.top === "T2" ? {...d, value: d.value * 10} : d,
    );
    const {before, after} = await render(html, redraw, [
      renderer,
      twoParents,
      reordered,
      ["top", "parent", "id"],
      1,
    ]);
    for (const {keys} of [before, after])
      assert.strictEqual(new Set(keys).size, keys.length, keys.join(", "));
    assert.deepStrictEqual(before.circles, {
      "pack-root-0": "Total",
      "pack-group-T1": "T1",
      "pack-group-T2": "T2",
      "pack-leaf-T1/P1": "P1",
      "pack-leaf-T1/P2": "P2",
      "pack-leaf-T2/P1": "P1",
      "pack-leaf-T2/P3": "P3",
    });
    // T2 and its circles move ahead of T1's, and each keeps its key.
    assert.notDeepStrictEqual(
      Object.keys(after.circles),
      Object.keys(before.circles),
    );
    assert.deepStrictEqual(
      Object.fromEntries(Object.entries(after.circles).sort()),
      Object.fromEntries(Object.entries(before.circles).sort()),
    );
    // SVG redraws each circle in its own element.
    if (renderer === "svg")
      assert.deepStrictEqual(
        after.same.sort(),
        Object.keys(before.circles).sort(),
      );
  });
}
