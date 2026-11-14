import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    `linkBundle` in Chromium, on SVG and Canvas with a real pointer: a
    Network's bundled links draw as curves whose strokes end at their
    arrowheads' bases, on each head's axis; hovering one shows its tooltip;
    clicking one zooms to a box around the whole curve; and neither hover
    nor zoom runs the bundling again. A flat Geomap bundles its links, and
    a globe leaves them as they were.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

const nodes = [
  ...Array.from({length: 6}, (_, k) => ({
    id: `L${k}`,
    name: `Left ${k}`,
    x: 0,
    y: k * 12,
  })),
  ...Array.from({length: 6}, (_, k) => ({
    id: `R${k}`,
    name: `Right ${k}`,
    x: 240,
    y: k * 12,
  })),
];
const links = Array.from({length: 6}, (_, k) => ({
  source: `L${k}`,
  target: `R${k}`,
  weight: k + 1,
}));

/**
    Runs in the page: draws `chart` from `json`, resolving once painted. The
    config arrives as JSON, so its arrays are the page's own.
*/
const draw = ([chart, json, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(JSON.parse(json));
    if (chart === "Network") viz.label(d => d.name);
    else viz.point(d => d.point).label(d => d.id);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: every painted node by key, with its offset on the surface. */
const sceneNodes = () => {
  const out = {};
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const s = t.scale ?? 1;
    const nx = x + (t.x || 0);
    const ny = y + (t.y || 0);
    if (n.key !== undefined)
      out[String(n.key)] = {
        type: n.type,
        d: n.d,
        x: nx,
        y: ny,
        scale: s,
        strokeWidth: n.paint?.strokeWidth ?? 1,
        aria: n.aria?.label,
      };
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  return out;
};

const numbers = d => (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);

/**
    Asserts a stroke end `p` sits at the base of the head `arrowD` (its tip
    and two base corners): on the head's axis, neither short of the base nor
    past it into the head.
*/
function assertAtBase(p, arrowD, msg) {
  const h = numbers(arrowD);
  const tip = [h[0], h[1]];
  const mid = [(h[2] + h[4]) / 2, (h[3] + h[5]) / 2];
  const len = Math.hypot(tip[0] - mid[0], tip[1] - mid[1]);
  const u = [(tip[0] - mid[0]) / len, (tip[1] - mid[1]) / len];
  const along = (p[0] - mid[0]) * u[0] + (p[1] - mid[1]) * u[1];
  const off = Math.abs((p[0] - mid[0]) * u[1] - (p[1] - mid[1]) * u[0]);
  assert.ok(
    Math.abs(along) < 0.05,
    `${msg}: the stroke ends ${along.toFixed(3)}px past the head's base`,
  );
  assert.ok(off < 0.05, `${msg}: ${off.toFixed(3)}px off the head's axis`);
}

/**
    Runs in the page: a screen point on the path `key`, `along` its length,
    and the surface's origin on the page.
*/
const pointOn = ([key, along]) => {
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const rect = host.getBoundingClientRect();
  let found = null;
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0);
    const ny = y + (t.y || 0);
    if (n.key === key) found = {n, x: nx, y: ny};
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(window.__viz._paintedScene.root, 0, 0);
  if (!found) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", found.n.d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const p = path.getPointAtLength(path.getTotalLength() * along);
  svg.remove();
  return [rect.left + found.x + p.x, rect.top + found.y + p.y];
};

/** Runs in the page: the visible tooltip's text. */
const tooltipText = () =>
  Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent.replace(/\s+/g, ""))
    .join("|");

const runs = () => window.__viz.ctx.linkBundleCache?.runs ?? 0;

