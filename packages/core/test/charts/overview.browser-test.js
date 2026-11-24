import {it} from "vitest";
import {commands, userEvent} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    An overview chart (`link: {group, zoom: "overview"}`) keeps its whole
    view and shows its group's window as a band: drawing, moving, and
    resizing the band with a real mouse, a touch drag, Ctrl + wheel, a
    double-click, and the keyboard all set the other charts' window, the
    band follows when another chart zooms, and a resize keeps it on the same
    dates. Both backends.
*/

const box = `
  <div id='main' style='width:600px;height:280px'></div>
  <div id='ov' style='width:600px;height:140px'></div>`;
const DAY = 864e5;

/** Draws a main LinePlot and an overview AreaPlot, on `window.main` and `window.ov`. */
function draw(renderer) {
  return render(
    box,
    async renderer => {
      const rows = [];
      for (let i = 0; i < 1000; i++)
        rows.push({
          id: "s",
          date: new Date(2021, 0, 1 + i),
          value: 100 + i / 5 + 20 * Math.sin(i / 30),
        });
      const make = (Chart, sel, config) =>
        new Promise(resolve => {
          const chart = new window.d3plus[Chart]()
            .data(rows)
            .groupBy("id")
            .x("date")
            .time("date")
            .y("value")
            .timeline(false)
            .legend(false)
            .duration(0)
            .config(config)
            .renderer(renderer);
          chart.select(sel).render(() => resolve(chart));
        });
      window.main = await make("LinePlot", "#main", {
        link: "ov-" + renderer,
        zoomAxes: ["x"],
      });
      window.ov = await make("AreaPlot", "#ov", {
        link: {group: "ov-" + renderer, zoom: "overview"},
      });
    },
    renderer,
  );
}

const frames = () =>
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const xOf = chart => chart._xAxis._d3Scale.domain().map(Number);
const overlay = () => document.querySelector("#ov .d3plus-overview");
const band = () => document.querySelector("#ov .d3plus-overview-band");
const rect = el => el.getBoundingClientRect();
const span = d => Math.abs(d[1] - d[0]);
/** The date under a point of the overlay, from the overview's own x axis. */
const dateAt = clientX => {
  const {ov} = window;
  const ct = ov._chartTransform;
  const host = ov._select.node().getBoundingClientRect();
  return +ov._xAxis._d3Scale.invert(clientX - host.left - ct.x);
};

