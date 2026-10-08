/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Beeswarm (and Plot's `swarm` mode) in a real browser: circles keep their
    value-axis position and are packed so none overlap, one swarm per category
    lane, on both backends, with tooltips and hover, and a Plot toggled between
    scatter and swarm tweens the same circles between the two layouts.
*/

after(async () => {
  await closeBrowser();
});

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  window.__rows = n => {
    let s = 7;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const regions = ["Africa", "Americas", "Asia", "Europe"];
    return Array.from({length: n}, (_, i) => {
      let v = 0;
      for (let k = 0; k < 4; k++) v += rand();
      return {
        id: `c${i}`,
        region: regions[i % 4],
        value: Math.round(v * 25),
        other: Math.round(rand() * 100),
        pop: 1 + Math.round(rand() * 99),
      };
    });
  };
  // Every data circle's on-screen center and radius, keyed by data-key.
  window.__circles = el =>
    Object.fromEntries(
      Array.from(
        el.querySelectorAll("[data-key^='c'] circle, circle[data-key^='c']"),
      )
        .map(c => {
          const b = c.getBoundingClientRect();
          const key =
            c.getAttribute("data-key") ||
            c.closest("[data-key]").getAttribute("data-key");
          return [
            key,
            {
              x: b.left + b.width / 2,
              y: b.top + b.height / 2,
              r: Number(c.getAttribute("r")),
            },
          ];
        })
        .filter(([key]) => /^c\d+$/.test(key)),
    );
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n =>
      Array.from(n.attributes).some(a => a.value.includes("NaN")),
    ).length;
  window.__draw = (Chart, configure) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.style.cssText = "width:800px;height:500px";
      document.body.appendChild(el);
      const viz = new window.d3plus[Chart]()
        .select(el)
        .duration(0)
        .width(800)
        .height(500);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
};

const run = fn => render("", new Function(`return (${helpers})(), (${fn})();`));

/** Smallest gap between any two circles, in pixels (negative = overlap). */
function minGap(circles) {
  const list = Object.values(circles);
  let gap = Infinity;
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++)
      gap = Math.min(
        gap,
        Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y) -
          list[i].r -
          list[j].r,
      );
  return gap;
}

it("Beeswarm packs circles along x without overlaps and hides the empty y axis", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(150);
    const {el, viz} = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").x("value"),
    );
    const xs = data.map(d => viz._xAxis._getPosition(d.value));
    return {
      circles: window.__circles(el),
      nan: window.__nan(el),
      yAxis: !!el.querySelector("[data-key='plot-y-axis']"),
      xAxis: !!el.querySelector("[data-key='plot-x-axis']"),
      swarm: viz._swarm,
      xs,
      left:
        el.querySelector("svg").getBoundingClientRect().left +
        viz._chartTransform.x,
      ids: data.map(d => d.id),
    };
  });
  assert.strictEqual(Object.keys(out.circles).length, 150);
  assert.strictEqual(out.nan, 0);
  assert.deepStrictEqual(out.swarm, {axis: "x", cross: "y", lanes: false});
  assert.ok(minGap(out.circles) > -0.5, `min gap ${minGap(out.circles)}`);
  assert.strictEqual(out.yAxis, false, "single-lane swarm hides the y axis");
  assert.strictEqual(out.xAxis, true);
  out.ids.forEach((id, i) =>
    assert.ok(
      Math.abs(out.circles[id].x - (out.left + out.xs[i])) < 0.5,
      `${id} keeps its x value`,
    ),
  );
});

it("Beeswarm draws one swarm per category lane, horizontal or vertical", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(120);
    const lane = (viz, el, axis) => {
      const svg = el.querySelector("svg").getBoundingClientRect();
      const origin =
        axis === "y"
          ? svg.top + viz._chartTransform.y
          : svg.left + viz._chartTransform.x;
      const fn = axis === "y" ? viz._yFunc : viz._xFunc;
      return Object.fromEntries(
        ["Africa", "Americas", "Asia", "Europe"].map(r => [
          r,
          origin + fn(r, axis),
        ]),
      );
    };
    const h = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").x("value").y("region"),
    );
    const v = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").y("value").x("region"),
    );
    return {
      data,
      horizontal: {
        circles: window.__circles(h.el),
        lanes: lane(h.viz, h.el, "y"),
        swarm: h.viz._swarm,
        ticks: h.viz._yAxis._d3Scale.domain(),
      },
      vertical: {
        circles: window.__circles(v.el),
        lanes: lane(v.viz, v.el, "x"),
        swarm: v.viz._swarm,
      },
    };
  });
  const {data, horizontal, vertical} = out;
  assert.deepStrictEqual(horizontal.swarm, {
    axis: "x",
    cross: "y",
    lanes: true,
  });
  assert.deepStrictEqual(vertical.swarm, {axis: "y", cross: "x", lanes: true});
  assert.deepStrictEqual([...horizontal.ticks].sort(), [
    "Africa",
    "Americas",
    "Asia",
    "Europe",
  ]);
  for (const [name, chart, cross] of [
    ["horizontal", horizontal, "y"],
    ["vertical", vertical, "x"],
  ]) {
    const centers = Object.values(chart.lanes).sort((a, b) => a - b);
    const band = centers[1] - centers[0];
    assert.ok(minGap(chart.circles) > -0.5, `${name}: no overlaps`);
    data.forEach(d => {
      const c = chart.circles[d.id];
      assert.ok(
        Math.abs(c[cross] - chart.lanes[d.region]) + c.r <= band / 2 + 0.5,
        `${name}: ${d.id} stays in the ${d.region} band`,
      );
    });
  }
});

