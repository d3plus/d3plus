import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    Draggable reference lines in Chromium, on SVG and Canvas: a real mouse
    drags the line (firing drag and end events, without clicking), the
    value lasts through a redraw, a linked valueColors threshold and the
    line's highlight follow it, the keyboard moves a focused line, one
    finger drags it, and lines that can't move get no handle.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

const sales = [
  {month: "Jan", sales: 30},
  {month: "Feb", sales: 45},
  {month: "Mar", sales: 60},
  {month: "Apr", sales: 52},
];

/** Runs in the page: draws a chart of `type` with `config`, logging its events. */
const start = ([type, json, renderer]) => {
  window.__drawn = false;
  window.__events = [];
  window.__clicks = 0;
  const log = kind => (value, line, index) =>
    window.__events.push({
      kind,
      value: value instanceof Date ? +value : value,
      id: line.id,
      index,
    });
  window.__viz = new window.d3plus[type]()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .config(JSON.parse(json))
    .on("drag.referenceLine", log("drag"))
    .on("end.referenceLine", log("end"))
    .on("click.shape", () => window.__clicks++)
    .render(() => (window.__drawn = true));
  return true;
};

async function painted(page) {
  for (let i = 0; i < 100 && !(await page.evaluate(() => window.__drawn)); i++)
    await page.waitForTimeout(16);
  assert.ok(await page.evaluate(() => window.__drawn), "drawn");
  await page.waitForTimeout(32);
}

/** Runs in the page: the handles, the reference line nodes, and the bars' fills. */
const state = () => {
  const viz = window.__viz;
  const handles = [...document.querySelectorAll(".d3plus-reference-drag")].map(
    el => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        focused: document.activeElement === el,
        now: el.getAttribute("aria-valuenow"),
        text: el.getAttribute("aria-valuetext"),
        label: el.getAttribute("aria-label"),
      };
    },
  );
  const lines = [];
  const texts = [];
  const bars = {};
  const fills = {};
  const walk = (n, inAnnotation) => {
    const annotation = inAnnotation || String(n.key).includes("annotation-");
    if (annotation && n.type === "line")
      lines.push({y: n.points[0][1], width: n.paint.strokeWidth});
    if (annotation && n.type === "text")
      texts.push(...n.lines.map(l => l.text));
    const d = n.datum && (n.datum.data || n.datum);
    if (n.type === "rect" && d && d.month && !String(n.key).endsWith("::hit"))
      bars[d.month] = n.paint.fill;
    if (n.type === "circle" && d && d.id) fills[d.id] = n.paint.fill;
    (n.children || []).forEach(c => walk(c, annotation));
  };
  walk(viz._paintedScene.root, false);
  return {
    handles,
    lines,
    texts,
    bars,
    fills,
    value: (viz.referenceLines()[0] || {}).y,
    events: window.__events,
    clicks: window.__clicks,
  };
};

async function drag(page, [x, y], dy, steps = 6) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x, y + (dy * i) / steps);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(50);
}

