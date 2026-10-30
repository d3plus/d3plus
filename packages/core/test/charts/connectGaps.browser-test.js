/* global getComputedStyle */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {openPage} from "~test/browser/page.js";

/**
    `connectGaps` in a real browser, on both renderers: the default draws each
    line straight through a missing value, unchanged; `"dashed"` breaks the
    line there and bridges the gap with a dashed copy of its path between the
    points on either side; `false` leaves the gap empty. Bridges are
    decoration: no pointer, keyboard focus, or tooltip value of their own.
*/

/** Alpha has no value at x = 3 (a null row); Beta has every step. */
const rows = () => {
  const out = [];
  [1, 2, 3, 4, 5, 6].forEach(x => {
    out.push({id: "Alpha", x, y: x === 3 ? null : 10 + x * 3});
    out.push({id: "Beta", x, y: 50 + x});
  });
  return out;
};

/** Draws a LinePlot and summarizes its Alpha line, hit area, bridge, and band. */
const draw = ([renderer, config, data]) =>
  new Promise(resolve => {
    const el = document.createElement("div");
    el.id = "viz";
    el.style.cssText = "width:600px;height:400px";
    document.body.appendChild(el);
    const viz = new window.d3plus.LinePlot()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .shapeConfig({Line: {curve: "linear"}})
      .config(config)
      .renderer(renderer)
      .legend(false)
      .duration(0)
      .detectVisible(false)
      .select(el);
    window.__viz = viz;
    viz.render(() => {
      const flat = ns =>
        ns.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const find = key =>
        nodes.find(n => n.key === key && n.shapeType === "Line");
      const summary = node =>
        node && {
          subpaths: (node.d.match(/M/g) || []).length,
          d: node.d,
          dash: node.paint.strokeDasharray,
          stroke: node.paint.stroke,
          interactive: node.interactive,
          aria: node.aria,
          points: (node.interactionPoints || []).map(p => [p.x, p.y]),
        };
      const svgGap = document.querySelector('#viz [data-key="Alpha::gap"]');
      const targets = window.d3plus.focusTargets(
        viz._paintedScene.root.children,
      );
      resolve({
        line: summary(find("Alpha")),
        hit: summary(find("Alpha::hit")),
        bridge: summary(find("Alpha::gap")),
        beta: summary(find("Beta")),
        bridges: nodes.filter(n => /::gap$/.test(`${n.key}`)).length,
        bandGroups: nodes
          .filter(n => /::gaps$/.test(`${n.key}`))
          .map(n => ({key: n.key, clip: n.clip.d})),
        targets: targets.map(t => `${t.node.key}`),
        svgPointerEvents: svgGap ? svgGap.getAttribute("pointer-events") : null,
      });
    });
  });

const probe = (renderer, config, data = rows()) =>
  render("", draw, [renderer, config, data]);

/** The stretches a dash array draws, as [start, end] lengths. */
function drawn(dash) {
  const out = [];
  let at = 0;
  dash.forEach((v, k) => {
    if (!(k % 2) && v > 0) out.push([at, at + v]);
    at += v;
  });
  return out;
}

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const near = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 0.05, `${msg} (${a} vs ${b})`);

