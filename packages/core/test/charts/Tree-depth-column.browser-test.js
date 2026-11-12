import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Tree records each node's hierarchy depth on the node's row under a key of
    its own, so a data field named `depth` reaches every accessor and handler
    with the data's values, can be grouped by, and the rows passed to `data()`
    are never written to.
*/

const body = `
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Opens a page with the helpers the tests drive a Tree through. */
async function open() {
  const opened = await openPage(body);
  await opened.page.evaluate(() => {
    // Draws a Tree over frozen copies of `rows`, in place of the last one.
    window.make = ([rows, config, renderer]) =>
      new Promise(resolve => {
        if (window.__viz) window.__viz.destroy();
        window.__rows = rows.map(d => Object.freeze({...d}));
        window.__seen = {fill: [], click: []};
        const viz = new window.d3plus.Tree()
          .config({
            data: window.__rows,
            duration: 0,
            legend: false,
            ...JSON.parse(JSON.stringify(config)),
          })
          .shapeConfig({
            fill: d => (window.__seen.fill.push(d.depth), "#444"),
          })
          .tooltipConfig({tbody: [["Depth", d => d.depth]]})
          .on("click.shape", d => window.__seen.click.push(d.depth))
          .renderer(renderer)
          .select("#viz");
        window.__viz = viz;
        viz.render(() => resolve(null));
      });
    // Every node of the chart's scene, flattened.
    window.sceneNodes = () => {
      const out = [];
      const walk = nodes =>
        nodes.forEach(n => {
          out.push(n);
          if (n.children) walk(n.children);
        });
      walk(window.__viz._chartScene);
      return out;
    };
    window.circleKeys = () =>
      window
        .sceneNodes()
        .filter(n => n.type === "circle")
        .map(n => n.key);
    window.labels = () =>
      window
        .sceneNodes()
        .filter(n => n.type === "text")
        .map(n => n.lines.map(l => l.text).join(" "));
    // Client coordinates of the center of the circle keyed `key`.
    window.shapePoint = key => {
      const node = window.sceneNodes().find(n => n.key === key);
      const surface = document
        .querySelector("#viz svg, #viz canvas")
        .getBoundingClientRect();
      const c = window.__viz._chartTransform || {x: 0, y: 0};
      return [surface.left + c.x + node.cx, surface.top + c.y + node.cy];
    };
    // The title and body cells of each tooltip showing.
    window.shown = () =>
      [...document.querySelectorAll(".d3plus-tooltip")]
        .filter(t => getComputedStyle(t).visibility === "visible")
        .map(t => [
          t.querySelector(".d3plus-tooltip-title").textContent.trim(),
          ...[...t.querySelectorAll(".d3plus-tooltip-tbody td")].map(td =>
            td.textContent.trim(),
          ),
        ]);
  });
  return opened;
}

const draw = (page, rows, config, renderer) =>
  page.evaluate(args => window.make(args), [rows, config, renderer]);

const shapePoint = (page, key) =>
  page.evaluate(key => window.shapePoint(key), key);

/** Moves the real pointer onto the circle keyed `key` and returns the tooltips showing. */
async function hover(page, key) {
  const point = await shapePoint(page, key);
  await page.mouse.move(5, 395);
  await page.waitForTimeout(40);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
  return page.evaluate(() => window.shown());
}

const rowsNow = page => page.evaluate(() => window.__rows.map(d => ({...d})));

for (const renderer of ["svg", "canvas"]) {
  it(`Tree depth column (${renderer}): accessors and handlers read the data's own depth`, async () => {
    const rows = [
      {parent: "P1", id: "a", depth: 100},
      {parent: "P1", id: "b", depth: 200},
      {parent: "P2", id: "c", depth: 300},
    ];
    const {page, errors, close} = await open();
    try {
      await draw(page, rows, {groupBy: ["parent", "id"]}, renderer);
      assert.deepStrictEqual(
        await page.evaluate(() =>
          [...new Set(window.__seen.fill)].sort((a, b) => a - b),
        ),
        [100, 200, 300],
        "a shapeConfig accessor",
      );
      assert.deepStrictEqual(
        await hover(page, "tree-Circle-P1"),
        [["P1", "Depth", "300"]],
        "a branch's tooltip: titled at its own level, with its leaves' sum",
      );
      assert.deepStrictEqual(
        await hover(page, "tree-Circle-a"),
        [["a", "Depth", "100"]],
        "a leaf's tooltip",
      );
      const b = await shapePoint(page, "tree-Circle-b");
      await page.mouse.click(b[0], b[1]);
      await page.waitForTimeout(60);
      assert.deepStrictEqual(
        await page.evaluate(() => window.__seen.click),
        [200],
        "a click handler",
      );
      assert.deepStrictEqual(
        await rowsNow(page),
        rows,
        "the rows are as passed",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Tree depth column (${renderer}): a groupBy on a field named depth draws each group`, async () => {
    const rows = [
      {depth: "shallow", id: "a", value: 1},
      {depth: "shallow", id: "b", value: 2},
      {depth: "deep", id: "c", value: 3},
    ];
    const {page, errors, close} = await open();
    try {
      await draw(page, rows, {groupBy: ["depth", "id"]}, renderer);
      assert.deepStrictEqual(
        (await page.evaluate(() => window.circleKeys())).sort(),
        [
          "tree-Circle-a",
          "tree-Circle-b",
          "tree-Circle-c",
          "tree-Circle-deep",
          "tree-Circle-shallow",
        ],
        "scene keys",
      );
      assert.deepStrictEqual(
        (await page.evaluate(() => window.labels())).sort(),
        ["a", "b", "c", "deep", "shallow"],
        "labels",
      );
      assert.deepStrictEqual(
        [
          await hover(page, "tree-Circle-shallow"),
          await hover(page, "tree-Circle-deep"),
          await hover(page, "tree-Circle-c"),
        ],
        [
          [["shallow", "Depth", "shallow"]],
          [["deep", "Depth", "deep"]],
          [["c", "Depth", "deep"]],
        ],
        "tooltips",
      );
      assert.deepStrictEqual(
        await rowsNow(page),
        rows,
        "the rows are as passed",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Tree depth column (${renderer}): rows without the field read the hierarchy depth, and stay as passed`, async () => {
    const rows = [
      {parent: "P1", id: "a", value: 1},
      {parent: "P1", id: "b", value: 2},
      {parent: "P2", id: "c", value: 3},
    ];
    const {page, errors, close} = await open();
    try {
      await draw(page, rows, {groupBy: ["parent", "id"]}, renderer);
      assert.deepStrictEqual(
        [
          await hover(page, "tree-Circle-P2"),
          await hover(page, "tree-Circle-c"),
        ],
        [[["P2", "Depth", "1"]], [["c", "Depth", "2"]]],
        "tooltips",
      );
      assert.deepStrictEqual(await rowsNow(page), rows, "merged rows");

      // The Line shape keeps the rows unmerged, and this depth has each leaf
      // node wrap one; the legend holds the same rows.
      await draw(
        page,
        rows,
        {groupBy: ["parent", "id"], shape: "Line", depth: 0, legend: true},
        renderer,
      );
      assert.deepStrictEqual(
        await page.evaluate(() => window.labels().length > 0),
        true,
        "the chart drew",
      );
      assert.deepStrictEqual(await rowsNow(page), rows, "unmerged rows");
      assert.deepStrictEqual(
        await page.evaluate(() => {
          const legend = window.__viz._legendData;
          return [
            legend.length > 0,
            legend.flatMap(d => Object.keys(d)).filter(k => /depth/i.test(k)),
          ];
        }),
        [true, []],
        "the legend's rows carry no depth",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