it("Beeswarm sizes circles by `size` and keeps them apart", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(100);
    const {el} = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").x("value").size("pop"),
    );
    return {
      circles: window.__circles(el),
      pops: Object.fromEntries(data.map(d => [d.id, d.pop])),
    };
  });
  const entries = Object.entries(out.circles);
  const radii = new Set(entries.map(([, c]) => Math.round(c.r * 10)));
  assert.ok(radii.size > 10, "radii vary with size");
  const [small] = entries.reduce((a, b) =>
    out.pops[a[0]] < out.pops[b[0]] ? a : b,
  );
  const [big] = entries.reduce((a, b) =>
    out.pops[a[0]] > out.pops[b[0]] ? a : b,
  );
  assert.ok(
    out.circles[big].r > out.circles[small].r,
    "bigger value, bigger circle",
  );
  assert.ok(minGap(out.circles) > -0.5, `min gap ${minGap(out.circles)}`);
});

it("Beeswarm shrinks a crowded swarm to fit its band, or clamps it", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window
      .__rows(600)
      .map(d => ({...d, value: Math.round(d.value / 10)}));
    const draw = overflow =>
      window.__draw("Beeswarm", v =>
        v
          .data(data)
          .groupBy("id")
          .x("value")
          .y("region")
          .height(300)
          .swarmConfig({overflow}),
      );
    const shrink = await draw("shrink");
    const clamp = await draw("clamp");
    const bands = ({viz}) => {
      const p = ["Africa", "Americas"].map(r => viz._yFunc(r, "y"));
      return Math.abs(p[1] - p[0]);
    };
    return {
      shrink: {circles: window.__circles(shrink.el), band: bands(shrink)},
      clamp: {circles: window.__circles(clamp.el), band: bands(clamp)},
    };
  });
  const shrinkR = Object.values(out.shrink.circles)[0].r;
  assert.ok(shrinkR < 5, `shrink: radius ${shrinkR} below the default 5`);
  assert.ok(minGap(out.shrink.circles) > -0.5, "shrink: no overlaps");
  assert.ok(
    Object.values(out.clamp.circles).every(c => c.r === 5),
    "clamp: radii untouched",
  );
});

it("Plot toggles between scatter and swarm, tweening the same circles", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(60);
    const {el, viz} = await window.__draw("Plot", v =>
      v.data(data).groupBy("id").x("value").y("other").duration(400),
    );
    const scatter = window.__circles(el);
    const yAxisBefore = !!el.querySelector("[data-key='plot-y-axis']");
    const mid = await new Promise(resolve => {
      viz.swarm(true).render();
      setTimeout(() => resolve(window.__circles(el)), 200);
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    const swarm = window.__circles(el);
    const yAxisSwarm = !!el.querySelector("[data-key='plot-y-axis']");
    await new Promise(resolve =>
      viz
        .swarm(false)
        .duration(0)
        .render(() => requestAnimationFrame(resolve)),
    );
    return {
      scatter,
      mid,
      swarm,
      back: window.__circles(el),
      yAxisBefore,
      yAxisSwarm,
    };
  });
  const keys = Object.keys(out.scatter).sort();
  assert.strictEqual(keys.length, 60);
  assert.deepStrictEqual(
    Object.keys(out.swarm).sort(),
    keys,
    "same circles, same keys",
  );
  assert.deepStrictEqual(
    Object.keys(out.mid).sort(),
    keys,
    "no circle re-entered mid-transition",
  );
  assert.ok(
    out.yAxisBefore && !out.yAxisSwarm,
    "the y axis gives way to the swarm",
  );
  assert.ok(minGap(out.swarm) > -0.5, "swarm has no overlaps");
  const between = keys.filter(k => {
    const [a, m, b] = [out.scatter[k], out.mid[k], out.swarm[k]];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    return (
      d > 10 &&
      Math.hypot(m.x - a.x, m.y - a.y) > 1 &&
      Math.hypot(b.x - m.x, b.y - m.y) > 1
    );
  });
  assert.ok(between.length > 10, `circles caught mid-tween: ${between.length}`);
  keys.forEach(k => {
    assert.ok(
      Math.abs(out.back[k].x - out.scatter[k].x) < 0.5 &&
        Math.abs(out.back[k].y - out.scatter[k].y) < 0.5,
      `${k} returns to its scatter spot`,
    );
  });
});