for (const renderer of ["svg", "canvas"]) {
  it(`connectGaps ${renderer}: the default draws each line straight through a gap, unchanged`, async () => {
    const plain = await probe(renderer, {});
    const solid = await probe(renderer, {connectGaps: true});
    assert.strictEqual(plain.bridges, 0, "no bridges");
    assert.deepStrictEqual(plain.bandGroups, [], "no band clips");
    assert.strictEqual(plain.line.subpaths, 1, "one continuous path");
    assert.strictEqual(plain.line.points.length, 5, "through every value");
    assert.strictEqual(plain.hit.d, plain.line.d, "hit area follows it");
    assert.deepStrictEqual(
      [plain.line.d, plain.line.dash],
      [solid.line.d, solid.line.dash],
      "true is the default",
    );
    const solidName = await probe(renderer, {connectGaps: "solid"});
    assert.deepStrictEqual(solidName.line, solid.line, '"solid" matches true');
    assert.strictEqual(solidName.bridges, 0);
  });

  it(`connectGaps ${renderer}: "dashed" bridges the gap between the points either side of it`, async () => {
    const r = await probe(renderer, {connectGaps: "dashed"});
    const [p1, p2, p4, p5, p6] = r.line.points;
    const before = dist(p1, p2);
    const gap = dist(p2, p4);
    const total = before + gap + dist(p4, p5) + dist(p5, p6);
    // The line stops at x = 2 and picks up again at x = 4.
    const line = drawn(r.line.dash);
    assert.strictEqual(line.length, 2, "two runs");
    near(line[0][0], 0, "first run starts the line");
    near(line[0][1], before, "first run ends at x = 2");
    near(line[1][0], before + gap, "second run starts at x = 4");
    near(line[1][1], total, "second run ends the line");
    // The bridge dashes only across the gap, in the line's color.
    assert.strictEqual(r.bridges, 1, "only Alpha is bridged");
    assert.strictEqual(
      r.bridge.d,
      r.line.d,
      "the bridge follows the line's path",
    );
    assert.strictEqual(r.bridge.stroke, r.line.stroke);
    const dashes = drawn(r.bridge.dash);
    assert.ok(dashes.length > 3, "a dashed bridge");
    near(dashes[0][0], before, "the bridge starts at x = 2");
    near(dashes[0][1] - dashes[0][0], 2, "with short dashes");
    assert.ok(
      dashes.every(([a, b]) => a >= before - 0.01 && b <= before + gap + 0.01),
      "every dash lies within the gap",
    );
    // Beta has no gap and is left as is.
    assert.strictEqual(r.beta.subpaths, 1);
    assert.deepStrictEqual(r.beta.dash, [0]);
  });

  it(`connectGaps ${renderer}: false leaves the gap empty, and the hit area stops at it`, async () => {
    const r = await probe(renderer, {connectGaps: false});
    assert.strictEqual(r.bridges, 0, "no bridge");
    assert.strictEqual(drawn(r.line.dash).length, 2, "the line breaks");
    assert.strictEqual(r.hit.subpaths, 2, "one hit subpath per run");
  });

  it(`connectGaps ${renderer}: bridges take no keyboard focus or pointer events`, async () => {
    const plain = await probe(renderer, {});
    const r = await probe(renderer, {connectGaps: "dashed"});
    assert.strictEqual(r.bridge.interactive, false);
    assert.deepStrictEqual(r.bridge.aria, {hidden: true});
    assert.deepStrictEqual(r.bridge.points, [], "no hover points");
    assert.ok(
      !r.targets.some(k => /::gap$/.test(k)),
      "no focus target on a bridge",
    );
    assert.strictEqual(
      r.targets.length,
      plain.targets.length,
      "the same focus targets as without bridges",
    );
    if (renderer === "svg") assert.strictEqual(r.svgPointerEvents, "none");
  });

  it(`connectGaps ${renderer}: confidence bands are clipped to the runs between gaps`, async () => {
    const data = rows().map(d => ({...d, lo: d.y - 2, hi: d.y + 2}));
    const r = await probe(
      renderer,
      {connectGaps: "dashed", confidence: ["lo", "hi"]},
      data,
    );
    assert.deepStrictEqual(
      r.bandGroups.map(g => g.key),
      ["Alpha::gaps"],
      "only Alpha's band is clipped",
    );
    const [, p2, p4] = r.line.points;
    const edges = r.bandGroups[0].clip
      .match(/H(-?[\d.]+)/g)
      .map(h => +h.slice(1));
    near(edges[0], p2[0], "the first run's band ends at x = 2");
    assert.ok(
      r.bandGroups[0].clip.includes(`M${p4[0]},`),
      "the next starts at x = 4",
    );
  });
}

/** Draws the dashed LinePlot in a fresh page and returns the bridge's midpoint on screen. */
const drawForHover = ([renderer]) =>
  new Promise(resolve => {
    const data = [];
    [1, 2, 3, 4, 5, 6].forEach(x => {
      data.push({id: "Alpha", x, y: x === 3 ? null : 10 + x * 3});
      data.push({id: "Beta", x, y: 50 + x});
    });
    const viz = new window.d3plus.LinePlot()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .shapeConfig({Line: {curve: "linear"}})
      .connectGaps("dashed")
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .legend(false)
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const box = host.getBoundingClientRect();
      let found = null;
      const walk = (n, x, y) => {
        const t = n.transform || {};
        if (n.key === "Alpha" && n.shapeType === "Line" && n.interactionPoints)
          found = {origin: [x, y], points: n.interactionPoints};
        (n.children || []).forEach(c =>
          walk(c, x + (t.x || 0), y + (t.y || 0)),
        );
      };
      walk(viz._paintedScene.root, 0, 0);
      const [p2, p4] = [found.points[1], found.points[2]];
      resolve([
        box.left + found.origin[0] + (p2.x + p4.x) / 2,
        box.top + found.origin[1] + (p2.y + p4.y) / 2,
      ]);
    });
  });

/** The visible tooltips' text, and the Alpha rows the chart hovers. */
const hoverState = () => {
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const viz = window.__viz;
  const hovered =
    typeof viz._hover === "function"
      ? (viz._filteredData || []).filter((d, i) => viz._hover(d, i))
      : [];
  return {tips, alpha: hovered.filter(d => d.id === "Alpha").length};
};

for (const renderer of ["svg", "canvas"]) {
  it(`connectGaps ${renderer}: hovering a bridge shows no value for its line`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px;"></div>',
    );
    try {
      const point = await page.evaluate(drawForHover, [renderer]);
      await page.mouse.move(point[0] - 4, point[1] - 4);
      await page.mouse.move(...point, {steps: 3});
      await page.waitForTimeout(150);
      const {tips, alpha} = await page.evaluate(hoverState);
      assert.strictEqual(alpha, 0, "the bridge doesn't hover its line");
      assert.strictEqual(tips.length, 1, "the shared tooltip shows");
      assert.ok(tips[0].includes("53"), `Beta's value at x = 3 (${tips[0]})`);
      assert.ok(!tips[0].includes("Alpha"), `no Alpha value (${tips[0]})`);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
