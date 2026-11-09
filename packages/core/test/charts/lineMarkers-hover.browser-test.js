import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    #1112: a Plot drawn as a Line with `lineMarkers` keys each marker by its
    series and position, so hovering a marker reports that point (tooltip and
    axis badges) rather than the series' last one. A plain Plot has no
    discrete axis, and this series repeats x = 5.
*/

const data = [
  {id: "alpha", x: 4, y: 7},
  {id: "alpha", x: 5, y: 2},
  {id: "alpha", x: 6, y: 13},
  {id: "alpha", x: 2, y: 11},
  {id: "alpha", x: 5, y: 5},
  {id: "alpha", x: 3, y: 4},
  {id: "alpha", x: 2.5, y: 6},
  {id: "alpha", x: 5.5, y: 9},
];

/** Renders the issue's chart into a 600×400 #viz, kept as `window.__viz`. */
async function chart(renderer) {
  const opened = await openPage(
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([data, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.Plot()
          .data(data)
          .groupBy("id")
          .x("x")
          .y("y")
          .shape("Line")
          .lineMarkers(true);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [data, renderer],
  );
  return opened;
}

/** Each marker's key, point, and client coordinates. */
function markers(page, renderer) {
  return page.evaluate(renderer => {
    const viz = window.__viz;
    const out = [];
    const walk = nodes =>
      nodes.forEach(n => {
        if (n.shapeType === "Circle" && n.type === "circle") out.push(n);
        if (n.children) walk(n.children);
      });
    walk(viz._chartScene);
    const surface = document
      .querySelector(`#viz ${renderer}`)
      .getBoundingClientRect();
    const c = viz._chartTransform || {x: 0, y: 0};
    return out.map(n => ({
      key: n.key,
      x: n.datum.x,
      y: n.datum.y,
      at: [
        surface.left + c.x + (n.transform?.x ?? 0) + n.cx,
        surface.top + c.y + (n.transform?.y ?? 0) + n.cy,
      ],
    }));
  }, renderer);
}

/** The axis badges' text, by axis. */
function badges(page) {
  return page.evaluate(() => {
    const out = {};
    const walk = nodes =>
      nodes.forEach(n => {
        const badge = `${n.key}`.match(/plot-axis-hover-badge-(\w+)$/);
        if (badge) out[badge[1]] = n.children[1].lines[0].text;
        if (n.children) walk(n.children);
      });
    walk([window.__viz._paintedScene.root]);
    return out;
  });
}

describe.each(["svg", "canvas"])("lineMarkers hover (%s)", renderer => {
  it("each marker has its own key", async () => {
    const {page, close} = await chart(renderer);
    try {
      const keys = (await markers(page, renderer)).map(m => m.key);
      assert.strictEqual(keys.length, data.length, "one marker per point");
      assert.strictEqual(new Set(keys).size, keys.length, "unique keys");
    } finally {
      await close();
    }
  });

  it("hovering a marker reports that point", async () => {
    const {page, close} = await chart(renderer);
    try {
      for (const m of await markers(page, renderer)) {
        await page.mouse.move(5, 5);
        await page.mouse.move(m.at[0], m.at[1], {steps: 3});
        await page.waitForTimeout(80);
        assert.deepStrictEqual(
          await badges(page),
          {x: `${m.x}`, y: `${m.y}`},
          `the ${m.x}, ${m.y} marker`,
        );
      }
    } finally {
      await close();
    }
  });
});
