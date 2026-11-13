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
  const walk = (n, m, scale) => {
    const t = n.transform || {};
    const s = t.scale ?? 1;
    const map = ([x, y]) => m([(t.x || 0) + x * s, (t.y || 0) + y * s]);
    const k = scale * s;
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
          strokeWidth: (n.paint?.strokeWidth ?? 1) * k,
        };
      } else if (n.type === "circle")
        out[n.key] = {
          type: n.type,
          center: at([n.cx || 0, n.cy || 0]),
          r: (n.r || 0) * k,
        };
      else out[n.key] = {type: n.type};
    }
    (n.children || []).forEach(c => walk(c, map, k));
  };
  walk(window.__viz._paintedScene.root, p => p, 1);
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

/**
    Runs in the page: for each keyed link, where its painted stroke ends at
    each arrowed end, and that end's head (its tip and base corners).
*/
const strokeEnds = keys => {
  const out = {};
  const nodes = {};
  const walk = n => {
    nodes[n.key] = n;
    (n.children || []).forEach(walk);
  };
  walk(window.__viz._paintedScene.root);
  const nums = d => d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);
  for (const key of keys) {
    const link = nodes[key];
    if (!link) continue;
    const n = nums(link.d);
    const ends = {s: [n[0], n[1]], t: [n[n.length - 2], n[n.length - 1]]};
    out[key] = {};
    for (const end of ["s", "t"]) {
      const head = nodes[`${key}-arrow-${end}`];
      if (!head) continue;
      const h = nums(head.d);
      out[key][end] = {
        stroke: ends[end],
        tip: [h[0], h[1]],
        corners: [
          [h[2], h[3]],
          [h[4], h[5]],
        ],
      };
    }
  }
  return out;
};

/** Asserts a stroke end lies inside its head and within 0.5px of its axis. */
function assertInHead({stroke, tip, corners}, msg) {
  const [b, c] = corners;
  const cross = (p, q, r) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const s1 = cross(tip, b, stroke),
    s2 = cross(b, c, stroke),
    s3 = cross(c, tip, stroke);
  assert.ok(
    (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0),
    `${msg}: the stroke ends inside the head`,
  );
  const mid = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
  const off =
    Math.abs(
      (mid[0] - tip[0]) * (tip[1] - stroke[1]) -
        (tip[0] - stroke[0]) * (mid[1] - tip[1]),
    ) / Math.hypot(mid[0] - tip[0], mid[1] - tip[1]);
  assert.ok(off <= 0.5, `${msg}: ${off.toFixed(3)}px off the head's axis`);
}

const LINK = "geomap-link-NYC-LON-0";
const POINT = "geomap-point-NYC";

const near = (a, b, tol, msg) =>
  assert.ok(
    Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol,
    `${msg}: ${a} vs ${b}`,
  );

