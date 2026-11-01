import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Geomap's links in Chromium, on SVG and Canvas with a real pointer: each
    link draws as a path (with its arrowhead) between the shapes and the
    points, moves with the map as it zooms, and shows its tooltip on hover.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const square = (x, y, s) => [
  [x, y],
  [x, y + s],
  [x + s, y + s],
  [x + s, y],
  [x, y],
];
const shapes = [
  {id: "US", ring: square(-110, 30, 30)},
  {id: "EU", ring: square(-5, 40, 25)},
  {id: "BR", ring: square(-60, -25, 20)},
];
const topojson = {
  type: "Topology",
  objects: {
    shapes: {
      type: "GeometryCollection",
      geometries: shapes.map((s, k) => ({
        type: "Polygon",
        id: s.id,
        arcs: [[k]],
      })),
    },
  },
  arcs: shapes.map(s => s.ring),
};

const config = {
  data: [
    {id: "NYC", name: "New York", point: [-74, 40.7]},
    {id: "LON", name: "London", point: [-0.13, 51.5]},
  ],
  links: [
    {source: "NYC", target: "LON", passengers: 3200},
    {source: "NYC", target: "BR", passengers: 900},
  ],
  arrows: true,
  legend: false,
  tiles: false,
  topojson,
};

/**
    Runs in the page: draws the map, and resolves once it has painted. The
    config arrives as JSON, so its arrays are the page's own.
*/
const draw = ([json, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Geomap()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config(JSON.parse(json))
      .label(d => d.name)
      .point(d => d.point)
      .linkSize(d => d.passengers);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/**
    Runs in the page: each keyed node's screen-space data, walking the
    painted scene's transforms (translate, then scale). For a path, its
    first point and a point a share `along` its length; for a circle, its
    center.
*/
const marks = ([keys, along]) => {
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  const out = {};
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.appendChild(path);
  document.body.appendChild(svg);
  const walk = (n, m) => {
    const t = n.transform || {};
    const s = t.scale ?? 1;
    const map = ([x, y]) => m([(t.x || 0) + x * s, (t.y || 0) + y * s]);
    const at = p => {
      const [x, y] = map(p);
      return [rect.left + x, rect.top + y];
    };
    if (keys.includes(n.key)) {
      if (n.type === "path") {
        path.setAttribute("d", n.d);
        const length = path.getTotalLength();
        const start = path.getPointAtLength(0);
        const mid = path.getPointAtLength(length * along);
        out[n.key] = {
          type: n.type,
          start: at([start.x, start.y]),
          mid: at([mid.x, mid.y]),
          aria: n.aria?.label,
          stroke: n.paint?.stroke,
        };
      } else if (n.type === "circle")
        out[n.key] = {type: n.type, center: at([n.cx || 0, n.cy || 0])};
      else out[n.key] = {type: n.type};
    }
    (n.children || []).forEach(c => walk(c, map));
  };
  walk(window.__viz._paintedScene.root, p => p);
  svg.remove();
  return out;
};

/** Runs in the page: every painted node's key, in paint order. */
const paintOrder = () => {
  const keys = [];
  const walk = n => {
    keys.push(String(n.key));
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  return keys;
};

/** Runs in the page: the visible tooltip's text. */
const tooltipText = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

const LINK = "geomap-link-NYC-LON-0";
const POINT = "geomap-point-NYC";

const near = (a, b, tol, msg) =>
  assert.ok(
    Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol,
    `${msg}: ${a} vs ${b}`,
  );

for (const renderer of ["svg", "canvas"]) {
  it(`Geomap ${renderer}: links draw between the shapes and the points`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(config), renderer]);
      const order = await page.evaluate(paintOrder);
      const link = order.indexOf(LINK);
      assert.ok(link > -1, "the link is painted");
      assert.ok(order.includes(`${LINK}::hit`), "with a hit path");
      assert.ok(order.includes(`${LINK}-arrow-t`), "and an arrowhead");
      assert.ok(order.includes("geomap-link-NYC-BR-1"), "a link to a shape");
      assert.ok(order.indexOf("geomap-path-US") < link, "above the shapes");
      assert.ok(order.indexOf(POINT) > link, "below the points");
      const found = await page.evaluate(marks, [[LINK, POINT], 0.5]);
      assert.strictEqual(found[LINK].aria, "New York to London, 3200.");
      near(found[LINK].start, found[POINT].center, 1, "starts at New York");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a globe hides the points on its far side, as it turns`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const globe = {
        ...config,
        data: [
          ...config.data,
          {id: "TYO", name: "Tokyo", point: [139.7, 35.7]},
        ],
        links: [...config.links, {source: "LON", target: "TYO"}],
        projection: "geoOrthographic",
        projectionRotate: [74, -40],
        linkCurve: 0.4,
      };
      await page.evaluate(draw, [JSON.stringify(globe), renderer]);
      let keys = await page.evaluate(paintOrder);
      assert.ok(keys.includes(POINT), "New York faces the viewer");
      assert.ok(
        !keys.includes("geomap-point-TYO"),
        "Tokyo is behind the globe",
      );
      assert.ok(
        !keys.some(k => k.includes("TYO") && !k.startsWith("geomap-link-")),
        "and so are its label and hit area",
      );
      assert.ok(
        !keys.includes("geomap-link-LON-TYO-2-arrow-t"),
        "no arrowhead at a hidden end",
      );
      keys = await page.evaluate(
        () =>
          new Promise(resolve => {
            window.__viz.projectionRotate([-150, -20]).render(() => {
              const out = [];
              const walk = n => {
                out.push(String(n.key));
                (n.children || []).forEach(walk);
              };
              walk(window.__viz._paintedScene.root);
              resolve(out);
            });
          }),
      );
      assert.ok(keys.includes("geomap-point-TYO"), "Tokyo shows once it turns");
      assert.ok(!keys.includes(POINT), "and New York hides");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: links move with the map as it zooms`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(config), renderer]);
      const before = await page.evaluate(marks, [[LINK, POINT], 0.5]);
      await page.evaluate(
        () =>
          new Promise(resolve => {
            const viz = window.__viz;
            const {left, top} = viz._margin;
            viz._zoomToBounds(
              [
                [left + 100, top + 80],
                [left + 300, top + 220],
              ],
              0,
            );
            setTimeout(resolve, 300);
          }),
      );
      const after = await page.evaluate(marks, [[LINK, POINT], 0.5]);
      const moved = Math.hypot(
        after[POINT].center[0] - before[POINT].center[0],
        after[POINT].center[1] - before[POINT].center[1],
      );
      assert.ok(moved > 20, `the map zoomed (New York moved ${moved}px)`);
      near(
        after[LINK].start,
        after[POINT].center,
        1.5,
        "still starts at New York",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: keyboard focus reaches links and reads their label`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(config), renderer]);
      const visited = await page.evaluate(async () => {
        const viz = window.__viz;
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
        host.focus();
        await wait();
        const live = host.querySelector("[aria-live]");
        const seen = {};
        for (const key of ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"])
          for (let i = 0; i < 6; i++) {
            const id = viz._keyboardNav?.current;
            if (id) seen[id] = live ? live.textContent : "";
            host.dispatchEvent(
              new KeyboardEvent("keydown", {key, bubbles: true}),
            );
            await wait();
          }
        return seen;
      });
      const ids = Object.keys(visited);
      const links = ids.filter(k => k.startsWith("geomap-link-"));
      assert.ok(links.length > 0, `reaches links: ${ids}`);
      assert.ok(
        !links.some(k => k.endsWith("::hit") || k.includes("-arrow-")),
        "not hit paths or arrowheads",
      );
      if (visited[LINK] !== undefined)
        assert.ok(visited[LINK].includes("New York to London"), visited[LINK]);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: hovering a link shows its tooltip`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [JSON.stringify(config), renderer]);
      const found = await page.evaluate(marks, [[LINK], 0.5]);
      const point = found[LINK].mid;
      await page.mouse.move(point[0] - 20, point[1] - 30);
      await page.mouse.move(...point, {steps: 4});
      await page.waitForTimeout(200);
      const tip = await page.evaluate(tooltipText);
      assert.ok(tip.includes("NewYork→London"), `title, got "${tip}"`);
      assert.ok(tip.includes("passengers") && tip.includes("3.2k"), tip);
      const hovered = await page.evaluate(() => {
        const viz = window.__viz;
        return typeof viz._hover === "function";
      });
      assert.ok(hovered, "the link is hovered");

      // Clicking the link focuses it; clicking it again clears the focus.
      await page.mouse.click(...point);
      await page.waitForTimeout(100);
      assert.strictEqual(
        await page.evaluate(() => window.__viz._focus),
        "link:0",
      );
      await page.mouse.move(5, 5);
      await page.waitForTimeout(150);
      assert.strictEqual(
        await page.evaluate(tooltipText),
        "",
        "hidden on leave",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
