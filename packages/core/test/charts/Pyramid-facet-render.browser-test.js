/* global requestAnimationFrame */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A faceted Pyramid in real Chromium, on both backends: every panel draws
    its own center-gutter category labels, side titles, and comparison
    outline, against its own scales, and keeps them through a hover that
    dims the other bars.
*/

after(closeBrowser);

const bands = ["0-9", "10-19", "20-29", "30-39"];
const rows = ["2010", "2020"].flatMap((year, y) => bands.flatMap((age, b) => [
  {age, sex: "Male", pop: 1000 - b * 200 + y * 100, before: 900 - b * 150, year},
  {age, sex: "Female", pop: 1100 - b * 200 + y * 120, before: 950 - b * 150, year},
]));

const probe = ([data, renderer, bands]) => new Promise((resolve, reject) => {
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const unwrap = d => (d && d.data ? d.data : d);
  const viz = new window.d3plus.Pyramid()
    .data(data)
    .groupBy("sex")
    .y("age")
    .x("pop")
    .comparison("before")
    .facet("year")
    .renderer(renderer)
    .duration(0)
    .detectVisible(false)
    .select("#viz");

  /** Every painted node, with its offset from the surface origin. */
  const painted = () => {
    const out = [];
    const walk = (nodes, dx, dy) => nodes.forEach(n => {
      const x = dx + (n.transform?.x ?? 0), y = dy + (n.transform?.y ?? 0);
      out.push({node: n, x, y});
      if (n.children) walk(n.children, x, y);
    });
    walk(viz._paintedScene.root.children, 0, 0);
    return out;
  };

  /** Each panel's gutter labels, side titles, and outlines, and where its gutter is. */
  const read = () => {
    const nodes = painted();
    const inset = viz.ctx.pyramid.inset;
    const panels = viz._facetPanels.map(p => {
      const t = p.chartTransform || {x: 0, y: 0};
      const x = p.state._xFunc, y = p.state._yFunc;
      const mine = re => nodes.filter(({node}) => re.test(String(node.key)) && String(node.key).startsWith(`${p.key}/`));
      return {
        key: p.key,
        edges: [t.x + x(-inset), t.x + x(inset)],
        rows: Object.fromEntries(bands.map(b => [b, t.y + y(b)])),
        top: t.y + p.state._plotArea.y,
        labels: mine(/\/pyramid-category-\d+$/).map(({node, x: lx, y: ly}) => ({
          text: node.lines.map(l => l.text).join(""),
          cx: lx + node.width / 2,
          baseline: ly + node.lines[0].y,
          opacity: node.paint?.opacity,
        })),
        titles: mine(/\/pyramid-side-\d+$/).map(({node, y: ty}) => ({text: node.lines.map(l => l.text).join(""), y: ty})),
        outlines: mine(/\/pyramid-comparison-\d+$/).length,
      };
    });
    const stray = nodes.filter(({node}) => /^pyramid-/.test(String(node.key))).length;
    return {panels, stray};
  };

  /** Dark pixels in each panel's gutter, read off the drawn surface. */
  const ink = panels => {
    const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const ratio = canvas.width / canvas.getBoundingClientRect().width;
      return panels.map(p => {
        const [l, r] = p.edges;
        const ys = Object.values(p.rows);
        const x0 = Math.round((l + 2) * ratio), y0 = Math.round((Math.min(...ys) - 10) * ratio);
        const w = Math.max(1, Math.round((r - l - 4) * ratio)), h = Math.round((Math.max(...ys) - Math.min(...ys) + 20) * ratio);
        const px = ctx.getImageData(x0, y0, w, h).data;
        let dark = 0;
        for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 128 && px[i] + px[i + 1] + px[i + 2] < 300) dark++;
        return dark;
      });
    }
    const svg = document.querySelector("#viz svg.d3plus-render-svg");
    const origin = svg.getBoundingClientRect();
    return panels.map(p => Array.from(svg.querySelectorAll("text")).filter(t => {
      const b = t.getBoundingClientRect();
      const cx = (b.left + b.right) / 2 - origin.left;
      return t.textContent && cx > p.edges[0] && cx < p.edges[1] && b.top - origin.top > p.top;
    }).length);
  };

  const measure = async () => {
    const before = read();
    const drawn = ink(before.panels);
    // Hover a Female bar in the second panel.
    const cell = viz._facetPanels[1].cell;
    let point, age;
    for (let y = cell.y + 2; y < cell.y + cell.height && !point; y += 3)
      for (let x = cell.x + 2; x < cell.x + cell.width; x += 3) {
        const pick = viz._sceneRenderer.pick([x, y]);
        if (pick && pick.node && !pick.node.interactionGroup && unwrap(pick.datum)?.sex === "Female") {
          point = [x, y];
          age = unwrap(pick.datum).age;
          break;
        }
      }
    const el = document.querySelector(renderer === "canvas" ? "#viz canvas.d3plus-render-canvas" : "#viz svg.d3plus-render-svg");
    const ctm = el.getScreenCTM ? el.getScreenCTM() : null;
    const rect = el.getBoundingClientRect();
    const clientX = (ctm ? ctm.e : rect.left) + point[0], clientY = (ctm ? ctm.f : rect.top) + point[1];
    const target = renderer === "canvas" ? el : document.elementFromPoint(clientX, clientY);
    target.dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
    await frames();
    const after = read();
    const bars = painted()
      .filter(({node}) => node.shapeType === "Bar" && node.datum && !node.interactionGroup && String(node.key).startsWith("facet-") && !String(node.key).endsWith("::hit"))
      .map(({node}) => ({panel: String(node.key).split("/")[0], age: unwrap(node.datum).age, opacity: node.paint?.opacity}));
    return {
      canvas: !!document.querySelector("#viz canvas.d3plus-render-canvas"),
      before,
      drawn,
      hovered: typeof viz._hover === "function",
      age,
      after,
      bars,
    };
  };

  viz.render(() => measure().then(resolve, reject));
});

