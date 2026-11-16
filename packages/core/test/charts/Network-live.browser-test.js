import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    Network's live force layout and node dragging, in Chromium on SVG and
    Canvas with a real mouse and a fake clock: a small network keeps
    simulating after it paints until it cools (and stops on teardown or a
    redraw), a dragged node stays where it is dropped while the rest react,
    and a double-click lets it go.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

/** A small ring with a few spokes: no node placed by the data. */
const ring = (() => {
  const nodes = [];
  const links = [];
  for (let i = 0; i < 12; i++) {
    nodes.push({id: `n${i}`});
    links.push({source: `n${i}`, target: `n${(i + 1) % 12}`});
    if (i % 3 === 0) links.push({source: `n${i}`, target: `n${(i + 6) % 12}`});
  }
  return {nodes, links};
})();

/** Runs in the page: starts drawing a Network from JSON config. */
const start = ([json, renderer]) => {
  window.__drawn = false;
  window.__viz = new window.d3plus.Network()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .config(JSON.parse(json))
    .render(() => (window.__drawn = true));
  return true;
};

/** Steps the fake clock (or waits) until the chart has painted. */
async function painted(page) {
  for (let i = 0; i < 50 && !(await page.evaluate(() => window.__drawn)); i++)
    await (page.clock ? page.clock.runFor(16) : page.waitForTimeout(16));
  assert.ok(await page.evaluate(() => window.__drawn), "drawn");
}

/** Draws a Network from `config` on `renderer`. */
async function draw(page, config, renderer) {
  await page.evaluate(start, [JSON.stringify(config), renderer]);
  await painted(page);
}

/** Runs in the page: the live state, and where each node is on screen. */
const live = () => {
  const viz = window.__viz;
  const state = viz.ctx.networkLive;
  const surface =
    document.querySelector("#viz canvas") || document.querySelector("#viz svg");
  const rect = surface.getBoundingClientRect();
  const z = viz._zoomTransform || {x: 0, y: 0, scale: 1};
  const t = viz._chartTransform || {x: 0, y: 0};
  const screen = {};
  const at = {};
  for (const [id, p] of state.positions) {
    at[id] = [p.x, p.y];
    screen[id] = [
      rect.left + z.x + z.scale * (t.x + p.x),
      rect.top + z.y + z.scale * (t.y + p.y),
    ];
  }
  return {
    at,
    screen,
    pinned: [...state.pinned.keys()],
    frame: state.frame ?? null,
    hot: state.sim ? state.sim.alpha() >= state.sim.alphaMin() : null,
    focus: viz._focus ?? null,
    zoom: viz._zoomTransform ?? null,
  };
};

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

for (const renderer of ["svg", "canvas"]) {
  it(`a small network settles in view after it paints, then stops (${renderer})`, () =>
    withPage(
      box,
      async page => {
        await draw(page, ring, renderer);
        const first = await page.evaluate(live);
        assert.ok(first.frame !== null && first.hot, "simulating");
        await page.clock.runFor(400);
        const moving = await page.evaluate(live);
        assert.ok(
          Object.keys(first.at).some(
            id => dist(first.at[id], moving.at[id]) > 1,
          ),
          "nodes move",
        );
        await page.clock.runFor(15000);
        const cooled = await page.evaluate(live);
        assert.strictEqual(cooled.frame, null, "no frame left");
        assert.strictEqual(cooled.hot, false);
        await page.clock.runFor(1000);
        assert.deepStrictEqual((await page.evaluate(live)).at, cooled.at);
        // Every node stays inside the chart area.
        const inside = await page.evaluate(() => {
          const {width, height} = window.__viz.ctx.networkLive.bounds;
          return [...window.__viz.ctx.networkLive.positions.values()].every(
            p => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height,
          );
        });
        assert.ok(inside);
      },
      {clock: true},
    ));
}

it("teardown and redraw stop the live loop", () =>
  withPage(
    box,
    async page => {
      await draw(page, ring, "svg");
      await page.evaluate(() => {
        window.__before = window.__viz.ctx.networkLive.sim;
        window.__drawn = false;
        window.__viz.render(() => (window.__drawn = true));
      });
      await painted(page);
      const sims = await page.evaluate(() => ({
        replaced: window.__viz.ctx.networkLive.sim !== window.__before,
        frame: window.__viz.ctx.networkLive.frame !== undefined,
      }));
      assert.deepStrictEqual(sims, {replaced: true, frame: true});
      await page.clock.runFor(200);
      const after = await page.evaluate(() => {
        const viz = window.__viz;
        viz.destroy();
        return {
          frame: viz.ctx.networkLive.frame ?? null,
          sim: viz.ctx.networkLive.sim ?? null,
        };
      });
      assert.deepStrictEqual(after, {frame: null, sim: null});
      await page.clock.runFor(2000);
    },
    {clock: true},
  ));