const target = {
  data: sales,
  groupBy: "month",
  x: "month",
  y: "sales",
  referenceLines: [{y: 50, id: "target", draggable: {step: 1}}],
  valueColors: {values: "target", colors: ["#ff0000", "#00ff00"]},
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] dragging the line moves it, recolors the linked bars, and fires drag and end`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "BarChart",
        JSON.stringify(target),
        renderer,
      ]);
      await painted(page);
      const before = await page.evaluate(state);
      assert.strictEqual(before.handles.length, 1);
      assert.ok(before.texts.includes("50"), "labeled with its value");
      assert.strictEqual(before.bars.Mar, "#00ff00");
      assert.strictEqual(before.bars.Apr, "#00ff00");
      assert.strictEqual(before.bars.Feb, "#ff0000");
      const [handle] = before.handles;
      // Up past 52 (Apr), not 60 (Mar).
      const pxPerUnit = await page.evaluate(() => {
        const y = window.__viz._yAxis;
        return Math.abs(y._getPosition(0) - y._getPosition(1));
      });
      // A drag repaints at the drawn layout: nothing is measured again.
      await page.evaluate(() => {
        const viz = window.__viz;
        const draw = viz._draw;
        window.__draws = 0;
        viz._draw = function (...args) {
          window.__draws++;
          return draw.apply(this, args);
        };
      });
      await drag(page, [handle.x - 100, handle.y], -5.4 * pxPerUnit);
      assert.strictEqual(await page.evaluate(() => window.__draws), 0);
      const after = await page.evaluate(state);
      assert.ok(after.value >= 54 && after.value <= 56, `value ${after.value}`);
      assert.ok(Number.isInteger(after.value), "snaps to whole units");
      assert.ok(after.lines[0].y < before.lines[0].y, "the line moved up");
      assert.strictEqual(after.bars.Apr, "#ff0000", "Apr is now below it");
      assert.strictEqual(after.bars.Mar, "#00ff00");
      assert.ok(after.texts.includes(`${after.value}`), "the label follows");
      assert.strictEqual(after.handles[0].now, `${after.value}`);
      const kinds = after.events.map(e => e.kind);
      assert.ok(kinds.filter(k => k === "drag").length >= 2, "drag events");
      assert.strictEqual(kinds[kinds.length - 1], "end");
      assert.strictEqual(
        after.events[after.events.length - 1].value,
        after.value,
      );
      assert.strictEqual(after.events[0].id, "target");
      assert.strictEqual(after.clicks, 0, "the drag doesn't click");

      // The value lasts through a redraw.
      await page.evaluate(() => {
        window.__drawn = false;
        window.__viz.render(() => (window.__drawn = true));
      });
      await painted(page);
      const redrawn = await page.evaluate(state);
      assert.strictEqual(redrawn.value, after.value);
      assert.strictEqual(redrawn.bars.Apr, "#ff0000");
    }));

  it(`[${renderer}] the keyboard moves a focused line, announced as the slider's value`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "BarChart",
        JSON.stringify(target),
        renderer,
      ]);
      await painted(page);
      const key = k =>
        page.evaluate(name => {
          const el = document.querySelector(".d3plus-reference-drag");
          el.focus();
          el.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: name,
              bubbles: true,
              cancelable: true,
            }),
          );
        }, k);
      await key("ArrowUp");
      await key("ArrowUp");
      await page.waitForTimeout(50);
      let s = await page.evaluate(state);
      assert.strictEqual(s.value, 52);
      assert.strictEqual(s.handles[0].now, "52");
      assert.strictEqual(s.handles[0].text, "52");
      assert.strictEqual(s.handles[0].label, "Reference line");
      assert.ok(s.handles[0].focused, "keeps focus through the repaint");
      assert.ok(s.lines[0].width > 1, "lit while focused");
      assert.deepStrictEqual(
        s.events.map(e => e.kind),
        ["drag", "end", "drag", "end"],
      );
      await key("PageDown");
      await page.waitForTimeout(50);
      assert.strictEqual((await page.evaluate(state)).value, 42);
      await key("End");
      await page.waitForTimeout(50);
      s = await page.evaluate(state);
      assert.strictEqual(s.value, Number(s.handles[0].now));
      assert.strictEqual(
        s.handles[0].now,
        await page.evaluate(() => {
          const el = document.querySelector(".d3plus-reference-drag");
          return el.getAttribute("aria-valuemax");
        }),
      );
      await key("Escape");
      assert.strictEqual((await page.evaluate(state)).events.length, 8);
    }));
}

it("a zoomed plot's line drags along its zoomed axis", () =>
  withPage(box, async page => {
    const rows = [];
    for (let i = 0; i <= 10; i++) rows.push({id: "a", x: i, y: i * 10});
    await page.evaluate(start, [
      "LinePlot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        zoom: true,
        referenceLines: [{y: 50, draggable: true}],
      }),
      "svg",
    ]);
    await painted(page);
    const unit = () =>
      page.evaluate(() => {
        const y = window.__viz._yAxis;
        return Math.abs(y._getPosition(0) - y._getPosition(1));
      });
    const unzoomed = await unit();
    await page.evaluate(() =>
      document.querySelector("button[aria-label='Zoom In']").click(),
    );
    await page.waitForTimeout(900);
    const zoomed = await unit();
    assert.ok(zoomed > unzoomed * 1.2, "the y axis rescaled");
    const {handles} = await page.evaluate(state);
    assert.strictEqual(handles.length, 1, "still in view");
    await drag(page, [handles[0].x - 50, handles[0].y], -30);
    const {value} = await page.evaluate(state);
    const expected = 50 + 30 / zoomed;
    assert.ok(Math.abs(value - expected) < 0.5, `${value} ≈ ${expected}`);
  }));