const body = '<div id="viz" style="width:900px;height:480px;font-family:sans-serif;background:white"></div>';
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

for (const renderer of ["svg", "canvas"]) {
  it(`a faceted Pyramid draws each panel's own gutter labels (${renderer})`, async function () {
    this.timeout(60000);
    const out = await render(body, probe, [rows, renderer, bands]);
    assert.strictEqual(out.canvas, renderer === "canvas", `drawn on the ${renderer} backend`);
    const {panels, stray} = out.before;
    assert.deepStrictEqual(panels.map(p => p.key), ["facet-2010", "facet-2020"]);
    assert.strictEqual(stray, 0, "no Pyramid nodes are drawn outside the panels");
    for (const p of panels) {
      assert.deepStrictEqual(p.labels.map(l => l.text), ["30-39", "20-29", "10-19", "0-9"], `${p.key} labels its gutter`);
      const center = (p.edges[0] + p.edges[1]) / 2;
      for (const l of p.labels) {
        assert.ok(near(l.cx, center), `${p.key} ${l.text} centered in its own gutter (${l.cx} vs ${center})`);
        const offset = l.baseline - p.rows[l.text];
        assert.ok(offset > 0 && offset < 10, `${p.key} ${l.text} sits on its row (baseline ${l.baseline}, row ${p.rows[l.text]})`);
      }
      assert.deepStrictEqual(p.titles.map(t => t.text), ["Male", "Female"], `${p.key} titles its halves`);
      p.titles.forEach(t => assert.ok(t.y < p.top, `${p.key} ${t.text} sits above the bars`));
      assert.strictEqual(p.outlines, 2, `${p.key} outlines both sides' comparison`);
    }
    assert.ok(panels[1].edges[0] - panels[0].edges[1] > 100, "each panel's gutter is its own");
    out.drawn.forEach((n, i) => assert.ok(n > 0, `${panels[i].key}'s gutter labels are drawn on the surface`));
  });

  it(`a faceted Pyramid keeps its gutter labels through a hover (${renderer})`, async function () {
    this.timeout(60000);
    const out = await render(body, probe, [rows, renderer, bands]);
    assert.ok(out.hovered, "hovering a bar sets the hover");
    const bars = out.bars.filter(b => b.panel === "facet-2020");
    const row = bars.filter(b => b.age === out.age);
    const others = bars.filter(b => b.age !== out.age);
    assert.strictEqual(row.length, 2, `the hovered row (${out.age}) has a bar on each side`);
    row.forEach(b => assert.ok(b.opacity === undefined || b.opacity === 1, "the hovered row stays bright"));
    assert.ok(others.length, "other rows are drawn");
    others.forEach(b => assert.ok(b.opacity < 1, `the ${b.age} row dims`));
    for (const p of out.after.panels) {
      assert.strictEqual(p.labels.length, 4, `${p.key} keeps its gutter labels`);
      p.labels.forEach(l => assert.ok(l.opacity === undefined || l.opacity === 1, `${p.key} ${l.text} is not dimmed`));
    }
  });
}
