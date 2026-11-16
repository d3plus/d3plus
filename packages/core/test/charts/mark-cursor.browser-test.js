import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A chart with a click handler shows the hand cursor wherever a click acts
    on a mark: on a bar or anywhere in its slot, on a point or within
    `hoverDistance` of it, on a line, on a tile. Out of reach, and over axis
    tick labels and titles, the chart's title and its margins, it shows the
    default cursor, and so does the chart once a click has redrawn it, the
    pointer having left the clicked bar during the transition.
*/

const body = `
  <div id="layout" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>
  <div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Opens a page with the helpers the tests drive charts through. */
async function open() {
  const opened = await openPage(body);
  await opened.page.evaluate(() => {
    const bars = [
      {id: "a", x: "A", y: 10},
      {id: "b", x: "B", y: 40},
      {id: "c", x: "C", y: 25},
    ];
    const click = () => window.__clicks++;
    // Built in the page's realm, where config bags merge as plain objects.
    window.CHARTS = {
      bar: () => [
        "BarChart",
        {
          data: bars,
          groupBy: "id",
          x: "x",
          y: "y",
          xConfig: {title: "Category"},
          yConfig: {title: "Amount"},
          duration: 0,
          on: {click},
        },
      ],
      redraw: () => [
        "BarChart",
        {
          data: bars,
          groupBy: "id",
          x: "x",
          y: "y",
          xConfig: {title: "Category"},
          yConfig: {title: "Amount"},
          duration: 600,
          on: {
            click() {
              this.config({
                data: bars.map(d => ({...d, x: `${d.x}2`, y: d.y / 2})),
              }).render();
            },
          },
        },
      ],
      scatter: () => [
        "Plot",
        {
          data: [
            {id: "p", x: 10, y: 10},
            {id: "q", x: 50, y: 40},
            {id: "r", x: 90, y: 20},
          ],
          groupBy: "id",
          x: "x",
          y: "y",
          legend: false,
          duration: 0,
          on: {click},
        },
      ],
      line: () => [
        "LinePlot",
        {
          data: [
            {id: "s", x: 0, y: 5},
            {id: "s", x: 1, y: 5},
            {id: "s", x: 2, y: 5},
            {id: "s", x: 3, y: 5},
            {id: "t", x: 0, y: 1},
            {id: "t", x: 3, y: 1},
          ],
          groupBy: "id",
          x: "x",
          y: "y",
          yConfig: {domain: [0, 20]},
          legend: false,
          duration: 0,
          on: {click},
        },
      ],
      treemap: () => [
        "Treemap",
        {
          data: [
            {id: "u", value: 30},
            {id: "v", value: 20},
          ],
          groupBy: "id",
          sum: "value",
          title: "Shares",
          legend: false,
          duration: 0,
          on: {click},
        },
      ],
    };
    window.__clicks = 0;
    // Draws the chart named `name` into `sel`, in place of the one last
    // drawn in #viz.
    window.make = (name, renderer, sel = "#viz") =>
      new Promise(resolve => {
        if (sel === "#viz" && window.__viz) window.__viz.destroy();
        const [chart, config] = window.CHARTS[name]();
        const viz = new window.d3plus[chart]()
          .config(config)
          .renderer(renderer)
          .select(sel);
        if (sel === "#viz") window.__viz = viz;
        viz.render(() => resolve(viz));
      });
    // The chart's marks (a series' points for a line), keyed by datum id,
    // with their client-space centers and boxes.
    window.marks = () => {
      const viz = window.__viz;
      const surface = document
        .querySelector("#viz svg, #viz canvas")
        .getBoundingClientRect();
      const out = {};
      for (const t of window.d3plus.focusTargets(
        viz._paintedScene.root.children,
      )) {
        if (t.group !== "shape") continue;
        const id = t.node.datum?.data?.id ?? t.node.datum?.id;
        out[`${id}${t.pointIndex === undefined ? "" : `@${t.pointIndex}`}`] = {
          x: surface.left + t.center[0],
          y: surface.top + t.center[1],
          width: t.box.width,
          height: t.box.height,
          top: surface.top + t.box.y,
        };
      }
      return out;
    };
    // Client coordinates of the text `label`, read from the same chart laid
    // out in SVG, whose layout a canvas chart shares.
    window.textPoint = async (name, label) => {
      const twin = await window.make(name, "svg", "#layout");
      const text = [...document.querySelectorAll("#layout text")].find(
        t => t.textContent.trim() === label,
      );
      const box = text.getBoundingClientRect();
      twin.destroy();
      document.querySelector("#layout").innerHTML = "";
      return [box.left + box.width / 2, box.top + box.height / 2];
    };
    // The cursor of the element under a point, and the tooltips showing.
    window.state = ([x, y]) => ({
      cursor: getComputedStyle(document.elementFromPoint(x, y)).cursor,
      tooltips: [...document.querySelectorAll(".d3plus-tooltip")]
        .filter(t => getComputedStyle(t).visibility === "visible")
        .map(t => t.querySelector(".d3plus-tooltip-title").textContent.trim()),
    });
  });
  return opened;
}

/** Moves the real pointer to a point and reads the state there. */
async function hover(page, point, wait = 120) {
  await page.mouse.move(point[0], point[1], {steps: 4});
  await page.waitForTimeout(wait);
  return page.evaluate(point => window.state(point), point);
}

/** Draws a chart and returns its marks. */
async function draw(page, name, renderer) {
  await page.evaluate(
    ([name, renderer]) => window.make(name, renderer).then(() => null),
    [name, renderer],
  );
  await page.mouse.move(598, 2);
  return page.evaluate(() => window.marks());
}

for (const renderer of ["svg", "canvas"]) {
  it(`mark cursor (${renderer}): a BarChart shows the hand over its bars and their slots`, async () => {
    const {page, close} = await open();
    try {
      const chrome = {};
      for (const label of ["A", "Category", "Amount", "20"])
        chrome[label] = await page.evaluate(
          label => window.textPoint("bar", label),
          label,
        );
      const {a} = await draw(page, "bar", renderer);
      const onBar = [a.x, a.y];
      assert.deepStrictEqual(await hover(page, onBar), {
        cursor: "pointer",
        tooltips: ["a"],
      });

      // The bar's slot above it takes its hover, its click and the hand.
      const slot = [a.x, a.top - 40];
      assert.deepStrictEqual(
        await hover(page, slot),
        {cursor: "pointer", tooltips: ["a"]},
        "above the bar",
      );
      await page.mouse.click(...slot);
      await page.waitForTimeout(60);
      assert.strictEqual(await page.evaluate(() => window.__clicks), 1);

      const places = {
        "a tick label": chrome.A,
        "the x axis title": chrome.Category,
        "the y axis title": chrome.Amount,
        "a y tick label": chrome["20"],
        "the margin": [598, 2],
      };
      for (const [place, point] of Object.entries(places)) {
        assert.strictEqual((await hover(page, onBar)).cursor, "pointer");
        assert.strictEqual((await hover(page, point)).cursor, "auto", place);
      }
    } finally {
      await close();
    }
  });

  it(`mark cursor (${renderer}): a click that redraws the chart leaves no hand behind`, async () => {
    const {page, close} = await open();
    try {
      const title = await page.evaluate(
        () => window.textPoint("redraw", "Amount"),
        null,
      );
      const {b} = await draw(page, "redraw", renderer);
      await page.waitForTimeout(700);
      assert.strictEqual((await hover(page, [b.x, b.y])).cursor, "pointer");
      await page.mouse.click(b.x, b.y);
      // The pointer leaves the bar while the redraw animates.
      await page.mouse.move(title[0], title[1], {steps: 4});
      assert.ok(
        await page.evaluate(() => window.__viz._transitionEndsAt > Date.now()),
        "mid-transition",
      );
      await page.waitForTimeout(800);
      assert.strictEqual(
        await page.evaluate(point => window.state(point).cursor, title),
        "auto",
      );
    } finally {
      await close();
    }
  });

  it(`mark cursor (${renderer}): a point shows the hand within reach, not past it`, async () => {
    const {page, close} = await open();
    try {
      const {q} = await draw(page, "scatter", renderer);
      assert.deepStrictEqual(await hover(page, [q.x, q.y]), {
        cursor: "pointer",
        tooltips: ["q"],
      });
      const beside = [q.x + q.width / 2 + 10, q.y];
      assert.deepStrictEqual(
        await hover(page, beside),
        {cursor: "pointer", tooltips: ["q"]},
        "within hoverDistance",
      );
      await page.mouse.click(...beside);
      await page.waitForTimeout(60);
      assert.strictEqual(
        await page.evaluate(() => window.__clicks),
        1,
        "the click reaches the point",
      );
      assert.deepStrictEqual(
        await hover(page, [q.x, q.y + 80]),
        {cursor: "auto", tooltips: []},
        "out of reach",
      );
    } finally {
      await close();
    }
  });

  it(`mark cursor (${renderer}): a LinePlot shows the hand on a line, not the plot beside it`, async () => {
    const {page, close} = await open();
    try {
      const marks = await draw(page, "line", renderer);
      const on = [marks["s@1"].x, marks["s@1"].y];
      assert.deepStrictEqual(await hover(page, on), {
        cursor: "pointer",
        tooltips: ["s"],
      });
      assert.strictEqual(
        (await hover(page, [on[0], on[1] - 80])).cursor,
        "auto",
        "the empty plot above the line",
      );
      assert.strictEqual((await hover(page, on)).cursor, "pointer");
      assert.strictEqual((await hover(page, [598, 2])).cursor, "auto");
    } finally {
      await close();
    }
  });

  it(`mark cursor (${renderer}): a Treemap shows the hand on a tile, not its title`, async () => {
    const {page, close} = await open();
    try {
      const title = await page.evaluate(
        () => window.textPoint("treemap", "Shares"),
        null,
      );
      const {u} = await draw(page, "treemap", renderer);
      assert.deepStrictEqual(await hover(page, [u.x, u.y]), {
        cursor: "pointer",
        tooltips: ["u"],
      });
      assert.strictEqual((await hover(page, title)).cursor, "auto");
      assert.strictEqual((await hover(page, [u.x, u.y])).cursor, "pointer");
      assert.strictEqual((await hover(page, [598, 2])).cursor, "auto");
    } finally {
      await close();
    }
  });
}