it("one finger drags the line", () =>
  withPage(box, async page => {
    await page.evaluate(start, ["BarChart", JSON.stringify(target), "svg"]);
    await painted(page);
    await page.evaluate(() => {
      const el = document.querySelector(".d3plus-reference-drag");
      const r = el.getBoundingClientRect();
      const x = r.left + 20,
        y = r.top + r.height / 2;
      const touch = dy =>
        new Touch({identifier: 1, target: el, clientX: x, clientY: y + dy});
      const fire = (type, dy) => {
        const t = touch(dy);
        const list = type === "touchend" ? [] : [t];
        (type === "touchstart" ? el : window).dispatchEvent(
          new TouchEvent(type, {
            touches: list,
            targetTouches: list,
            changedTouches: [t],
            bubbles: true,
            cancelable: true,
          }),
        );
      };
      fire("touchstart", 0);
      fire("touchmove", 20);
      fire("touchmove", 40);
      fire("touchend", 40);
    });
    await page.waitForTimeout(50);
    const s = await page.evaluate(state);
    assert.ok(s.value < 50, `moved down to ${s.value}`);
    assert.strictEqual(s.events[s.events.length - 1].kind, "end");
  }));

it("highlight follows a dragged line", () =>
  withPage(box, async page => {
    const points = [
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 40},
      {id: "c", x: 3, y: 70},
    ];
    await page.evaluate(start, [
      "Plot",
      JSON.stringify({
        data: points,
        groupBy: "id",
        referenceLines: [{y: 50, draggable: true, highlight: "above"}],
      }),
      "svg",
    ]);
    await painted(page);
    // The rows off the highlighted side gray out.
    const gray = c => /^rgb\((\d+), \1, \1\)$/.test(c);
    const before = await page.evaluate(state);
    assert.ok(gray(before.fills.a) && gray(before.fills.b), "a and b grayed");
    assert.ok(!gray(before.fills.c), "c lit");
    const pxPerUnit = await page.evaluate(() => {
      const y = window.__viz._yAxis;
      return Math.abs(y._getPosition(0) - y._getPosition(1));
    });
    await drag(
      page,
      [before.handles[0].x, before.handles[0].y],
      20 * pxPerUnit,
    );
    const after = await page.evaluate(state);
    assert.ok(after.value < 40 && after.value > 10, `value ${after.value}`);
    assert.ok(!gray(after.fills.b), "b lit too");
    assert.ok(gray(after.fills.a), "a still grayed");
  }));

it("a time axis line drags to dates inside its range", () =>
  withPage(box, async page => {
    const rows = [];
    for (let i = 0; i < 24; i++)
      rows.push({id: "p", date: Date.UTC(2021, i, 1), value: 10 + (i % 5)});
    await page.evaluate(start, [
      "LinePlot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        x: "date",
        y: "value",
        xConfig: {utc: true},
        referenceLines: [
          {
            x: Date.UTC(2021, 6, 1),
            draggable: {min: Date.UTC(2021, 3, 1), max: Date.UTC(2021, 9, 1)},
          },
        ],
      }),
      "svg",
    ]);
    await page.evaluate(() => window.__viz.time("date"));
    await page.evaluate(() => {
      window.__drawn = false;
      window.__viz.render(() => (window.__drawn = true));
    });
    await painted(page);
    const before = await page.evaluate(state);
    assert.strictEqual(before.handles[0].text, "Jul 1, 2021");
    const {x, y} = before.handles[0];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 400, y);
    await page.waitForTimeout(30);
    await page.mouse.up();
    await page.waitForTimeout(50);
    const after = await page.evaluate(() => ({
      x: +window.__viz.referenceLines()[0].x,
      date: window.__viz.referenceLines()[0].x instanceof Date,
      events: window.__events,
    }));
    assert.ok(after.date, "stored as a Date");
    assert.strictEqual(after.x, Date.UTC(2021, 9, 1), "kept at its max");
    assert.strictEqual(after.events[after.events.length - 1].value, after.x);
  }));

it("lines that can't move get no handle", () =>
  withPage(box, async page => {
    const rows = [
      {id: "a", x: 1, y: 10, g: "one"},
      {id: "b", x: 2, y: 40, g: "two"},
    ];
    const count = async config => {
      await page.evaluate(start, ["Plot", JSON.stringify(config), "svg"]);
      await painted(page);
      return (await page.evaluate(state)).handles.length;
    };
    assert.strictEqual(
      await count({data: rows, groupBy: "id", referenceLines: [{y: 20}]}),
      0,
      "not draggable",
    );
    assert.strictEqual(
      await count({
        data: rows,
        groupBy: "id",
        referenceLines: [{y: "mean", draggable: true}],
      }),
      0,
      "a statistic",
    );
    assert.strictEqual(
      await count({
        data: rows,
        groupBy: "id",
        facet: "g",
        referenceLines: [{y: 20, draggable: true}],
      }),
      0,
      "small multiples",
    );
    assert.strictEqual(
      await count({
        data: sales,
        groupBy: "month",
        x: "month",
        y: "sales",
        referenceLines: [{x: "Feb", draggable: true}],
      }),
      0,
      "a category axis",
    );
  }));
