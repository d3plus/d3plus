import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Tooltips and hover during zoom gestures, in Chromium on SVG and Canvas
    with a real mouse: once a drag turns a Geomap globe, pans a flat map, or
    pans a Network, the tooltip hides and nothing stays hovered; the next
    move after the drag brings both back for the mark under the pointer. A
    ctrl + wheel zoom hides them the same way, and a plain click leaves the
    tooltip and click focus as they are without a drag.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const cities = [
  {id: "NYC", name: "New York", point: [-74, 40.7]},
  {id: "PAR", name: "Paris", point: [2.35, 48.9]},
];
const globe = {
  data: cities,
  links: [{source: "NYC", target: "PAR"}],
  legend: false,
  tiles: false,
  projection: "geoOrthographic",
  projectionRotate: [74, -40.7],
};
const network = {
  nodes: [
    {id: "A", name: "Alpha", x: 0, y: 0},
    {id: "B", name: "Bravo", x: 200, y: 0},
    {id: "C", name: "Charlie", x: 0, y: 120},
    {id: "D", name: "Delta", x: 200, y: 120},
  ],
  links: [
    {source: "A", target: "B"},
    {source: "A", target: "C"},
    {source: "C", target: "D"},
  ],
  legend: false,
};

/** Runs in the page: draws `chart` from JSON config, resolving once painted. */
const draw = ([chart, json, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config(JSON.parse(json))
      .label(d => d.name);
    if (chart === "Geomap") viz.point(d => d.point);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/**
    Runs in the page: the visible tooltips' text, whether anything is
    hovered, the focus, and the on-screen center of the circle drawn for `id`.
*/
const state = id => {
  const viz = window.__viz;
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const hovering = typeof viz._hover === "function";
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let at = null;
  const walk = (n, x, y, k) => {
    const t = n.transform || {};
    const nx = x + k * (t.x || 0),
      ny = y + k * (t.y || 0),
      nk = k * (t.scale ?? 1);
    const d = n.datum && (n.datum.data || n.datum);
    if (!at && n.type === "circle" && d && d.id === id)
      at = [
        rect.left + nx + nk * (n.cx || 0),
        rect.top + ny + nk * (n.cy || 0),
      ];
    (n.children || []).forEach(c => walk(c, nx, ny, nk));
  };
  walk(viz._paintedScene.root, 0, 0, 1);
  return {tips, hovering, focus: viz._focus ?? null, at};
};

/** Hovers `id`'s circle, asserting its tooltip shows. */
async function hover(page, id, name) {
  const {at} = await page.evaluate(state, id);
  assert.ok(at, `${id} is drawn`);
  await page.mouse.move(at[0] - 1, at[1]);
  await page.mouse.move(...at, {steps: 2});
  await page.waitForTimeout(60);
  const s = await page.evaluate(state, id);
  assert.ok(
    s.tips.some(t => t.includes(name)),
    `hovering shows ${name}'s tooltip (got ${JSON.stringify(s.tips)})`,
  );
  return at;
}

/** Presses at `from` and moves by `[dx, dy]` without letting go. */
async function press(page, from, [dx, dy]) {
  await page.mouse.down();
  await page.mouse.move(from[0] + dx, from[1] + dy, {steps: 10});
  await page.waitForTimeout(60);
}

/** Asserts no tooltip shows and nothing is hovered. */
async function assertQuiet(page, id, why) {
  const s = await page.evaluate(state, id);
  assert.deepStrictEqual(s.tips, [], `${why}: no tooltip`);
  assert.strictEqual(s.hovering, false, `${why}: nothing hovered`);
}

/** Lets go, then moves once over the mark (wherever it now is). */
async function release(page, id, name) {
  await page.mouse.up();
  await page.waitForTimeout(60);
  await assertQuiet(page, id, "just after the drag");
  const {at} = await page.evaluate(state, id);
  assert.ok(at, `${id} is still drawn`);
  await page.mouse.move(...at, {steps: 2});
  await page.waitForTimeout(60);
  const s = await page.evaluate(state, id);
  assert.ok(
    s.tips.some(t => t.includes(name)),
    `the next move shows ${name}'s tooltip again (got ${JSON.stringify(s.tips)})`,
  );
  return s;
}

/** Runs in the page: a ctrl + wheel zoom at `at`. */
const wheel = at =>
  new Promise(resolve => {
    const el = document.elementFromPoint(...at);
    el.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientX: at[0],
        clientY: at[1],
        ctrlKey: true,
        deltaY: -20,
      }),
    );
    setTimeout(resolve, 40);
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: dragging a globe hides the tooltip until the next move`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["Geomap", JSON.stringify(globe), renderer]);
      const at = await hover(page, "NYC", "New York");
      await press(page, at, [-30, -10]);
      await assertQuiet(page, "NYC", "mid-drag");
      await page.mouse.move(at[0] - 60, at[1], {steps: 6});
      await assertQuiet(page, "NYC", "still mid-drag");
      await release(page, "NYC", "New York");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: panning a flat map hides the tooltip until the next move`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const flat = {...globe, projection: "geoMercator"};
      delete flat.projectionRotate;
      await page.evaluate(draw, ["Geomap", JSON.stringify(flat), renderer]);
      // Zoom in on New York so there is room to pan.
      const {at: nyc} = await page.evaluate(state, "NYC");
      await page.evaluate(
        at =>
          new Promise(resolve => {
            const host = document.querySelector("#viz svg, #viz canvas");
            const rect = host.getBoundingClientRect();
            const [x, y] = [at[0] - rect.left, at[1] - rect.top];
            window.__viz._zoomToBounds(
              [
                [x - 80, y - 60],
                [x + 80, y + 60],
              ],
              0,
            );
            setTimeout(resolve, 100);
          }),
        nyc,
      );
      const at = await hover(page, "NYC", "New York");
      await press(page, at, [40, 20]);
      await assertQuiet(page, "NYC", "mid-pan");
      await release(page, "NYC", "New York");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a plain click on a globe keeps the tooltip`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["Geomap", JSON.stringify(globe), renderer]);
      await hover(page, "NYC", "New York");
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(100);
      const s = await page.evaluate(state, "NYC");
      assert.ok(
        s.tips.some(t => t.includes("New York")),
        `the tooltip stays up (got ${JSON.stringify(s.tips)})`,
      );
      assert.ok(s.hovering, "New York stays hovered");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Network ${renderer}: panning hides the tooltip and hover until the next move`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["Network", JSON.stringify(network), renderer]);
      const at = await hover(page, "A", "Alpha");
      assert.ok(
        (await page.evaluate(state, "A")).hovering,
        "hovering highlights Alpha",
      );
      await press(page, at, [60, 30]);
      await assertQuiet(page, "A", "mid-pan");
      const after = await release(page, "A", "Alpha");
      assert.ok(after.hovering, "the next move hovers Alpha");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Network ${renderer}: a ctrl + wheel zoom hides the tooltip until the next move`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["Network", JSON.stringify(network), renderer]);
      const at = await hover(page, "A", "Alpha");
      await page.evaluate(wheel, at);
      await assertQuiet(page, "A", "mid-zoom");
      // The wheel gesture ends once the wheel idles.
      await page.waitForTimeout(250);
      const {at: moved} = await page.evaluate(state, "A");
      await page.mouse.move(...moved, {steps: 2});
      await page.waitForTimeout(60);
      const s = await page.evaluate(state, "A");
      assert.ok(
        s.tips.some(t => t.includes("Alpha")),
        `the next move shows Alpha's tooltip (got ${JSON.stringify(s.tips)})`,
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Network ${renderer}: a plain click still focuses the node`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["Network", JSON.stringify(network), renderer]);
      await hover(page, "A", "Alpha");
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(100);
      assert.strictEqual(
        (await page.evaluate(state, "A")).focus,
        "A",
        "the click focuses Alpha",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