it("Plot without a y value swarms on its own; with one it stays a scatter", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(40);
    const noY = await window.__draw("Plot", v =>
      v
        .data(data.map(({id, value}) => ({id, value})))
        .groupBy("id")
        .x("value"),
    );
    const scatter = await window.__draw("Plot", v =>
      v.data(data).groupBy("id").x("value").y("other"),
    );
    const ys = data.map(d => scatter.viz._yFunc(d.other));
    return {
      noY: {
        swarm: noY.viz._swarm,
        nan: window.__nan(noY.el),
        circles: window.__circles(noY.el),
      },
      scatter: {
        swarm: scatter.viz._swarm,
        circles: window.__circles(scatter.el),
        ys,
        top:
          scatter.el.querySelector("svg").getBoundingClientRect().top +
          scatter.viz._chartTransform.y,
      },
      ids: data.map(d => d.id),
    };
  });
  assert.deepStrictEqual(out.noY.swarm, {axis: "x", cross: "y", lanes: false});
  assert.strictEqual(out.noY.nan, 0, "no NaN coordinates");
  assert.ok(minGap(out.noY.circles) > -0.5);
  assert.strictEqual(out.scatter.swarm, null);
  out.ids.forEach((id, i) =>
    assert.ok(
      Math.abs(
        out.scatter.circles[id].y - (out.scatter.top + out.scatter.ys[i]),
      ) < 0.5,
      `${id} at its y value`,
    ),
  );
});

it("Beeswarm hover shows the circle's tooltip and dims the others", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(30);
    const {el} = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").x("value").y("region"),
    );
    const target = el.querySelector(
      "[data-key='c3'] circle, circle[data-key='c3']",
    );
    const b = target.getBoundingClientRect();
    target.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: b.left + b.width / 2,
        clientY: b.top + b.height / 2,
        bubbles: true,
      }),
    );
    await new Promise(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 50)),
    );
    const tip = document.querySelector(".d3plus-tooltip");
    const opacity = key => {
      const n = el.querySelector(`[data-key='${key}']`);
      return Number(n.getAttribute("opacity") ?? 1);
    };
    return {
      title: tip
        ? tip.querySelector(".d3plus-tooltip-title").textContent
        : null,
      hovered: opacity("c3"),
      other: opacity("c4"),
    };
  });
  assert.strictEqual(out.title, "c3");
  assert.ok(
    out.other < out.hovered,
    `other circles dim (${out.other} vs ${out.hovered})`,
  );
});

it("Beeswarm paints the same swarm on Canvas, and its circles are pickable", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(80);
    const svg = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").x("value").y("region"),
    );
    const canvas = await window.__draw("Beeswarm", v =>
      v
        .data(data)
        .groupBy("id")
        .x("value")
        .y("region")
        .renderer("canvas")
        .on("click.shape", d => (window.__clicked = d.id)),
    );
    const place = viz => {
      const scene = [];
      const walk = n => {
        if (
          n.type === "circle" &&
          typeof n.key === "string" &&
          /^c\d+$/.test(n.key)
        )
          scene.push(n);
        (n.children || []).forEach(walk);
      };
      viz._chartScene.forEach(walk);
      return Object.fromEntries(
        scene.map(n => [
          n.key,
          [n.transform && n.transform.x, n.transform && n.transform.y, n.r],
        ]),
      );
    };
    const target = place(canvas.viz).c5;
    const node = canvas.el.querySelector("canvas.d3plus-render-canvas");
    const rect = node.getBoundingClientRect();
    const t = canvas.viz._chartTransform;
    node.dispatchEvent(
      new MouseEvent("click", {
        clientX: rect.left + t.x + target[0],
        clientY: rect.top + t.y + target[1],
        bubbles: true,
      }),
    );
    return {
      svg: place(svg.viz),
      canvas: place(canvas.viz),
      clicked: window.__clicked ?? null,
      hasCanvas: !!node,
    };
  });
  assert.ok(out.hasCanvas, "canvas mounted");
  assert.strictEqual(Object.keys(out.canvas).length, 80);
  assert.deepStrictEqual(
    out.canvas,
    out.svg,
    "both backends draw the same layout",
  );
  assert.strictEqual(
    out.clicked,
    "c5",
    "a click on a painted circle reaches its datum",
  );
});

it("Beeswarm repacks on zoom without NaN", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__rows(120);
    const {el, viz} = await window.__draw("Beeswarm", v =>
      v.data(data).groupBy("id").x("value").zoom(true),
    );
    const before = viz._xAxis._d3Scale.domain().slice();
    viz._zoomRescale({k: 3, x: 400 * (1 - 3), y: 250 * (1 - 3)});
    await new Promise(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 50)),
    );
    return {
      before,
      after: viz._xAxis._d3Scale.domain().slice(),
      nan: window.__nan(el),
      circles: window.__circles(el),
    };
  });
  assert.ok(
    out.after[1] - out.after[0] < out.before[1] - out.before[0],
    "x domain narrowed",
  );
  assert.strictEqual(out.nan, 0);
  assert.ok(minGap(out.circles) > -0.5, "zoomed swarm has no overlaps");
});