it("reduced motion, forceLive: false, or a network over forceLive lay out before they paint", () =>
  withPage(
    box,
    async page => {
      for (const extra of [
        {reducedMotion: true},
        {forceLive: false},
        {forceLive: 5},
      ]) {
        await draw(page, {...ring, ...extra}, "svg");
        const state = await page.evaluate(live);
        assert.strictEqual(state.hot, null, JSON.stringify(extra));
        assert.strictEqual(state.frame, null);
      }
    },
    {},
  ));

it("nodes the data places stay put while the rest settle around them", () =>
  withPage(
    box,
    async page => {
      const nodes = ring.nodes.map((n, i) =>
        i < 3 ? {...n, x: i * 10, y: (i % 2) * 10} : n,
      );
      await draw(page, {nodes, links: ring.links}, "svg");
      const first = await page.evaluate(live);
      await page.clock.runFor(15000);
      const last = await page.evaluate(live);
      for (const id of ["n0", "n1", "n2"])
        assert.deepStrictEqual(last.at[id], first.at[id], id);
      assert.ok(first.at.n0[0] < first.at.n1[0], "data order kept");
    },
    {clock: true},
  ));

/** Drags `id` by `[dx, dy]` with the real mouse, a frame per step. */
async function dragNode(page, id, [dx, dy]) {
  const {screen} = await page.evaluate(live);
  const [x, y] = screen[id];
  await page.mouse.move(x, y);
  await page.mouse.down();
  const step = () =>
    page.clock ? page.clock.runFor(20) : page.waitForTimeout(20);
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(x + (dx * i) / 8, y + (dy * i) / 8);
    await step();
  }
  await page.mouse.up();
  await step();
}

for (const renderer of ["svg", "canvas"]) {
  it(`a dragged node stays where it is dropped, the rest react, and a double-click lets it go (${renderer})`, () =>
    withPage(
      box,
      async page => {
        await draw(page, ring, renderer);
        await page.clock.runFor(15000);
        const before = await page.evaluate(live);
        await dragNode(page, "n0", [-60, -40]);
        const dropped = await page.evaluate(live);
        assert.deepStrictEqual(dropped.pinned, ["n0"]);
        assert.ok(
          dist(dropped.at.n0, [before.at.n0[0] - 60, before.at.n0[1] - 40]) < 1,
          `dropped under the pointer: ${dropped.at.n0} vs ${before.at.n0}`,
        );
        assert.strictEqual(dropped.focus, null, "the drag didn't click");
        assert.strictEqual(dropped.zoom, null, "nor pan");
        await page.clock.runFor(15000);
        const settled = await page.evaluate(live);
        assert.deepStrictEqual(settled.at.n0, dropped.at.n0, "still pinned");
        assert.ok(dist(settled.at.n1, before.at.n1) > 1, "its neighbor moved");
        // The scene draws the node where it was dropped.
        const drawn = await page.evaluate(() => {
          const walk = n =>
            n.key === "network-Circle-n0"
              ? [n.cx, n.cy]
              : (n.children || []).map(walk).find(Boolean);
          return walk(window.__viz._paintedScene.root);
        });
        assert.ok(dist(drawn, settled.at.n0) < 1e-6);

        const [x, y] = settled.screen.n0;
        await page.mouse.click(x, y, {clickCount: 2});
        await page.clock.runFor(1000);
        const loose = await page.evaluate(live);
        assert.deepStrictEqual(loose.pinned, [], "let go");
        assert.strictEqual(loose.focus, null, "a double-click doesn't focus");
        await page.clock.runFor(15000);
        const free = await page.evaluate(live);
        assert.ok(dist(free.at.n0, settled.at.n0) > 1, "and it moves again");
      },
      {clock: true},
    ));
}

it("without the live simulation, a drag moves only the node", () =>
  withPage(
    box,
    async page => {
      await draw(page, {...ring, forceLive: false}, "canvas");
      const before = await page.evaluate(live);
      await dragNode(page, "n3", [50, 30]);
      const after = await page.evaluate(live);
      assert.deepStrictEqual(after.pinned, ["n3"]);
      assert.ok(
        dist(after.at.n3, [before.at.n3[0] + 50, before.at.n3[1] + 30]) < 1,
      );
      for (const id of Object.keys(before.at))
        if (id !== "n3")
          assert.deepStrictEqual(after.at[id], before.at[id], id);
    },
    {},
  ));

it("nodeDrag: false leaves the nodes where they are", () =>
  withPage(
    box,
    async page => {
      await draw(page, {...ring, forceLive: false, nodeDrag: false}, "svg");
      const before = await page.evaluate(live);
      await dragNode(page, "n3", [50, 30]);
      const after = await page.evaluate(live);
      assert.deepStrictEqual(after.pinned, []);
      assert.deepStrictEqual(after.at, before.at);
    },
    {},
  ));
