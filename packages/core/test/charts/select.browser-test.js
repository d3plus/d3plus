import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Box and lasso selection (`selectMode`), in Chromium on SVG and Canvas: a
    drag draws the region and selects the marks inside, which stay lit while
    the rest dim; Shift adds, a click on a mark selects it, and a click on no
    mark or Escape clears; the toolbar buttons switch tools; selection works
    within a small-multiples panel, on a zoomed chart, on a Geomap's points
    and a Network's nodes, by keyboard and by touch; and it holds across
    redraws and can be set from code. Positions are read off the painted
    scene, so nothing depends on font metrics.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

// Page-side helpers: drawing, the painted marks' client positions, and
// synthetic pointer events on the chart's drawing surface.
const PRELUDE = `
  const done = chart => new Promise(r => chart.duration(0).render(r));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const events = [];
  const surfaceEl = chart => chart._sceneRenderer.elements().find(el => el.localName === "svg" || el.localName === "canvas");
  const origin = chart => {
    const el = surfaceEl(chart);
    const ctm = el.localName === "svg" ? el.getScreenCTM() : null;
    if (ctm) return [ctm.e, ctm.f];
    const r = el.getBoundingClientRect();
    return [r.left, r.top];
  };
  // Every painted circle, rect, and series point: its row id (and x), its client center, and its opacity.
  const marks = chart => {
    const [ox, oy] = origin(chart);
    const out = [];
    const walk = (n, x, y, k, opacity) => {
      const t = n.transform || {};
      const nx = x + k * (t.x || 0), ny = y + k * (t.y || 0), nk = k * (t.scale ?? 1);
      const o = opacity * (n.paint && typeof n.paint.opacity === "number" ? n.paint.opacity : 1);
      const d = n.datum && (n.datum.data || n.datum);
      const hit = String(n.key).endsWith("::hit");
      const group = n.interactionGroup;
      if (group === "axis" || group === "legend") return;
      if (!hit && d && n.type === "circle")
        out.push({id: d.id, x: ox + nx + nk * n.cx, y: oy + ny + nk * n.cy, opacity: o, kind: "circle"});
      if (!hit && d && n.type === "rect")
        out.push({id: d.id + "@" + d.x, x: ox + nx + nk * (n.x + n.width / 2), y: oy + ny + nk * (n.y + n.height / 2), opacity: o, kind: "rect"});
      // Series points sit in the space around the node, not under its own transform.
      if (!hit && n.interactionPoints && n.datum)
        for (const p of n.interactionPoints)
          out.push({id: p.datum.id + "@" + p.datum.x, x: ox + x + k * p.x, y: oy + y + k * p.y, opacity: o, kind: "point"});
      (n.children || []).forEach(c => walk(c, nx, ny, nk, o));
    };
    walk(chart._paintedScene.root, 0, 0, 1, 1);
    return out;
  };
  const inside = (m, [x0, y0], [x1, y1]) =>
    m.x >= Math.min(x0, x1) && m.x <= Math.max(x0, x1) && m.y >= Math.min(y0, y1) && m.y <= Math.max(y0, y1);
  const pointer = (type, target, [x, y], opts = {}) =>
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: x, clientY: y, pointerId: opts.pointerId ?? 1, isPrimary: true,
      pointerType: opts.pointerType ?? "mouse", button: 0, buttons: 1, shiftKey: !!opts.shift,
    }));
  // A drag through client points, starting on the chart's surface.
  const drag = async (chart, points, opts) => {
    const el = surfaceEl(chart).localName === "canvas" ? surfaceEl(chart) : chart._select.node();
    pointer("pointerdown", el, points[0], opts);
    for (const p of points.slice(1)) pointer("pointermove", el, p, opts);
    pointer("pointerup", el, points[points.length - 1], opts);
    await frames();
  };
  const ids = rows => rows.map(d => d.id + (d.x !== undefined && typeof d.x !== "object" && String(d.id).length === 1 ? "@" + d.x : "")).sort();
  const grid = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) grid.push({id: "p" + i + "-" + j, group: j % 2 ? "odd" : "even", x: i, y: j});
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a box selects the points inside it, dimming the rest and firing select`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy(["group", "id"]).x("x").y("y")
        .selectMode("box").on("select", rows => events.push(ids(rows)));
      await done(chart);
      const before = marks(chart).filter(m => m.kind === "circle");
      const a = before.find(m => m.id === "p1-1"), b = before.find(m => m.id === "p3-2");
      const from = [a.x - 5, a.y + 5], to = [b.x + 5, b.y - 5];
      const want = before.filter(m => inside(m, from, to)).map(m => m.id).sort();
      // The box shows while dragging, above the chart.
      const el = surfaceEl(chart).localName === "canvas" ? surfaceEl(chart) : chart._select.node();
      pointer("pointerdown", el, from);
      pointer("pointermove", el, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]);
      pointer("pointermove", el, to);
      const path = document.querySelector("#viz g.d3plus-select-brush path");
      const shown = Boolean(path && path.style.display !== "none" && path.getAttribute("d"));
      pointer("pointerup", el, to);
      await frames();
      const after = marks(chart).filter(m => m.kind === "circle");
      return {
        want, events, shown,
        hidden: path.style.display === "none",
        selection: ids(chart.selection()),
        lit: after.filter(m => m.opacity === 1).map(m => m.id).sort(),
        dim: [...new Set(after.filter(m => m.opacity < 1).map(m => m.opacity))],
      };
    `,
      renderer,
    );
    assert.ok(
      r.want.length >= 4 && r.want.length < 24,
      `picks a few (${r.want})`,
    );
    assert.ok(r.shown, "the box shows mid-drag");
    assert.ok(r.hidden, "and hides on release");
    assert.deepStrictEqual(
      r.events,
      [r.want],
      "select fires with the rows inside",
    );
    assert.deepStrictEqual(r.selection, r.want, "selection() reads them back");
    assert.deepStrictEqual(r.lit, r.want, "only they stay lit");
    assert.deepStrictEqual(r.dim, [0.25], "the rest dim by activeOpacity");
  });

  it(`[${renderer}] Shift adds, a click selects or toggles, and a click on nothing or Escape clears`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false)
        .selectMode("box").on("select", rows => events.push(ids(rows)));
      await done(chart);
      const at = id => marks(chart).find(m => m.id === id && m.kind === "circle");
      const around = (id, pad = 6) => { const m = at(id); return [[m.x - pad, m.y - pad], [m.x + pad, m.y + pad]]; };
      await drag(chart, around("p0-0"));
      await drag(chart, around("p5-3"), {shift: true});
      const two = ids(chart.selection());
      // A routed click on a mark selects it (Shift toggles it), as Enter does.
      const click = (id, shiftKey) => {
        const m = at(id);
        const [ox, oy] = origin(chart);
        let pick = null;
        const find = n => { const d = n.datum && (n.datum.data || n.datum); if (!pick && n.type === "circle" && d && d.id === id && !String(n.key).endsWith("::hit")) pick = n; (n.children || []).forEach(find); };
        find(chart._paintedScene.root);
        chart._routeSceneEvent({type: "click", point: [m.x - ox, m.y - oy], pick: {node: pick, datum: pick.datum, index: pick.index}, nativeEvent: new MouseEvent("click", {shiftKey})});
      };
      click("p2-2", true);
      const three = ids(chart.selection());
      click("p2-2", true);
      click("p4-1", false);
      const one = ids(chart.selection());
      // A press and click over no mark clears.
      const el = surfaceEl(chart).localName === "canvas" ? surfaceEl(chart) : chart._select.node();
      const [ox, oy] = origin(chart);
      const empty = [ox + chart._margin.left + 2, oy + chart._margin.top + 2];
      pointer("pointerdown", el, empty);
      pointer("pointerup", el, empty);
      el.dispatchEvent(new MouseEvent("click", {bubbles: true, clientX: empty[0], clientY: empty[1]}));
      await frames();
      const cleared = chart.selection().length;
      await drag(chart, around("p1-1"));
      window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
      await frames();
      return {two, three, one, cleared, escaped: chart.selection().length, events};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.two, ["p0-0", "p5-3"], "Shift + drag adds");
    assert.deepStrictEqual(
      r.three,
      ["p0-0", "p2-2", "p5-3"],
      "Shift + click adds",
    );
    assert.deepStrictEqual(r.one, ["p4-1"], "a click replaces");
    assert.strictEqual(r.cleared, 0, "a click on no mark clears");
    assert.strictEqual(r.escaped, 0, "Escape clears");
    assert.deepStrictEqual(
      r.events.at(-1),
      [],
      "clearing fires select with no rows",
    );
    assert.strictEqual(r.events.length, 8);
  });

  it(`[${renderer}] a lasso selects a line's points and keeps the line lit`, async () => {
    const r = await page(
      `
      const series = [];
      ["a", "b"].forEach((id, k) => { for (let x = 0; x < 8; x++) series.push({id, x, y: k * 10 + x}); });
      const chart = new d3plus.LinePlot().select("#viz").renderer(arg)
        .data(series).groupBy("id").x("x").y("y").legend(false)
        .selectMode("lasso").on("select", rows => events.push(ids(rows)));
      await done(chart);
      const pts = marks(chart).filter(m => m.kind === "point");
      const [p2, p4] = ["a@2", "a@4"].map(id => pts.find(m => m.id === id));
      // A freehand loop around a's points 2 to 4, well away from b.
      const x0 = p2.x - 8, x1 = p4.x + 8, y0 = Math.min(p2.y, p4.y) - 8, y1 = Math.max(p2.y, p4.y) + 8;
      const loop = [];
      for (let i = 0; i <= 10; i++) loop.push([x0 + ((x1 - x0) * i) / 10, y0]);
      for (let i = 0; i <= 10; i++) loop.push([x1, y0 + ((y1 - y0) * i) / 10]);
      for (let i = 0; i <= 10; i++) loop.push([x1 - ((x1 - x0) * i) / 10, y1]);
      await drag(chart, loop);
      const lines = [];
      const walk = n => { if (n.interactionPoints && n.datum) lines.push([n.datum.id ?? (n.datum.data || {}).id, n.paint?.opacity ?? 1]); (n.children || []).forEach(walk); };
      walk(chart._paintedScene.root);
      return {events, lines};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.events, [["a@2", "a@3", "a@4"]]);
    const opacity = Object.fromEntries(r.lines);
    assert.strictEqual(opacity.a, 1, "the selected series stays lit");
    assert.strictEqual(opacity.b, 0.25, "the other dims");
  });

  it(`[${renderer}] the toolbar's select buttons switch tools, and brush mode turns them off`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false).selectMode("box");
      await done(chart);
      const button = cls => document.querySelector("#viz .d3plus-zoom-control ." + cls);
      const state = () => ({
        tool: chart._selectTool,
        box: button("select-box").getAttribute("aria-pressed"),
        lasso: button("select-lasso").getAttribute("aria-pressed"),
        touch: (chart._zoomEventTarget.node()).style.touchAction,
      });
      const out = [state()];
      button("select-lasso").click(); out.push(state());
      button("select-lasso").click(); out.push(state());
      button("select-box").click(); out.push(state());
      button("zoom-brush").click(); out.push({...state(), brushing: chart.zoomBrush()});
      return {out, labels: [button("select-box").getAttribute("aria-label"), button("select-lasso").getAttribute("aria-label")]};
    `,
      renderer,
    );
    const [start, lasso, off, boxOn, brush] = r.out;
    assert.deepStrictEqual(r.labels, ["Box Select", "Lasso Select"]);
    assert.deepStrictEqual(
      [start.tool, start.box, start.lasso, start.touch],
      ["box", "true", "false", "none"],
      "selectMode sets the starting tool",
    );
    assert.deepStrictEqual([lasso.tool, lasso.lasso], ["lasso", "true"]);
    assert.strictEqual(off.tool, null, "pressing the tool on again pans");
    assert.notStrictEqual(off.touch, "none", "and gives touches back");
    assert.strictEqual(boxOn.tool, "box");
    assert.deepStrictEqual(
      [brush.tool, brush.box, brush.brushing],
      [null, "false", true],
    );
  });

  it(`[${renderer}] small multiples select within the panel a drag starts in`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").facet("group").legend(false)
        .selectMode("box").on("select", rows => events.push(rows.map(d => d.group)));
      await done(chart);
      // From the top-left of the first panel's chart area across the whole chart.
      const [ox, oy] = origin(chart);
      const a = chart._facetPanels[0].area;
      await drag(chart, [[ox + a.x + 1, oy + a.y + 1], [ox + 595, oy + 395]]);
      return {groups: [...new Set(events[0])], count: events[0].length, panel: chart._facetPanels[0].value};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.groups, [r.panel], "only the first panel's rows");
    assert.strictEqual(r.count, 12, "all of them");
  });

  it(`[${renderer}] a zoomed chart selects what shows under the box`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false).selectMode("box");
      await done(chart);
      chart.zoomIn();
      await new Promise(r => setTimeout(r, 700));
      const shown = marks(chart).filter(m => m.kind === "circle");
      const [ox, oy] = origin(chart);
      const from = [ox + chart._margin.left + 1, oy + chart._margin.top + 1];
      const to = [ox + 300, oy + 200];
      const area = [[ox + chart._margin.left, oy + chart._margin.top], [ox + 600 - chart._margin.right, oy + 400 - chart._margin.bottom]];
      const want = shown.filter(m => inside(m, from, to) && inside(m, ...area)).map(m => m.id).sort();
      await drag(chart, [from, to]);
      return {want, got: ids(chart.selection()), zoomed: chart._plotZoomBase !== undefined};
    `,
      renderer,
    );
    assert.ok(r.want.length > 0, "the box covers some points");
    assert.deepStrictEqual(r.got, r.want);
  });

  it(`[${renderer}] the selection holds across redraws, follows data, and can be set from code`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false)
        .selectMode("box").on("select", rows => events.push(rows.length));
      await done(chart);
      chart.selection(d => d.x >= 4);
      await frames();
      const code = ids(chart.selection());
      const dimmed = marks(chart).filter(m => m.kind === "circle" && m.opacity < 1).length;
      chart.selection(grid.filter(d => d.y === 0).map(d => ({...d})));
      await done(chart);
      const rows = ids(chart.selection());
      // New data with the same values keeps them; changed values drop out.
      await done(chart.data(grid.map(d => ({...d, y: d.id === "p0-0" ? 9 : d.y}))));
      const moved = ids(chart.selection());
      chart.selection(false);
      await frames();
      return {code, dimmed, rows, moved, cleared: chart.selection().length, events};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.code, [
      "p4-0",
      "p4-1",
      "p4-2",
      "p4-3",
      "p5-0",
      "p5-1",
      "p5-2",
      "p5-3",
    ]);
    assert.strictEqual(r.dimmed, 16);
    assert.deepStrictEqual(
      r.rows,
      ["p0-0", "p1-0", "p2-0", "p3-0", "p4-0", "p5-0"],
      "rows match by value and survive a redraw",
    );
    assert.deepStrictEqual(r.moved, ["p1-0", "p2-0", "p3-0", "p4-0", "p5-0"]);
    assert.strictEqual(r.cleared, 0);
    assert.deepStrictEqual(r.events, [], "code fires no select event");
  });

  it(`[${renderer}] the keyboard selects the focused mark and announces it`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false).selectMode("box");
      await done(chart);
      const wait = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
      const host = document.querySelector("#viz .d3plus-keyboard-nav");
      const live = host.querySelector("[aria-live]");
      const key = (k, shiftKey = false) => host.dispatchEvent(new KeyboardEvent("keydown", {key: k, shiftKey, bubbles: true, cancelable: true}));
      host.focus(); await wait();
      key("Enter"); await wait();
      const one = [chart.selection().length, live.textContent];
      key("ArrowRight"); await wait();
      key("Enter", true); await wait();
      const two = [chart.selection().length, live.textContent];
      key("Escape"); await wait();
      const focusLeft = chart.selection().length;
      key("Escape"); await wait();
      return {one, two, focusLeft, cleared: [chart.selection().length, live.textContent]};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.one, [1, "1 selected"]);
    assert.deepStrictEqual(r.two, [2, "2 selected"]);
    assert.strictEqual(r.focusLeft, 2, "the first Escape leaves the mark");
    assert.deepStrictEqual(
      r.cleared,
      [0, "Selection cleared"],
      "the next clears",
    );
  });

  it(`[${renderer}] one finger draws a lasso`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false).selectMode("lasso");
      await done(chart);
      const m = marks(chart).find(m => m.id === "p2-2" && m.kind === "circle");
      const loop = [];
      for (let i = 0; i <= 16; i++) loop.push([m.x + 10 * Math.cos(i / 16 * 2 * Math.PI), m.y + 10 * Math.sin(i / 16 * 2 * Math.PI)]);
      await drag(chart, loop, {pointerType: "touch", pointerId: 7});
      const el = surfaceEl(chart).localName === "canvas" ? surfaceEl(chart) : chart._select.node();
      return {got: ids(chart.selection()), touch: el.style.touchAction};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.got, ["p2-2"]);
    assert.strictEqual(r.touch, "none", "the surface takes the touch");
  });

  it(`[${renderer}] a chart without selectMode pans until a select button is pressed, then selects by drag and keyboard`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false)
        .on("select", rows => events.push(ids(rows)));
      await done(chart);
      const button = cls => document.querySelector("#viz .d3plus-zoom-control ." + cls);
      const at = id => marks(chart).find(m => m.id === id && m.kind === "circle");
      const around = id => { const m = at(id); return [[m.x - 6, m.y - 6], [m.x + 6, m.y + 6]]; };
      const start = {tool: chart._selectTool, box: Boolean(button("select-box")), lasso: Boolean(button("select-lasso"))};
      await drag(chart, around("p1-1"));
      const panning = chart.selection().length;
      button("select-box").click();
      await drag(chart, around("p1-1"));
      const dragged = ids(chart.selection());
      await done(chart);
      const afterRedraw = chart._selectTool;
      const wait = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
      const host = document.querySelector("#viz .d3plus-keyboard-nav");
      host.focus(); await wait();
      host.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", shiftKey: true, bubbles: true, cancelable: true}));
      await wait();
      const live = host.querySelector("[aria-live]").textContent;
      return {start, panning, dragged, afterRedraw, keyboard: chart.selection().length, live, events: events.length};
    `,
      renderer,
    );
    assert.deepStrictEqual(
      r.start,
      {tool: null, box: true, lasso: true},
      "both buttons show, none on",
    );
    assert.strictEqual(r.panning, 0, "a drag pans, selecting nothing");
    assert.deepStrictEqual(
      r.dragged,
      ["p1-1"],
      "with the box tool on, a drag selects",
    );
    assert.strictEqual(r.afterRedraw, "box", "the tool holds across a redraw");
    assert.strictEqual(r.keyboard, 2, "Shift+Enter adds the focused mark");
    assert.strictEqual(r.live, "2 selected");
    assert.strictEqual(r.events, 2);
  });

  it(`[${renderer}] selectMode works with zoom off`, async () => {
    const r = await page(
      `
      const off = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false).zoom(false).selectMode("box");
      await done(off);
      const m = marks(off).find(m => m.id === "p2-2" && m.kind === "circle");
      await drag(off, [[m.x - 6, m.y - 6], [m.x + 6, m.y + 6]]);
      return {buttons: document.querySelectorAll("#viz .d3plus-zoom-control button").length, selected: ids(off.selection())};
    `,
      renderer,
    );
    assert.deepStrictEqual(r, {buttons: 0, selected: ["p2-2"]});
  });

  it(`[${renderer}] a narrow chart moves the buttons that don't fit into a More Controls menu, and Lasso picked there selects`, async () => {
    const r = await page(
      `
      document.querySelector("#viz").style.width = "180px";
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false);
      await done(chart);
      await frames();
      const shown = el => el.getBoundingClientRect().width > 0;
      const rects = sel => [...document.querySelectorAll(sel)].filter(shown).map(e => e.getBoundingClientRect());
      const left = rects(".d3plus-top-left-controls-item button");
      const right = rects(".d3plus-zoom-control button.zoom-control");
      const box = document.querySelector("#viz").getBoundingClientRect();
      const more = document.querySelector("#viz .zoom-more");
      const menu = document.querySelector("#viz .d3plus-zoom-menu");
      const layout = {
        order: [...document.querySelectorAll("#viz button.zoom-control")].map(b => b.classList[1]),
        items: [...menu.querySelectorAll(".zoom-menu-item")].map(b => b.textContent),
        overlap: left.some(a => right.some(b => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom)),
        inside: right.every(b => b.left >= box.left && b.right <= box.right + 0.5),
        rows: new Set(right.map(b => Math.round(b.top))).size,
        clear: chart._margin.top >= Math.max(...right.map(b => b.bottom)) - box.top,
        closed: getComputedStyle(menu).display,
      };
      more.click();
      const open = {display: getComputedStyle(menu).display, expanded: more.getAttribute("aria-expanded"), focus: document.activeElement.textContent};
      menu.querySelector(".select-lasso").click();
      await frames();
      const picked = {
        tool: chart._selectTool,
        display: getComputedStyle(menu).display,
        expanded: more.getAttribute("aria-expanded"),
        refocused: document.activeElement === more,
        icon: more.classList.contains("active") && more.querySelectorAll("circle").length !== 3,
      };
      const m = marks(chart).find(m => m.id === "p2-2" && m.kind === "circle");
      const loop = [];
      for (let i = 0; i <= 16; i++) loop.push([m.x + 8 * Math.cos(i / 16 * 2 * Math.PI), m.y + 8 * Math.sin(i / 16 * 2 * Math.PI)]);
      await drag(chart, loop);
      return {layout, open, picked, selected: ids(chart.selection())};
    `,
      renderer,
    );
    const {layout, open, picked} = r;
    assert.ok(
      layout.order.length < 7 && layout.order.at(-1) === "zoom-more",
      `the menu button comes last (${layout.order})`,
    );
    assert.deepStrictEqual(
      layout.order.slice(0, -1),
      [
        "zoom-in",
        "zoom-out",
        "zoom-reset",
        "zoom-brush",
        "select-box",
        "select-lasso",
      ].slice(0, layout.order.length - 1),
      "the buttons keep their order",
    );
    assert.strictEqual(
      layout.order.length - 1 + layout.items.length,
      6,
      "the menu holds the rest",
    );
    assert.strictEqual(
      layout.items.at(-1),
      "Lasso Select",
      "each with its label",
    );
    assert.strictEqual(
      layout.overlap,
      false,
      "no button covers a top-left control",
    );
    assert.ok(layout.inside, "every button stays inside the chart");
    assert.strictEqual(layout.rows, 1, "one row");
    assert.ok(layout.clear, "the chart starts below it");
    assert.strictEqual(layout.closed, "none");
    assert.deepStrictEqual(open, {
      display: "flex",
      expanded: "true",
      focus: layout.items[0],
    });
    assert.deepStrictEqual(picked, {
      tool: "lasso",
      display: "none",
      expanded: "false",
      refocused: true,
      icon: true,
    });
    assert.deepStrictEqual(r.selected, ["p2-2"], "dragging then draws a lasso");
  });

  it(`[${renderer}] the More Controls menu opens and closes by keyboard and closes on an outside click`, async () => {
    const r = await page(
      `
      document.querySelector("#viz").style.width = "180px";
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false);
      await done(chart);
      const more = document.querySelector("#viz .zoom-more");
      const menu = document.querySelector("#viz .d3plus-zoom-menu");
      const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", {key: k, bubbles: true, cancelable: true}));
      const state = () => ({open: getComputedStyle(menu).display === "flex", focus: document.activeElement === more ? "more" : document.activeElement.textContent});
      const items = [...menu.querySelectorAll(".zoom-menu-item")].map(b => b.textContent);
      more.focus();
      key(more, "ArrowDown");
      const opened = state();
      key(document.activeElement, "ArrowDown");
      const next = state();
      key(document.activeElement, "End");
      const end = state();
      key(document.activeElement, "Escape");
      const escaped = state();
      key(more, "ArrowUp");
      const up = state();
      document.body.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true}));
      const outside = state();
      return {items, opened, next, end, escaped, up, outside: outside.open};
    `,
      renderer,
    );
    const last = r.items.at(-1);
    assert.deepStrictEqual(
      r.opened,
      {open: true, focus: r.items[0]},
      "ArrowDown opens on the first item",
    );
    assert.deepStrictEqual(r.next, {
      open: true,
      focus: r.items[1] ?? r.items[0],
    });
    assert.deepStrictEqual(r.end, {open: true, focus: last});
    assert.deepStrictEqual(
      r.escaped,
      {open: false, focus: "more"},
      "Escape closes, focus back on the button",
    );
    assert.deepStrictEqual(
      r.up,
      {open: true, focus: last},
      "ArrowUp opens on the last item",
    );
    assert.strictEqual(r.outside, false, "a click outside closes it");
  });

  it(`[${renderer}] a wide chart shows every button and no More Controls menu`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Plot().select("#viz").renderer(arg)
        .data(grid).groupBy("id").x("x").y("y").legend(false);
      await done(chart);
      return {
        order: [...document.querySelectorAll("#viz button.zoom-control")].map(b => b.classList[1]),
        menu: Boolean(document.querySelector("#viz .d3plus-zoom-menu")),
      };
    `,
      renderer,
    );
    assert.deepStrictEqual(r, {
      order: [
        "zoom-in",
        "zoom-out",
        "zoom-reset",
        "zoom-brush",
        "select-box",
        "select-lasso",
      ],
      menu: false,
    });
  });

  it(`[${renderer}] a Network selects its nodes, not its links`, async () => {
    const r = await page(
      `
      const out = {};
      const nodes = [{id: "na", x: 0, y: 0}, {id: "nb", x: 1, y: 0}, {id: "nc", x: 0, y: 1}, {id: "nd", x: 1, y: 1}];
      const net = new d3plus.Network().select("#viz").renderer(arg)
        .nodes(nodes).links([{source: "na", target: "nb"}, {source: "na", target: "nc"}, {source: "nb", target: "nd"}])
        .legend(false).selectMode("box");
      await done(net);
      const [ox, oy] = origin(net);
      const m = net._margin;
      await drag(net, [[ox + m.left + 1, oy + m.top + 1], [ox + 599 - m.right, oy + 399 - m.bottom]]);
      out.network = ids(net.selection());
      return out;
    `,
      renderer,
    );
    assert.deepStrictEqual(
      r.network,
      ["na", "nb", "nc", "nd"],
      "nodes, not links",
    );
  });
}

it("real mouse: a drag selects instead of panning, and swallows its click", async () => {
  const {page: p, errors, close} = await openPage(box);
  try {
    const result = await p.evaluate(
      () =>
        new Promise(resolve => {
          window.__clicks = [];
          window.__events = [];
          const grid = [];
          for (let i = 0; i < 6; i++)
            for (let j = 0; j < 4; j++)
              grid.push({id: `p${i}-${j}`, x: i, y: j});
          const viz = new window.d3plus.Plot()
            .select("#viz")
            .duration(0)
            .data(grid)
            .groupBy("id")
            .x("x")
            .y("y")
            .legend(false)
            .selectMode("box")
            .on("select", rows => window.__events.push(rows.length))
            .on("click.shape", d => window.__clicks.push(d.id));
          window.__viz = viz;
          viz.render(() => {
            const el = document.querySelector("#viz svg");
            const r = el.getBoundingClientRect();
            // Zoomed in, so a drag that panned would move the axes.
            viz.zoomIn();
            window.__domain = viz._xAxis._d3Scale.domain().join();
            resolve({
              left: r.left + viz._margin.left,
              top: r.top + viz._margin.top,
            });
          });
        }),
    );
    const {left, top} = result;
    await p.mouse.move(left + 5, top + 5);
    await p.mouse.down();
    await p.mouse.move(left + 400, top + 300, {steps: 8});
    await p.mouse.up();
    await p.waitForTimeout(100);
    const s = await p.evaluate(() => ({
      events: window.__events.slice(),
      clicks: window.__clicks.slice(),
      selected: window.__viz.selection().length,
      panned: window.__viz._xAxis._d3Scale.domain().join() !== window.__domain,
    }));
    assert.deepStrictEqual(s.events, [s.selected], "one select event");
    assert.ok(s.selected > 0, `selects (${s.selected})`);
    assert.deepStrictEqual(s.clicks, [], "the drag clicks nothing");
    assert.strictEqual(s.panned, false, "and pans nothing");
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
});
