import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    The zoom options for charts that zoom without the zoom-control buttons
    (#1129), in Chromium on SVG and Canvas with a real mouse:
    `zoomControls: false` hides the buttons and frees their room while the
    wheel still zooms; `zoomDrag: "brush"` draws a box on a drag and zooms
    into it, while a click still clicks and hover still shows tooltips;
    `zoomDoubleClick` zooms in, resets, or does nothing; and the chart's
    `zoomIn`/`zoomOut`/`zoomReset`/`zoomBrush` methods act as the buttons do.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

/** Runs in the page: draws a Treemap from JSON config, logging shape clicks. */
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    window.__clicks = [];
    const viz = new window.d3plus.Treemap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data([
        {id: "alpha", value: 6},
        {id: "beta", value: 3},
        {id: "gamma", value: 1},
      ])
      .groupBy("id")
      .sum("value")
      .legend(false)
      .zoomMax(16)
      .config(JSON.parse(json))
      .on("click.shape", d => window.__clicks.push(d.id));
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/**
    Runs in the page: the visible tooltips' text, the zoom scale, brush mode,
    whether the zoom brush's box shows, the clicks so far, and the client
    center of the rect drawn for `id`.
*/
const state = id => {
  const viz = window.__viz;
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const host =
    document.querySelector("#viz canvas") || document.querySelector("#viz svg");
  const rect = host.getBoundingClientRect();
  let at = null;
  const walk = (n, x, y, k) => {
    const t = n.transform || {};
    const nx = x + k * (t.x || 0),
      ny = y + k * (t.y || 0),
      nk = k * (t.scale ?? 1);
    const d = n.datum && (n.datum.data || n.datum);
    if (!at && n.type === "rect" && d && d.id === id)
      at = [
        rect.left + nx + nk * (n.x + n.width / 2),
        rect.top + ny + nk * (n.y + n.height / 2),
      ];
    (n.children || []).forEach(c => walk(c, nx, ny, nk));
  };
  walk(viz._paintedScene.root, 0, 0, 1);
  const brush = document.querySelector("#viz g.d3plus-zoom-brush");
  const selection = brush && brush.querySelector(".selection");
  const t = viz._zoomTransform;
  return {
    tips,
    scale: t ? t.scale : 1,
    x: t ? t.x : 0,
    y: t ? t.y : 0,
    brushing: viz.zoomBrush(),
    boxShown: Boolean(
      brush &&
      brush.style.display !== "none" &&
      selection &&
      selection.style.display !== "none" &&
      Number(selection.getAttribute("width")) > 0,
    ),
    clicks: window.__clicks.slice(),
    at,
    surface: [rect.left, rect.top],
    area: viz._zoomBehavior.extent().bind(document)(),
  };
};

/** Runs in the page: the cursor shown at a client point. */
const cursorAt = ([x, y]) =>
  getComputedStyle(document.elementFromPoint(x, y)).cursor;

/** Hovers `id`'s rect, asserting its tooltip shows. */
async function hover(page, id) {
  const {at} = await page.evaluate(state, id);
  assert.ok(at, `${id} is drawn`);
  await page.mouse.move(at[0] - 2, at[1]);
  await page.mouse.move(...at, {steps: 2});
  await page.waitForTimeout(60);
  const s = await page.evaluate(state, id);
  assert.ok(
    s.tips.some(t => t.includes(id)),
    `hovering shows ${id}'s tooltip (got ${JSON.stringify(s.tips)})`,
  );
  return at;
}

/** Runs in the page: a ctrl + wheel zoom at a client point. */
const wheel = at =>
  new Promise(resolve => {
    document.elementFromPoint(...at).dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientX: at[0],
        clientY: at[1],
        ctrlKey: true,
        deltaY: -100,
      }),
    );
    setTimeout(resolve, 300);
  });

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: zoomControls false hides the buttons and the wheel still zooms`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({zoomControls: false, title: "Title"}),
        renderer,
      ]);
      const count = await page.evaluate(
        () => document.querySelectorAll("#viz .zoom-control").length,
      );
      assert.strictEqual(count, 0, "no zoom-control buttons");
      const {at} = await page.evaluate(state, "alpha");
      await page.evaluate(wheel, at);
      const s = await page.evaluate(state, "alpha");
      assert.ok(s.scale > 1, `the wheel zooms in (scale ${s.scale})`);
      const minimap = await page.evaluate(() => {
        const el = document.querySelector("#viz .d3plus-minimap");
        const host = document.querySelector("#viz canvas, #viz svg");
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const h = host.getBoundingClientRect();
        return {
          opacity: parseFloat(getComputedStyle(el).opacity),
          top: r.top - h.top,
          right: h.right - r.right,
          areaTop: window.__viz._margin.top,
        };
      });
      assert.ok(minimap, "the minimap still shows once zoomed in");
      assert.ok(minimap.opacity > 0.5, "visibly");
      assert.ok(
        minimap.top >= minimap.areaTop && minimap.top < minimap.areaTop + 10,
        "at the top of the chart area",
      );
      assert.ok(minimap.right < 10, "in its right corner");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: zoomDrag brush zooms into a dragged box, and clicks and hover still reach shapes`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({zoomControls: false, zoomDrag: "brush"}),
        renderer,
      ]);
      const at = await hover(page, "alpha");

      // A click that doesn't drag clicks the shape and leaves the zoom.
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(60);
      let s = await page.evaluate(state, "alpha");
      assert.deepStrictEqual(s.clicks, ["alpha"], "the click reaches alpha");
      assert.strictEqual(s.scale, 1, "a click doesn't zoom");

      // A drag draws the box, hiding the tooltip under a crosshair.
      const [dx, dy] = [90, 60];
      await page.mouse.down();
      await page.mouse.move(at[0] + dx, at[1] + dy, {steps: 10});
      await page.waitForTimeout(60);
      s = await page.evaluate(state, "alpha");
      assert.ok(s.boxShown, "the box shows while dragging");
      assert.deepStrictEqual(s.tips, [], "no tooltip mid-drag");
      assert.strictEqual(
        await page.evaluate(cursorAt, [at[0] + dx, at[1] + dy]),
        "crosshair",
        "a crosshair while drawing the box",
      );
      assert.strictEqual(s.scale, 1, "no zoom before letting go");

      await page.mouse.up();
      await page.waitForTimeout(100);
      s = await page.evaluate(state, "alpha");
      assert.ok(!s.boxShown, "the box hides on release");
      assert.strictEqual(s.brushing, false, "brush mode stays off");
      assert.deepStrictEqual(s.clicks, ["alpha"], "the drag clicks nothing");
      // The box fills the chart area, less zoomPadding (20), and shows whole.
      const [[x0, y0], [x1, y1]] = s.area;
      const k = Math.min((x1 - x0 - 40) / dx, (y1 - y0 - 40) / dy);
      assert.ok(Math.abs(s.scale - k) < 0.01, `zooms to the box (${s.scale})`);
      const [bx, by] = [at[0] - s.surface[0], at[1] - s.surface[1]];
      for (const [px, py] of [
        [bx, by],
        [bx + dx, by + dy],
      ])
        assert.ok(
          s.x + s.scale * px >= x0 - 1 &&
            s.x + s.scale * px <= x1 + 1 &&
            s.y + s.scale * py >= y0 - 1 &&
            s.y + s.scale * py <= y1 + 1,
          "the box shows within the chart area",
        );

      // The next move hovers again.
      const {at: moved} = await page.evaluate(state, "alpha");
      await page.mouse.move(at[0], at[1] + 1);
      await page.waitForTimeout(60);
      s = await page.evaluate(state, "alpha");
      assert.ok(s.tips.length === 1, "hover shows a tooltip again");
      assert.ok(moved, "alpha is still drawn");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: zoomDrag brush pans on Shift + drag`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({zoomDrag: "brush"}),
        renderer,
      ]);
      await page.evaluate(() => window.__viz.zoomIn());
      const before = await page.evaluate(state, "alpha");
      await page.evaluate(([x, y]) => {
        const target = document.elementFromPoint(x, y);
        const fire = (type, el, dx) =>
          el.dispatchEvent(
            new MouseEvent(type, {
              bubbles: true,
              cancelable: true,
              view: window,
              button: 0,
              detail: 1,
              shiftKey: true,
              clientX: x + dx,
              clientY: y,
            }),
          );
        fire("mousedown", target, 0);
        fire("mousemove", window, 20);
        fire("mousemove", window, 40);
        fire("mouseup", window, 40);
      }, before.at);
      await page.waitForTimeout(60);
      const after = await page.evaluate(state, "alpha");
      assert.strictEqual(after.scale, before.scale, "the zoom stays");
      assert.ok(
        Math.abs(after.x - before.x - 40) < 1,
        `Shift + drag pans (${before.x} → ${after.x})`,
      );
      assert.ok(!after.boxShown, "no box");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: zoomDoubleClick zooms in, resets, or does nothing`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      // Double-clicks the middle of the chart area (a shape's center may
      // be out of view once zoomed in).
      const doubleClick = async () => {
        const {area, surface} = await page.evaluate(state, "alpha");
        const [[x0, y0], [x1, y1]] = area;
        await page.mouse.click(
          surface[0] + (x0 + x1) / 2,
          surface[1] + (y0 + y1) / 2,
          {clickCount: 2},
        );
        await page.waitForTimeout(400);
        return (await page.evaluate(state, "alpha")).scale;
      };

      await page.evaluate(draw, ["{}", renderer]);
      assert.strictEqual(await doubleClick(), 2, '"in" doubles the zoom');

      const redraw = mode =>
        page.evaluate(
          m =>
            new Promise(resolve =>
              window.__viz.zoomDoubleClick(m).render(() => resolve(true)),
            ),
          mode,
        );
      await redraw("reset");
      await page.evaluate(() => window.__viz.zoomIn().zoomIn());
      assert.ok((await page.evaluate(state, "alpha")).scale > 2);
      assert.strictEqual(await doubleClick(), 1, '"reset" resets');

      await redraw(false);
      assert.strictEqual(await doubleClick(), 1, "false does nothing");
      await page.evaluate(() => window.__viz.zoomIn());
      assert.strictEqual(await doubleClick(), 2, "false keeps the zoom");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: zoomIn, zoomOut, zoomReset, and zoomBrush act as the buttons do`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        JSON.stringify({zoomControls: false}),
        renderer,
      ]);
      const scale = () =>
        page.evaluate(() => {
          const t = window.__viz._zoomTransform;
          return t ? t.scale : 1;
        });
      await page.evaluate(() => window.__viz.zoomIn());
      assert.strictEqual(await scale(), 2, "zoomIn zooms by zoomFactor");
      await page.evaluate(() => window.__viz.zoomIn());
      assert.strictEqual(await scale(), 4);
      await page.evaluate(() => window.__viz.zoomOut());
      assert.strictEqual(await scale(), 2, "zoomOut zooms out by zoomFactor");
      await page.evaluate(() => window.__viz.zoomReset());
      assert.strictEqual(await scale(), 1, "zoomReset resets");
      await page.evaluate(() => window.__viz.zoomFactor(3).zoomIn());
      assert.strictEqual(await scale(), 3, "zoomIn follows zoomFactor");
      await page.evaluate(() => window.__viz.zoomReset());

      // zoomBrush turns brush mode on: a drag anywhere draws the box.
      const on = await page.evaluate(() => {
        const viz = window.__viz;
        const chained = viz.zoomBrush(true) === viz;
        return {chained, brushing: viz.zoomBrush()};
      });
      assert.ok(on.chained, "zoomBrush(true) chains");
      assert.strictEqual(on.brushing, true, "brush mode is on");
      const {at} = await page.evaluate(state, "alpha");
      await page.mouse.move(...at);
      await page.mouse.down();
      await page.mouse.move(at[0] + 80, at[1] + 60, {steps: 8});
      await page.mouse.up();
      await page.waitForTimeout(100);
      let s = await page.evaluate(state, "alpha");
      assert.ok(s.scale > 1, "the brushed box zooms");
      assert.strictEqual(s.brushing, false, "and brush mode ends");
      assert.deepStrictEqual(s.clicks, [], "brushing clicks nothing");

      await page.evaluate(() => window.__viz.zoomBrush(true).zoomBrush(false));
      s = await page.evaluate(state, "alpha");
      assert.strictEqual(s.brushing, false, "zoomBrush(false) turns it off");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: zoomBrush keeps the brush button in step`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, ["{}", renderer]);
      const pressed = () =>
        page.evaluate(() =>
          document
            .querySelector("#viz .zoom-brush")
            .getAttribute("aria-pressed"),
        );
      await page.evaluate(() => window.__viz.zoomBrush(true));
      assert.strictEqual(await pressed(), "true", "the button reports it on");
      await page.evaluate(() => window.__viz.zoomBrush(false));
      assert.strictEqual(await pressed(), "false", "and off");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: the zoom methods do nothing with zoom off`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify({zoom: false}), renderer]);
      const out = await page.evaluate(() => {
        const viz = window.__viz;
        const chained =
          viz.zoomIn() === viz &&
          viz.zoomOut() === viz &&
          viz.zoomReset() === viz &&
          viz.zoomBrush(true) === viz;
        return {
          chained,
          transform: viz._zoomTransform ?? null,
          brushing: viz.zoomBrush(),
        };
      });
      assert.ok(out.chained, "each still chains");
      assert.strictEqual(out.transform, null, "no zoom");
      assert.strictEqual(out.brushing, false, "no brush mode");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`${renderer}: Network with zoomDrag brush zooms into a dragged box and keeps its click focus`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(
        r =>
          new Promise(resolve => {
            const viz = new window.d3plus.Network()
              .select("#viz")
              .renderer(r)
              .duration(0)
              .nodes([
                {id: "A", x: 0, y: 0},
                {id: "B", x: 200, y: 0},
                {id: "C", x: 0, y: 120},
                {id: "D", x: 200, y: 120},
              ])
              .links([
                {source: "A", target: "B"},
                {source: "A", target: "C"},
                {source: "C", target: "D"},
              ])
              .legend(false)
              .zoomControls(false)
              .zoomDrag("brush");
            window.__viz = viz;
            viz.render(() => resolve(true));
          }),
        renderer,
      );
      const net = () =>
        page.evaluate(() => {
          const viz = window.__viz;
          const host = document.querySelector("#viz canvas, #viz svg");
          const rect = host.getBoundingClientRect();
          const [[x0, y0], [x1, y1]] = viz._zoomBehavior
            .extent()
            .bind(document)();
          const t = viz._zoomTransform;
          let a = null;
          const walk = (n, x, y, k) => {
            const tt = n.transform || {};
            const nx = x + k * (tt.x || 0),
              ny = y + k * (tt.y || 0),
              nk = k * (tt.scale ?? 1);
            const d = n.datum && (n.datum.data || n.datum);
            if (!a && n.type === "circle" && d && d.id === "A")
              a = [rect.left + nx + nk * n.cx, rect.top + ny + nk * n.cy];
            (n.children || []).forEach(c => walk(c, nx, ny, nk));
          };
          walk(viz._paintedScene.root, 0, 0, 1);
          return {
            focus: viz._focus ?? null,
            scale: t ? t.scale : 1,
            a,
            center: [rect.left + (x0 + x1) / 2, rect.top + (y0 + y1) / 2],
          };
        });

      let s = await net();
      await page.mouse.click(...s.a);
      await page.waitForTimeout(100);
      s = await net();
      assert.strictEqual(s.focus, "A", "a click focuses A");
      const focused = s.scale;

      // A drag over empty space zooms to the box; its release isn't a
      // background click, so A keeps the focus.
      await page.evaluate(() => window.__viz.zoomReset());
      s = await net();
      await page.mouse.move(...s.center);
      await page.mouse.down();
      await page.mouse.move(s.center[0] + 60, s.center[1] + 40, {steps: 8});
      await page.mouse.up();
      await page.waitForTimeout(100);
      s = await net();
      assert.ok(s.scale > 1, `the box zooms (scale ${s.scale})`);
      assert.notStrictEqual(s.scale, focused, "to the box, not to A");
      assert.strictEqual(s.focus, "A", "A keeps the focus");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}

it("zoomControls false gives the buttons' room back to a title", async () => {
  const {page, errors, close} = await openPage(box);
  try {
    const title =
      "A long title that would otherwise wrap short of the zoom controls in the corner";
    const measure = controls =>
      page.evaluate(
        ([t, c]) =>
          new Promise(resolve => {
            document.querySelector("#viz").innerHTML = "";
            const viz = new window.d3plus.Treemap()
              .select("#viz")
              .duration(0)
              .title(t)
              .zoomControls(c)
              .data([
                {id: "alpha", value: 6},
                {id: "beta", value: 3},
              ])
              .groupBy("id")
              .sum("value")
              .legend(false);
            viz.render(() => {
              const buttons = [
                ...document.querySelectorAll("#viz .zoom-control"),
              ].map(b => b.getBoundingClientRect().left);
              const rect = document
                .querySelector('#viz [data-key="viz-title"]')
                .getBoundingClientRect();
              resolve({
                right: rect.right,
                width: rect.width,
                panelLeft: buttons.length ? Math.min(...buttons) : null,
              });
            });
          }),
        [title, controls],
      );
    const shown = await measure(true);
    const hidden = await measure(false);
    assert.ok(shown.panelLeft !== null, "the buttons show by default");
    assert.ok(shown.right <= shown.panelLeft, "the title wraps short of them");
    assert.strictEqual(hidden.panelLeft, null, "no buttons");
    assert.ok(
      hidden.width > shown.width,
      `without them the title takes their room (${hidden.width} > ${shown.width})`,
    );
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
});
