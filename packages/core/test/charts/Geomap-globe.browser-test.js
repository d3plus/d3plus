import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Dragging a Geomap globe in Chromium, on SVG and Canvas with a real
    mouse: the drag turns the globe (bringing a far-side point into view),
    a drag that ends on a link doesn't click it, and a flat map still pans.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const data = [
  {id: "NYC", name: "New York", point: [-74, 40.7]},
  {id: "PAR", name: "Paris", point: [2.35, 48.9]},
  // Just past the horizon of a globe centered on New York.
  {id: "EQ", name: "Far", point: [22.6, 0]},
];
const links = [{source: "NYC", target: "PAR"}];

/** Runs in the page: draws the map from JSON config, resolving once painted. */
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Geomap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config(JSON.parse(json))
      .label(d => d.name)
      .point(d => d.point);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the painted keys, the rotation, and the zoom transform. */
const state = () => {
  const viz = window.__viz;
  const keys = [];
  let linkD = null;
  const walk = n => {
    keys.push(String(n.key));
    if (n.key === "geomap-link-NYC-PAR-0") linkD = n.d;
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  const {x, y} = viz._chartTransform || {x: 0, y: 0};
  const z = viz._zoomTransform || {x: 0, y: 0, scale: 1};
  const screen = q => [
    rect.left + z.x + (q[0] + x) * z.scale,
    rect.top + z.y + (q[1] + y) * z.scale,
  ];
  const at = p => screen(viz.schema.projection(p));
  let mid = null;
  if (linkD) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", linkD);
    svg.appendChild(path);
    document.body.appendChild(svg);
    const m = path.getPointAtLength(path.getTotalLength() / 2);
    mid = screen([m.x, m.y]);
    svg.remove();
  }
  return {
    keys,
    rotate: viz.schema.projection.rotate(),
    configured: viz.projectionRotate() ?? null,
    focus: viz._focus ?? null,
    zoom: {x: z.x, y: z.y, k: z.scale},
    center: at([-74, 40.7]),
    link: mid,
  };
};

/** A slow drag with the real mouse from `from` by `[dx, dy]`. */
async function drag(page, from, [dx, dy], back = false) {
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(from[0] + dx, from[1] + dy, {steps: 12});
  if (back) await page.mouse.move(...from, {steps: 12});
  await page.mouse.up();
  await page.waitForTimeout(120);
}

const globe = {
  data,
  links,
  legend: false,
  tiles: false,
  projection: "geoOrthographic",
  projectionRotate: [74, -40.7],
};

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: dragging a globe turns it, bringing far points into view`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(globe), renderer]);
      const before = await page.evaluate(state);
      assert.ok(before.keys.includes("geomap-point-NYC"), "New York faces us");
      assert.ok(
        !before.keys.includes("geomap-point-EQ"),
        "the far point hides",
      );
      await drag(page, before.center, [-170, 0]);
      const after = await page.evaluate(state);
      assert.ok(
        Math.abs(after.rotate[0] - before.rotate[0]) > 20,
        `the globe turned: ${before.rotate} → ${after.rotate}`,
      );
      assert.ok(
        after.keys.includes("geomap-point-EQ"),
        `the far point shows (rotated to ${after.rotate})`,
      );
      assert.deepStrictEqual(after.zoom, before.zoom, "without panning");
      assert.deepStrictEqual(
        after.configured,
        [74, -40.7],
        "projectionRotate reads the configured rotation",
      );

      // The zoom controls' reset turns it home.
      await page.evaluate(() =>
        document.querySelector("#viz .zoom-reset").click(),
      );
      await page.waitForTimeout(150);
      const home = await page.evaluate(state);
      home.rotate
        .slice(0, 2)
        .forEach((r, i) =>
          assert.ok(
            Math.abs(r - [74, -40.7][i]) < 1e-6,
            `home: ${home.rotate}`,
          ),
        );
      assert.ok(!home.keys.includes("geomap-point-EQ"), "hidden again");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a drag that ends on a link doesn't focus it`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(globe), renderer]);
      const {link} = await page.evaluate(state);
      // Out and back, so the drag ends where it began, over the link.
      await drag(page, link, [60, 40], true);
      assert.strictEqual((await page.evaluate(state)).focus, null, "no focus");
      await page.mouse.click(...(await page.evaluate(state)).link);
      await page.waitForTimeout(100);
      assert.strictEqual(
        (await page.evaluate(state)).focus,
        "link:0",
        "a click still focuses it",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a flat map still pans on a drag`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const flat = {...globe, projection: "geoMercator"};
      delete flat.projectionRotate;
      await page.evaluate(draw, [JSON.stringify(flat), renderer]);
      await page.evaluate(
        () =>
          new Promise(resolve => {
            const viz = window.__viz;
            const {left, top} = viz._margin;
            viz._zoomToBounds(
              [
                [left + 150, top + 100],
                [left + 350, top + 250],
              ],
              0,
            );
            setTimeout(resolve, 200);
          }),
      );
      const before = await page.evaluate(state);
      await drag(page, [320, 210], [-80, 0]);
      const after = await page.evaluate(state);
      assert.ok(
        Math.abs(after.zoom.x - before.zoom.x - -80) < 2,
        `panned: ${before.zoom.x} → ${after.zoom.x}`,
      );
      assert.deepStrictEqual(after.rotate, before.rotate, "without turning");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
