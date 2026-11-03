import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Turning a Geomap globe from the keyboard in Chromium, on SVG and Canvas:
    Shift and the arrow keys turn it (bringing a far-side point into view),
    instantly under `reducedMotion` and in a short eased step otherwise,
    plain arrows still move between marks, the zoom controls' reset turns it
    home, and a flat map takes no new keys.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const data = [
  {id: "NYC", name: "New York", point: [-74, 40.7]},
  {id: "PAR", name: "Paris", point: [2.35, 48.9]},
  // Just past the horizon of a globe centered on New York.
  {id: "EQ", name: "Far", point: [22.6, 0]},
];

const globe = {
  data,
  legend: false,
  tiles: false,
  projection: "geoOrthographic",
  projectionRotate: [74, -40.7],
  reducedMotion: true,
};

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

/**
    Runs in the page: focuses the chart, presses each key (`"Shift+ArrowLeft"`
    holds Shift), and reports the painted point keys, the rotation, the
    focused mark, and the host's shortcuts and instructions.
*/
const press = keys => {
  const viz = window.__viz;
  const host = document.querySelector("#viz .d3plus-keyboard-nav");
  if (document.activeElement !== host) host.focus();
  const prevented = [];
  for (const k of keys) {
    const shift = k.startsWith("Shift+");
    const event = new KeyboardEvent("keydown", {
      key: shift ? k.slice(6) : k,
      shiftKey: shift,
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(event);
    prevented.push(event.defaultPrevented);
  }
  const points = [];
  const walk = n => {
    const key = String(n.key);
    if (key.startsWith("geomap-point-")) points.push(key.slice(13));
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  return {
    points,
    prevented,
    rotate: viz.schema.projection.rotate(),
    current: viz._keyboardNav?.current ?? null,
    shortcuts: host.getAttribute("aria-keyshortcuts"),
    desc: host.querySelector("span").textContent,
  };
};

const turned = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > 1e-6;

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: Shift+arrows turn a globe, and reset turns it home`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(globe), renderer]);
      const before = await page.evaluate(press, []);
      assert.ok(before.points.includes("NYC"), "New York faces us");
      assert.ok(!before.points.includes("EQ"), "the far point hides");
      assert.ok(
        before.shortcuts.includes("Shift+ArrowLeft"),
        `shortcuts: ${before.shortcuts}`,
      );
      assert.ok(before.desc.includes("rotate the globe"), before.desc);

      // Plain arrows still move between marks, without turning the globe.
      assert.strictEqual(before.current, "geomap-point-NYC", "focused");
      const nav = await page.evaluate(press, ["ArrowRight"]);
      assert.strictEqual(nav.current, "geomap-point-PAR", "the focus moved");
      assert.ok(!turned(nav.rotate, before.rotate), "without turning");
      const back = await page.evaluate(press, ["ArrowLeft"]);
      assert.strictEqual(back.current, "geomap-point-NYC", "and back");

      // reducedMotion: each press lands at once.
      const one = await page.evaluate(press, ["Shift+ArrowRight"]);
      assert.deepStrictEqual(one.prevented, [true], "the key is taken");
      assert.ok(
        Math.abs(one.rotate[0] - 64) < 1e-6,
        `a step east, instantly: ${one.rotate}`,
      );
      const east = Array(9).fill("Shift+ArrowRight");
      const south = Array(4).fill("Shift+ArrowDown");
      // Held keys repeat their keydown, a step each.
      const after = await page.evaluate(press, [...east, ...south]);
      [-26, -0.7].forEach((r, i) =>
        assert.ok(Math.abs(after.rotate[i] - r) < 1e-6, `${after.rotate}`),
      );
      assert.ok(
        after.points.includes("EQ"),
        `the far point shows (rotated to ${after.rotate})`,
      );

      // The zoom controls' reset turns it home.
      await page.evaluate(() =>
        document.querySelector("#viz .zoom-reset").click(),
      );
      await page.waitForTimeout(150);
      const home = await page.evaluate(press, []);
      home.rotate
        .slice(0, 2)
        .forEach((r, i) =>
          assert.ok(
            Math.abs(r - [74, -40.7][i]) < 1e-6,
            `home: ${home.rotate}`,
          ),
        );
      assert.ok(!home.points.includes("EQ"), "hidden again");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a key press eases unless motion is reduced`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const eased = {...globe, reducedMotion: false};
      await page.evaluate(draw, [JSON.stringify(eased), renderer]);
      await page.evaluate(() => window.__viz.duration(600));
      const now = await page.evaluate(press, ["Shift+ArrowUp"]);
      assert.ok(
        Math.abs(now.rotate[1] - -40.7) < 1e-6,
        `not there yet: ${now.rotate}`,
      );
      await page.waitForTimeout(400);
      const later = await page.evaluate(press, []);
      assert.ok(
        Math.abs(later.rotate[1] - -50.7) < 1e-6,
        `eased a step north: ${later.rotate}`,
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: Shift+arrows do nothing new on a flat map`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const flat = {...globe, projection: "geoMercator"};
      delete flat.projectionRotate;
      await page.evaluate(draw, [JSON.stringify(flat), renderer]);
      const before = await page.evaluate(press, []);
      assert.strictEqual(before.shortcuts, null, "no shortcuts");
      assert.ok(!before.desc.includes("rotate"), before.desc);
      const after = await page.evaluate(press, [
        "Shift+ArrowRight",
        "Shift+ArrowDown",
      ]);
      assert.ok(!turned(after.rotate, before.rotate), "without turning");
      assert.ok(after.current, "the keys still move between marks");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
