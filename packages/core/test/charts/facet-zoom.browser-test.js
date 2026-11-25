import {it} from "vitest";
import {commands, userEvent} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Small multiples of a Plot zoom the panel under the pointer: Ctrl + wheel,
    a drag, and a double-click set that panel's window (every panel's, when
    they share scales), the zoom buttons (by pointer or keyboard) zoom every
    panel, reset returns them all, and a linked chart follows the panel
    zoomed. Both backends.
*/

const box = `
  <div id='viz' style='width:700px;height:420px'></div>
  <div id='linked' style='width:700px;height:200px'></div>`;

/** Draws two panels (a: 400 days, b: 300 days) on `window.chart`, and a linked LinePlot on `window.linked`. */
function draw(renderer, extra = {}) {
  return render(
    box,
    async ({renderer, extra}) => {
      const rows = [];
      ["a", "b"].forEach((id, p) => {
        for (let i = 0; i < 400 - p * 100; i++)
          rows.push({
            id,
            date: new Date(2023, 0, 1 + i),
            value: 50 + Math.sin(i / 9) * 10 + p * 30,
          });
      });
      const make = (sel, config) =>
        new Promise(resolve => {
          const chart = new window.d3plus.LinePlot()
            .groupBy("id")
            .x("date")
            .time("date")
            .y("value")
            .timeline(false)
            .legend(false)
            .duration(0)
            .zoomAxes("x")
            .link("facets-" + renderer)
            .config(config)
            .renderer(renderer);
          chart.select(sel).render(() => resolve(chart));
        });
      window.chart = await make("#viz", {data: rows, facet: "id", ...extra});
      window.linked = await make("#linked", {
        data: rows.filter(d => d.id === "a"),
      });
    },
    {renderer, extra},
  );
}

const frames = async () => {
  for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
};
/** Each panel's line: the span of its points (wider once zoomed), and its first point. */
const lines = () =>
  window.chart._facetPanels.map(p => {
    let pts = [];
    const walk = n => {
      if (n.interactionPoints && n.interactionPoints.length > pts.length)
        pts = n.interactionPoints;
      (n.children || []).forEach(walk);
    };
    p.scene.forEach(walk);
    const xs = pts.map(q => q.x);
    return {span: Math.max(...xs) - Math.min(...xs), first: xs[0]};
  });
/** A panel's middle, in client pixels. */
const middle = i => {
  const {area} = window.chart._facetPanels[i];
  const host = window.chart._select.node().getBoundingClientRect();
  return [
    host.left + area.x + area.width / 2,
    host.top + area.y + area.height / 2,
  ];
};
const surface = () =>
  (window.chart._zoomEventTarget || window.chart._container).node();
const wheel = (i, deltaY = -300) => {
  const [x, y] = middle(i);
  surface().dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY,
      clientX: x,
      clientY: y,
    }),
  );
};
const xDomain = chart => chart._xAxis._d3Scale.domain().map(Number);

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] with independent scales, Ctrl + wheel, a drag, and a double-click zoom only the panel under the pointer`, async () => {
    await draw(renderer, {facetConfig: {scales: "independent"}});
    const before = lines();
    wheel(0);
    await frames();
    const wheeled = lines();
    assert.ok(wheeled[0].span > before[0].span * 1.5, "panel a zooms");
    assert.ok(
      Math.abs(wheeled[1].span - before[1].span) < 1,
      "panel b doesn't",
    );
    assert.deepStrictEqual(Object.keys(window.chart._facetZoom.panels), [
      window.chart._facetPanels[0].key,
    ]);

    // A real mouse drag pans panel a.
    const [x, y] = middle(0);
    await commands.mouseMove(x, y);
    await commands.mouseDown();
    await commands.mouseMove(x + 40, y, {steps: 3});
    await commands.mouseMove(x + 80, y, {steps: 3});
    await commands.mouseUp();
    await frames();
    const panned = lines();
    assert.ok(panned[0].first > wheeled[0].first + 40, "dragging pans panel a");
    assert.ok(
      Math.abs(panned[0].span - wheeled[0].span) < 1,
      "at the same zoom",
    );

    // A double-click zooms panel b in.
    const [bx, by] = middle(1);
    surface().dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        clientX: bx,
        clientY: by,
      }),
    );
    await frames();
    assert.ok(
      lines()[1].span > before[1].span * 1.5,
      "a double-click zooms panel b",
    );
  });
}

it("with shared scales, zooming one panel zooms them all, and a linked chart follows", async () => {
  await draw("svg");
  const before = lines();
  const linkedBefore = xDomain(window.linked);
  wheel(1);
  await frames();
  const after = lines();
  assert.ok(after[0].span > before[0].span * 1.5, "panel a zooms too");
  assert.ok(after[1].span > before[1].span * 1.5, "panel b zooms");
  assert.ok(window.chart._facetZoom.windows, "as one shared window");
  const linked = xDomain(window.linked);
  assert.ok(
    linked[1] - linked[0] < (linkedBefore[1] - linkedBefore[0]) / 1.5,
    "the linked chart follows",
  );
});

it("the zoom buttons, by pointer or keyboard, zoom every panel, and reset returns them", async () => {
  await draw("svg", {facetConfig: {scales: "independent"}});
  const before = lines();
  document.querySelector("#viz .zoom-in").click();
  await frames();
  const zoomed = lines();
  assert.ok(
    zoomed.every((l, i) => l.span > before[i].span * 1.5),
    "both zoom",
  );
  document.querySelector("#viz .zoom-in").focus();
  await userEvent.keyboard("{Enter}");
  await frames();
  const twice = lines();
  assert.ok(
    twice[0].span > zoomed[0].span * 1.5,
    "Enter on the button zooms again",
  );
  document.querySelector("#viz .zoom-reset").click();
  await frames();
  const reset = lines();
  assert.ok(
    reset.every((l, i) => Math.abs(l.span - before[i].span) < 1),
    "reset returns every panel",
  );
  assert.strictEqual(window.chart._facetZoom, undefined);
});

it("a plain wheel scrolls the page; the minimap doesn't show for small multiples", async () => {
  await draw("svg");
  const before = lines();
  const [x, y] = middle(0);
  const event = new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaY: -300,
    clientX: x,
    clientY: y,
  });
  surface().dispatchEvent(event);
  await frames();
  assert.strictEqual(event.defaultPrevented, false);
  assert.ok(Math.abs(lines()[0].span - before[0].span) < 1);
  wheel(0);
  await frames();
  assert.strictEqual(document.querySelector("#viz .d3plus-minimap"), null);
});