/**
    Asserts a link's stroke starts on a point's outline, give or take `tol`
    pixels: its square end's corners on the circle.
*/
const onOutline = ({start, strokeWidth}, {center, r}, tol, msg) => {
  const reach = Math.sqrt(r * r - (strokeWidth / 2) ** 2);
  const off = Math.hypot(start[0] - center[0], start[1] - center[1]) - reach;
  assert.ok(r > 0 && Math.abs(off) <= tol, `${msg}: ${off}px off its outline`);
};

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
      onOutline(found[LINK], found[POINT], 1, "starts at New York");
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

  it(`Geomap ${renderer}: a route the antimeridian cuts crosses the map in one path`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const pacific = {
        data: [
          {id: "SYD", name: "Sydney", point: [151.2, -33.9]},
          {id: "LAX", name: "Los Angeles", point: [-118.2, 34]},
          {id: "NYC", name: "New York", point: [-74, 40.7]},
        ],
        links: [
          {source: "SYD", target: "LAX", passengers: 800},
          {source: "LAX", target: "NYC", passengers: 400},
        ],
        arrows: true,
        legend: false,
        tiles: false,
        linkLabel: "passengers",
      };
      await page.evaluate(draw, [JSON.stringify(pacific), renderer]);
      const found = await page.evaluate(() => {
        const viz = window.__viz;
        let link = null;
        let hit = null;
        const keys = [];
        const walk = n => {
          keys.push(String(n.key));
          if (n.key === "geomap-link-SYD-LAX-0") link = n;
          // The hit path covers the whole link; the stroke stops in its head.
          if (n.key === "geomap-link-SYD-LAX-0::hit") hit = n;
          (n.children || []).forEach(walk);
        };
        walk(viz._paintedScene.root);
        const n = hit.d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);
        const points = [];
        for (let k = 0; k + 1 < n.length; k += 2) points.push([n[k], n[k + 1]]);
        const {left, right, top, bottom} = viz._margin;
        return {
          moves: (link.d.match(/M/g) || []).length,
          points,
          first: points[0],
          last: points[points.length - 1],
          width: viz.schema.width - left - right,
          height: viz.schema.height - top - bottom,
          syd: viz.schema.projection([151.2, -33.9]),
          lax: viz.schema.projection([-118.2, 34]),
          keys,
        };
      });
      assert.strictEqual(found.moves, 1, "one continuous path");
      near(found.first, found.syd, 0.5, "from Sydney");
      near(found.last, found.lax, 0.5, "to Los Angeles");
      for (const [x, y] of found.points)
        assert.ok(
          x >= 0 && x <= found.width && y >= 0 && y <= found.height,
          `inside the map: ${x},${y}`,
        );
      assert.ok(
        found.keys.includes("geomap-link-SYD-LAX-0-arrow-t"),
        "with its arrowhead",
      );
      assert.ok(
        found.keys.includes("geomap-link-SYD-LAX-0-label-group"),
        "and its label",
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: each link's stroke ends inside its arrowhead, on its axis`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const flat = {
        data: [
          {id: "SYD", name: "Sydney", point: [151.2, -33.9]},
          {id: "LAX", name: "Los Angeles", point: [-118.2, 34]},
          {id: "NYC", name: "New York", point: [-74, 40.7]},
          {id: "LON", name: "London", point: [-0.13, 51.5]},
        ],
        links: [
          {source: "NYC", target: "LON", passengers: 3200},
          {source: "SYD", target: "LAX", passengers: 800},
        ],
        arrows: "both",
        legend: false,
        tiles: false,
      };
      await page.evaluate(draw, [JSON.stringify(flat), renderer]);
      const keys = ["geomap-link-NYC-LON-0", "geomap-link-SYD-LAX-1"];
      let ends = await page.evaluate(strokeEnds, keys);
      for (const key of keys)
        for (const end of ["s", "t"]) {
          assert.ok(ends[key]?.[end], `${key} has a head at ${end}`);
          assertInHead(ends[key][end], `Mercator ${key} ${end}`);
        }

      const globe = {
        ...flat,
        links: [
          {source: "NYC", target: "LON", passengers: 3200},
          {source: "LON", target: "SYD", passengers: 800},
        ],
        projection: "geoOrthographic",
        projectionRotate: [40, -40],
      };
      await page.evaluate(draw, [JSON.stringify(globe), renderer]);
      ends = await page.evaluate(strokeEnds, [
        "geomap-link-NYC-LON-0",
        "geomap-link-LON-SYD-1",
      ]);
      for (const end of ["s", "t"])
        assertInHead(
          ends["geomap-link-NYC-LON-0"][end],
          `globe NYC-LON ${end}`,
        );
      assert.ok(
        !ends["geomap-link-LON-SYD-1"].t,
        "no head at Sydney, behind the globe",
      );
      assertInHead(ends["geomap-link-LON-SYD-1"].s, "globe LON-SYD s");
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
      onOutline(after[LINK], after[POINT], 1.5, "still starts at New York");
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