const networkConfig = {
  nodes,
  links,
  linkBundle: true,
  arrows: "both",
  sizeMax: 6,
  linkSize: 2,
};

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: bundled links curve, and their strokes end at their arrowheads' bases`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        "Network",
        JSON.stringify(networkConfig),
        renderer,
      ]);
      const scene = await page.evaluate(sceneNodes);
      let bent = 0;
      for (let k = 0; k < 6; k++) {
        const key = `network-link-L${k}-R${k}-${k}`;
        const link = scene[key];
        const hit = scene[`${key}::hit`];
        assert.ok(link && hit, `${key} is painted, with a hit path`);
        if (numbers(hit.d).length > 4) bent++;
        const n = numbers(link.d);
        const ends = {s: n.slice(0, 2), t: n.slice(-2)};
        for (const end of ["s", "t"]) {
          const head = scene[`network-arrow-L${k}-R${k}-${k}-${end}`];
          assert.ok(head, `${key} has a head at ${end}`);
          assertAtBase(ends[end], head.d, `${key} ${end}`);
        }
      }
      assert.ok(bent >= 4, `the links bend (${bent} of 6)`);
      assert.strictEqual(await page.evaluate(runs), 1);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Network ${renderer}: hovering a bundled link shows its tooltip, and clicking it zooms around the curve`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        "Network",
        JSON.stringify(networkConfig),
        renderer,
      ]);
      const key = "network-link-L0-R0-0";
      const at = await page.evaluate(pointOn, [`${key}::hit`, 0.5]);
      assert.ok(at, "a point on the curve");
      await page.mouse.move(at[0] - 20, at[1] - 30);
      await page.mouse.move(...at, {steps: 4});
      await page.waitForTimeout(200);
      const tip = await page.evaluate(tooltipText);
      assert.ok(tip.includes("Left0→Right0"), `tooltip, got "${tip}"`);
      assert.strictEqual(await page.evaluate(runs), 1, "hover reuses it");

      // Record the box the click zooms to, in the chart's own space.
      await page.evaluate(() => {
        const viz = window.__viz;
        const zoom = viz._zoomToBounds.bind(viz);
        viz._zoomToBounds = (bounds, ...rest) => {
          window.__bounds = bounds;
          return zoom(bounds, ...rest);
        };
      });
      await page.mouse.click(...at);
      await page.waitForTimeout(300);
      const found = await page.evaluate(() => {
        const viz = window.__viz;
        const link = viz.ctx.networkCtx.links.find(l => l.source.id === "L0");
        const {x = 0, y = 0} = viz._chartTransform || {};
        return {
          focus: viz._focus,
          bounds: window.__bounds,
          points: link.points.map(([px, py]) => [px + x, py + y]),
        };
      });
      assert.strictEqual(found.focus, "link:0");
      const [[x0, y0], [x1, y1]] = found.bounds;
      for (const [px, py] of found.points)
        assert.ok(
          px >= x0 - 0.01 &&
            px <= x1 + 0.01 &&
            py >= y0 - 0.01 &&
            py <= y1 + 0.01,
          `the focus box covers ${px},${py}`,
        );
      await page.waitForTimeout(400);
      assert.strictEqual(await page.evaluate(runs), 1, "zoom reuses it");
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Network ${renderer}: zooming and panning don't run the bundling again`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        "Network",
        JSON.stringify(networkConfig),
        renderer,
      ]);
      const before = await page.evaluate(sceneNodes);
      await page.evaluate(
        () =>
          new Promise(resolve => {
            const viz = window.__viz;
            const {left, top} = viz._margin;
            viz._zoomToBounds(
              [
                [left + 100, top + 100],
                [left + 300, top + 250],
              ],
              0,
            );
            setTimeout(resolve, 300);
          }),
      );
      const host = await page.evaluate(() => {
        const r = document.querySelector("#viz").getBoundingClientRect();
        return [r.left + 320, r.top + 210];
      });
      await page.mouse.move(...host);
      await page.mouse.down();
      await page.mouse.move(host[0] + 40, host[1] + 30, {steps: 5});
      await page.mouse.up();
      await page.waitForTimeout(300);
      const after = await page.evaluate(sceneNodes);
      const key = "network-link-L0-R0-0";
      assert.notDeepStrictEqual(
        [after[key].x, after[key].y, after[key].scale],
        [before[key].x, before[key].y, before[key].scale],
        "the chart zoomed",
      );
      assert.strictEqual(after[key].d, before[key].d, "the same curve");
      assert.strictEqual(await page.evaluate(runs), 1);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });

  it(`Geomap ${renderer}: a flat map bundles its links, and a globe doesn't`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const data = [
        ...Array.from({length: 5}, (_, k) => ({
          id: `W${k}`,
          point: [-120, 30 + k * 3],
        })),
        ...Array.from({length: 5}, (_, k) => ({
          id: `E${k}`,
          point: [-80, 30 + k * 3],
        })),
      ];
      const flows = Array.from({length: 5}, (_, k) => ({
        source: `W${k}`,
        target: `E${k}`,
      }));
      const ring = [
        [-125, 25],
        [-125, 48],
        [-75, 48],
        [-75, 25],
        [-125, 25],
      ];
      const topojson = {
        type: "Topology",
        objects: {
          land: {
            type: "GeometryCollection",
            geometries: [{type: "Polygon", id: "US", arcs: [[0]]}],
          },
        },
        arcs: [ring],
      };
      const config = {data, links: flows, tiles: false, topojson};
      const paths = async extra => {
        await page.evaluate(draw, [
          "Geomap",
          JSON.stringify({...config, ...extra}),
          renderer,
        ]);
        const scene = await page.evaluate(sceneNodes);
        return flows.map((_, k) => {
          const link = scene[`geomap-link-W${k}-E${k}-${k}`];
          assert.ok(link, `link ${k} is painted`);
          return link.d;
        });
      };
      const plain = await paths({});
      const bundled = await paths({linkBundle: true});
      assert.strictEqual(await page.evaluate(runs), 1);
      assert.notDeepStrictEqual(bundled, plain, "the flat map bundles");
      const globe = {
        projection: "geoOrthographic",
        projectionRotate: [100, -35],
      };
      const round = await paths(globe);
      assert.deepStrictEqual(
        await paths({...globe, linkBundle: true}),
        round,
        "the globe keeps its great circles",
      );
      assert.strictEqual(await page.evaluate(runs), 0);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