async function realDrag(from, to) {
  await commands.mouseMove(from[0], from[1]);
  await commands.mouseDown();
  await commands.mouseMove((from[0] + to[0]) / 2, to[1], {steps: 3});
  await commands.mouseMove(to[0], to[1], {steps: 3});
  await commands.mouseUp();
  await frames();
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] drawing, moving, and resizing the band set the main chart's dates; the overview keeps its view`, async () => {
    await draw(renderer);
    const ovDomain = xOf(window.ov);
    const natural = xOf(window.main);
    const o = rect(overlay());
    const mid = o.top + o.height / 2;
    assert.strictEqual(band().getAttribute("role"), "slider");
    assert.strictEqual(band().getAttribute("aria-label"), "Zoom window");

    // Draw a window across a fifth of the overview.
    const x0 = o.left + o.width * 0.2,
      x1 = o.left + o.width * 0.4;
    await realDrag([x0, mid], [x1, mid]);
    const drawn = xOf(window.main);
    assert.ok(
      Math.abs(drawn[0] - dateAt(x0)) < 2 * DAY &&
        Math.abs(drawn[1] - dateAt(x1)) < 2 * DAY,
      "the main chart shows the drawn dates",
    );
    assert.deepStrictEqual(
      xOf(window.ov),
      ovDomain,
      "the overview keeps its view",
    );
    const b = rect(band());
    assert.ok(
      Math.abs(b.left - x0) < 2 && Math.abs(b.right - x1) < 2,
      "the band spans them",
    );
    assert.match(band().getAttribute("aria-valuetext"), / to /);

    // Move the band right by 60px: the window keeps its length.
    await realDrag(
      [b.left + b.width / 2, mid],
      [b.left + b.width / 2 + 60, mid],
    );
    const moved = xOf(window.main);
    assert.ok(moved[0] > drawn[0], "dragging the band moves the window");
    assert.ok(Math.abs(span(moved) - span(drawn)) < DAY, "keeping its length");

    // Drag the end edge out by 40px.
    const m = rect(band());
    await realDrag([m.right - 1, mid], [m.right + 40, mid]);
    const resized = xOf(window.main);
    assert.ok(Math.abs(resized[0] - moved[0]) < DAY, "the start stays");
    assert.ok(resized[1] > moved[1] + 10 * DAY, "the end moves out");

    // A double-click shows everything.
    overlay().dispatchEvent(
      new MouseEvent("dblclick", {bubbles: true, cancelable: true}),
    );
    await frames();
    assert.deepStrictEqual(xOf(window.main), natural, "a double-click resets");
    assert.deepStrictEqual(xOf(window.ov), ovDomain);
  });

  it(`[${renderer}] the band follows the main chart, and the keyboard moves and resizes it`, async () => {
    await draw(renderer);
    document.querySelector("#main .zoom-in").click();
    document.querySelector("#main .zoom-in").click();
    await frames();
    const main = xOf(window.main);
    const b = rect(band());
    assert.ok(
      Math.abs(dateAt(b.left) - main[0]) < 3 * DAY &&
        Math.abs(dateAt(b.right) - main[1]) < 3 * DAY,
      "the band shows the main chart's window",
    );
    band().focus();
    await userEvent.keyboard("{End}");
    await frames();
    const end = xOf(window.main);
    assert.ok(Math.abs(span(end) - span(main)) < DAY, "End keeps the length");
    assert.ok(end[1] > main[1], "and moves to the end");
    await userEvent.keyboard("+");
    await frames();
    const narrowed = xOf(window.main);
    assert.ok(
      Math.abs(span(narrowed) - span(end) / 2) < DAY,
      `+ halves the window (${span(narrowed) / DAY} of ${span(end) / DAY} days)`,
    );
    await userEvent.keyboard("{ArrowLeft}");
    await frames();
    assert.ok(xOf(window.main)[0] < narrowed[0], "ArrowLeft moves it earlier");
    const now = Number(band().getAttribute("aria-valuenow"));
    assert.ok(
      now > 50 && now <= 100,
      `aria-valuenow tracks its place (${now})`,
    );
  });
}

it("a touch drag and Ctrl + wheel on the overview set the window", async () => {
  await draw("svg");
  const o = rect(overlay());
  const mid = o.top + o.height / 2;
  const touch = (type, x) =>
    overlay().dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: "touch",
        clientX: x,
        clientY: mid,
        button: 0,
      }),
    );
  touch("pointerdown", o.left + 100);
  touch("pointermove", o.left + 160);
  touch("pointermove", o.left + 260);
  touch("pointerup", o.left + 260);
  await frames();
  const touched = xOf(window.main);
  assert.ok(
    Math.abs(touched[0] - dateAt(o.left + 100)) < 2 * DAY &&
      Math.abs(touched[1] - dateAt(o.left + 260)) < 2 * DAY,
    "a touch drag draws the window",
  );
  assert.strictEqual(
    overlay().style.touchAction,
    "pan-y",
    "vertical page scroll stays",
  );
  overlay().dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -100,
      clientX: o.left + 180,
      clientY: mid,
    }),
  );
  await frames();
  assert.ok(span(xOf(window.main)) < span(touched), "Ctrl + wheel narrows it");
});

it("a resize keeps the band on the same dates", async () => {
  await draw("svg");
  const o = rect(overlay());
  const mid = o.top + o.height / 2;
  await realDrag([o.left + 150, mid], [o.left + 300, mid]);
  const before = band().getAttribute("aria-valuetext");
  await new Promise(resolve => window.ov.width(450).render(resolve));
  await frames();
  assert.strictEqual(band().getAttribute("aria-valuetext"), before);
  assert.ok(rect(overlay()).width < o.width, "the overview got narrower");
});
