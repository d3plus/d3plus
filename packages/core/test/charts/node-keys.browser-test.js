import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    Moving a focused node from the keyboard, in Chromium on SVG and Canvas:
    Shift and an arrow key nudge a Network node 10px any way (pinning it) or
    a Sankey node 10px up or down (pushing its column aside),
    Shift+Backspace puts it back, each change is announced in keyboard
    navigation's live region, and plain arrows still move the focus.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const ring = (() => {
  const nodes = [];
  const links = [];
  for (let i = 0; i < 8; i++) {
    nodes.push({id: `n${i}`});
    links.push({source: `n${i}`, target: `n${(i + 1) % 8}`});
  }
  return {nodes, links};
})();

const sankey = {
  links: [
    {source: "s1", target: "m1", value: 1},
    {source: "s1", target: "m2", value: 1},
    {source: "s2", target: "m3", value: 1},
    {source: "s3", target: "m4", value: 1},
    {source: "s3", target: "m5", value: 1},
  ],
  nodePadding: 40,
  value: "value",
};

/** Runs in the page: starts drawing a chart. */
const start = ([chart, json, renderer]) => {
  window.__drawn = false;
  window.__viz = new window.d3plus[chart]()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .config(JSON.parse(json))
    .render(() => (window.__drawn = true));
  return true;
};

async function draw(page, chart, config, renderer) {
  await page.evaluate(start, [chart, JSON.stringify(config), renderer]);
  for (let i = 0; i < 100 && !(await page.evaluate(() => window.__drawn)); i++)
    await page.waitForTimeout(16);
}

/** Runs in the page: focuses the chart, then the mark keyed `key`. */
const focus = key => {
  const host = document.querySelector("#viz .d3plus-keyboard-nav");
  host.focus();
  window.__viz._keyboardNav.current = key;
  return true;
};

/** Runs in the page: presses `key` on the focused chart. */
const press = ([key, shiftKey]) => {
  const host = document.querySelector("#viz .d3plus-keyboard-nav");
  host.dispatchEvent(
    new KeyboardEvent("keydown", {key, shiftKey, bubbles: true}),
  );
  return true;
};

/** Runs in the page: the focused mark, the live region, and where `id` is. */
const read = id => {
  const viz = window.__viz;
  const network = viz.ctx.networkLive;
  const at = network
    ? network.positions.get(id)
    : (() => {
        const state = viz.ctx.sankeyDrag;
        const laid = state.laid.get(id);
        const share = state.offsets.get(id) ?? 0;
        return {x: 0, y: laid.y0 + share * (laid.bottom - laid.top)};
      })();
  return {
    current: viz._keyboardNav.current,
    live: viz._keyboardNav.live.textContent,
    at: [at.x, at.y],
    pinned: network ? [...network.pinned.keys()] : [],
    shortcuts: document
      .querySelector("#viz .d3plus-keyboard-nav")
      .getAttribute("aria-keyshortcuts"),
  };
};

const settle = page => page.waitForTimeout(80);

for (const renderer of ["svg", "canvas"]) {
  it(`Shift and the arrow keys nudge a focused Network node, and Shift+Backspace unpins it (${renderer})`, () =>
    withPage(box, async page => {
      await draw(page, "Network", {...ring, forceLive: false}, renderer);
      await page.evaluate(focus, "network-Circle-n2");
      const before = await page.evaluate(read, "n2");
      assert.ok(before.shortcuts.includes("Shift+ArrowLeft"));
      await page.evaluate(press, ["ArrowRight", true]);
      await page.evaluate(press, ["ArrowUp", true]);
      await settle(page);
      const moved = await page.evaluate(read, "n2");
      assert.deepStrictEqual(moved.at, [before.at[0] + 10, before.at[1] - 10]);
      assert.deepStrictEqual(moved.pinned, ["n2"]);
      assert.strictEqual(moved.current, "network-Circle-n2", "still focused");
      assert.strictEqual(moved.live, "n2 moved and pinned");
      await page.evaluate(press, ["Backspace", true]);
      await settle(page);
      const back = await page.evaluate(read, "n2");
      assert.deepStrictEqual(back.pinned, []);
      assert.deepStrictEqual(back.at, before.at, "back in its place");
      assert.strictEqual(back.live, "n2 unpinned");
      // A plain arrow moves the focus, not the node.
      await page.evaluate(press, ["ArrowRight", false]);
      await settle(page);
      const nav = await page.evaluate(read, "n2");
      assert.notStrictEqual(nav.current, "network-Circle-n2");
      assert.deepStrictEqual(nav.at, before.at);
    }));

  it(`Shift and up or down nudge a focused Sankey node, pushing its column, and Shift+Backspace moves it back (${renderer})`, () =>
    withPage(box, async page => {
      await draw(page, "Sankey", sankey, renderer);
      await page.evaluate(focus, "sankey-Rect-s2");
      const before = await page.evaluate(read, "s2");
      assert.ok(!before.shortcuts.includes("Shift+ArrowLeft"));
      await page.evaluate(press, ["ArrowDown", true]);
      await page.evaluate(press, ["ArrowDown", true]);
      await settle(page);
      const moved = await page.evaluate(read, "s2");
      assert.ok(Math.abs(moved.at[1] - before.at[1] - 20) < 1e-6);
      assert.strictEqual(moved.live, "s2 moved");
      const drawn = await page.evaluate(() => {
        const walk = n =>
          n.key === "sankey-Rect-s2"
            ? n.y
            : (n.children || []).map(walk).find(v => v !== undefined);
        return walk(window.__viz._paintedScene.root);
      });
      assert.ok(Math.abs(drawn - moved.at[1]) < 1e-6, "painted there");
      // Left and right don't move it.
      await page.evaluate(focus, "sankey-Rect-s2");
      await page.evaluate(press, ["ArrowLeft", true]);
      await settle(page);
      assert.deepStrictEqual((await page.evaluate(read, "s2")).at, moved.at);
      await page.evaluate(focus, "sankey-Rect-s2");
      await page.evaluate(press, ["Backspace", true]);
      await settle(page);
      const back = await page.evaluate(read, "s2");
      assert.ok(Math.abs(back.at[1] - before.at[1]) < 1e-6);
      assert.strictEqual(back.live, "s2 moved back");
    }));
}

it("a live Network reacts to a nudged node", () =>
  withPage(box, async page => {
    await draw(page, "Network", ring, "svg");
    // Let the first settle finish.
    for (
      let i = 0;
      i < 200 &&
      (await page.evaluate(() => !!window.__viz.ctx.networkLive.frame));
      i++
    )
      await page.waitForTimeout(50);
    await page.evaluate(focus, "network-Circle-n0");
    await page.evaluate(press, ["ArrowDown", true]);
    const heated = await page.evaluate(() => {
      const state = window.__viz.ctx.networkLive;
      return {frame: !!state.frame, alpha: state.sim.alpha()};
    });
    assert.ok(heated.frame && heated.alpha >= 0.3, JSON.stringify(heated));
  }));

it("nodeDrag: false leaves Shift and the arrow keys to navigation", () =>
  withPage(box, async page => {
    await draw(
      page,
      "Network",
      {...ring, forceLive: false, nodeDrag: false},
      "svg",
    );
    await page.evaluate(focus, "network-Circle-n2");
    const before = await page.evaluate(read, "n2");
    assert.ok(!before.shortcuts);
    await page.evaluate(press, ["ArrowRight", true]);
    await settle(page);
    const after = await page.evaluate(read, "n2");
    assert.deepStrictEqual(after.at, before.at);
    assert.deepStrictEqual(after.pinned, []);
  }));
