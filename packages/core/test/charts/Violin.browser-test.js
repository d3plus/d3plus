/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Violin in a real browser: one mirrored density curve per group on a
    category axis, vertical or horizontal, scaled against each other by
    `densityScale`, with the `inner` overlays, dodged and split two-level
    groups, tooltips on both backends, translated labels, and small multiples.
*/

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  let s = 5;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
  window.__rows = () => {
    s = 5;
    const groups = [
      ["low", 2, 0.5],
      ["mid", 5, 1],
      ["high", 8, 0.5],
    ];
    return groups.flatMap(([id, mean, sd], g) =>
      Array.from({length: 30 + g * 10}, (_, i) => ({
        id,
        side: i % 2 ? "L" : "R",
        f: i % 2 ? "one" : "two",
        v: mean + sd * normal(),
      })),
    );
  };
  // Bounding boxes of the density areas, keyed by group.
  window.__areas = el =>
    Object.fromEntries(
      Array.from(el.querySelectorAll("path[data-key^='density-']"))
        .filter(
          p =>
            !/^density-(box|q1|q3|median|point)-/.test(
              p.getAttribute("data-key"),
            ),
        )
        .map(p => {
          const b = p.getBoundingClientRect();
          return [
            p.getAttribute("data-key").slice(8),
            {
              left: b.left,
              right: b.right,
              top: b.top,
              bottom: b.bottom,
              cx: (b.left + b.right) / 2,
              cy: (b.top + b.bottom) / 2,
            },
          ];
        }),
    );
  window.__ticks = (el, axis) =>
    Object.fromEntries(
      Array.from(
        el.querySelectorAll(
          `[data-key='plot-${axis}-axis'] text, g[data-key^='plot-${axis}'] text`,
        ),
      ).map(t => {
        const b = t.getBoundingClientRect();
        return [
          t.textContent,
          {x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2},
        ];
      }),
    );
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n =>
      Array.from(n.attributes).some(a => a.value.includes("NaN")),
    ).length;
  // Each density area's enter start against its own d: the commands of both,
  // whether each enterD point keeps d's value-axis coordinate, and where each
  // lands on the collapsed axis, in client pixels.
  window.__enter = (el, axis) =>
    Array.from(el.querySelectorAll("path[data-key^='density-']"))
      .filter(
        p =>
          !/^density-(box|q1|q3|median|point)-/.test(
            p.getAttribute("data-key"),
          ),
      )
      .map(p => {
        const n = p.__data__;
        const cmds = d => d.replace(/[-+\d.,e\s]+/gi, "");
        const pairs = d => {
          const nums = d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi).map(Number);
          return Array.from({length: nums.length / 2}, (_, i) => [
            nums[2 * i],
            nums[2 * i + 1],
          ]);
        };
        const t = n.transform || {};
        const flat = axis === "x" ? 0 : 1;
        const m = p.parentNode.getScreenCTM();
        const toGlobal = v => {
          const local = (t[axis] || 0) + v * (t.scale ?? 1);
          return axis === "x" ? m.e + local * m.a : m.f + local * m.d;
        };
        return {
          key: n.key,
          same: cmds(n.enterD) === cmds(n.d),
          lines: pairs(n.enterD).map(q => toGlobal(q[flat])),
          kept: pairs(n.enterD).every(
            (q, i) => Math.abs(q[1 - flat] - pairs(n.d)[i][1 - flat]) < 1e-6,
          ),
          opacity: n.paint.opacity,
        };
      });
  window.__z = 0;
  window.__draw = (configure, size = [800, 500]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      // Every chart sits in the viewport, the newest on top.
      el.style.cssText = `position:absolute;top:0;left:0;background:#fff;z-index:${++window.__z};width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus.Violin()
        .select(el)
        .detectVisible(false)
        .duration(0)
        .width(size[0])
        .height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  // The text of the tooltip a hover filled in (each chart has its own).
  window.__hover = async (target, x, y) => {
    const tips = () => Array.from(document.querySelectorAll(".d3plus-tooltip"));
    const text = t => t.innerText.replace(/\s+/g, " ").trim();
    const before = new Map(tips().map(t => [t, text(t)]));
    target.dispatchEvent(
      new MouseEvent("mousemove", {clientX: x, clientY: y, bubbles: true}),
    );
    await new Promise(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 50)),
    );
    const tip = tips()
      .reverse()
      .find(t => text(t) && before.get(t) !== text(t));
    return tip ? text(tip) : "";
  };
};

const run = fn => render("", new Function(`return (${helpers})(), (${fn})();`));

it("Violin draws one mirrored violin per group on the value axis", async function () {
  const out = await run(async () => {
    const {el, viz} = await window.__draw(v =>
      v.data(window.__rows()).groupBy("id").value("v").inner(false),
    );
    const yDomain = viz._yAxis._d3Scale.domain();
    return {
      areas: window.__areas(el),
      ticks: window.__ticks(el, "x"),
      nan: window.__nan(el),
      yDomain,
      yTitle: viz._yConfig.title,
      y: [2, 8].map(v => viz._yAxis._getPosition(v)),
    };
  });
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.deepStrictEqual(Object.keys(out.areas), ["low", "mid", "high"]);
  ["low", "mid", "high"].forEach(id => {
    const a = out.areas[id];
    assert.ok(out.ticks[id], `category tick ${id}`);
    assert.ok(
      Math.abs(a.cx - out.ticks[id].x) < 1.5,
      `${id} centered on its tick`,
    );
  });
  assert.ok(
    out.areas.low.cx < out.areas.mid.cx && out.areas.mid.cx < out.areas.high.cx,
    "data order",
  );
  assert.ok(out.areas.high.cy < out.areas.low.cy, "higher values sit higher");
  assert.ok(
    out.yDomain[0] > 8 && out.yDomain[1] < 2,
    "value axis covers every curve",
  );
  assert.strictEqual(out.yTitle, "v");
});

it("Violin: densityScale area keeps equal areas, width equal widths", async function () {
  const out = await run(async () => {
    const widths = async scale => {
      const {el} = await window.__draw(v =>
        v
          .data(window.__rows())
          .groupBy("id")
          .value("v")
          .inner(false)
          .densityScale(scale),
      );
      const areas = window.__areas(el);
      return Object.fromEntries(
        Object.entries(areas).map(([k, a]) => [
          k,
          {w: a.right - a.left, h: a.bottom - a.top},
        ]),
      );
    };
    return {area: await widths("area"), width: await widths("width")};
  });
  const {area, width} = out;
  assert.ok(
    Math.abs(width.low.w - width.mid.w) < 2 &&
      Math.abs(width.mid.w - width.high.w) < 2,
    "width: equal widths",
  );
  assert.ok(
    area.mid.w < area.low.w * 0.75,
    "area: the wider spread draws narrower",
  );
  const maxArea = Math.max(area.low.w, area.mid.w, area.high.w);
  assert.ok(
    Math.abs(maxArea - width.low.w) < 2,
    "the widest violin fills its band either way",
  );
});

it("Violin draws horizontally with discrete('y')", async function () {
  const out = await run(async () => {
    const {el, viz} = await window.__draw(v =>
      v
        .data(window.__rows())
        .groupBy("id")
        .value("v")
        .discrete("y")
        .inner(false),
    );
    return {
      areas: window.__areas(el),
      ticks: window.__ticks(el, "y"),
      xTitle: viz._xConfig.title,
      yTitle: viz._yConfig.title,
      nan: window.__nan(el),
    };
  });
  assert.strictEqual(out.nan, 0);
  assert.ok(out.areas.high.cx > out.areas.low.cx, "values run along x");
  ["low", "mid", "high"].forEach(id =>
    assert.ok(
      Math.abs(out.areas[id].cy - out.ticks[id].y) < 1.5,
      `${id} centered on its tick`,
    ),
  );
  assert.strictEqual(out.xTitle, "v");
  assert.strictEqual(out.yTitle, undefined);
});

it("Violin grows each violin out of its center line, vertical and horizontal", async function () {
  const out = await run(async () => {
    const probe = async discrete => {
      const {el} = await window.__draw(v =>
        v
          .data(window.__rows())
          .groupBy("id")
          .value("v")
          .discrete(discrete)
          .inner(["box", "quartiles"]),
      );
      const axis = discrete === "y" ? "y" : "x";
      const lines = Array.from(
        el.querySelectorAll("[data-key='violin-quartiles'] path"),
      ).map(p => p.__data__);
      const rects = Array.from(
        el.querySelectorAll("[data-key='violin-box'] rect"),
      ).map(r => r.__data__);
      return {
        enter: window.__enter(el, axis),
        ticks: window.__ticks(el, axis),
        quartiles: lines.every(
          n =>
            n.enterD &&
            n.enterD
              .match(/-?[\d.]+/g)
              .filter((_, i) => i % 2 === (axis === "x" ? 0 : 1))
              .every(v => Math.abs(v) < 1e-6),
        ),
        box:
          rects.length > 0 &&
          rects.every(
            n =>
              n.enterRect &&
              n.enterRect[axis === "x" ? "width" : "height"] === 0,
          ),
        boxGroups: Array.from(
          el.querySelectorAll("[data-key='violin-box'] > [data-key]"),
        ).map(g => {
          const keys = Array.from(g.children).map(c =>
            c.getAttribute("data-key"),
          );
          return [
            g.getAttribute("data-key"),
            new Set(keys).size === keys.length,
          ];
        }),
      };
    };
    return {vertical: await probe("x"), horizontal: await probe("y")};
  });
  Object.entries(out).forEach(
    ([orient, {enter, ticks, quartiles, box, boxGroups}]) => {
      assert.deepStrictEqual(
        boxGroups,
        [
          ["density-box-low", true],
          ["density-box-mid", true],
          ["density-box-high", true],
        ],
        `${orient}: one box group per violin, keys unique`,
      );
      assert.strictEqual(enter.length, 3, `${orient}: one start per violin`);
      enter.forEach(e => {
        const id = e.key.slice(8);
        const tick = ticks[id][orient === "vertical" ? "x" : "y"];
        assert.ok(e.same, `${orient} ${id}: enterD has d's commands`);
        assert.ok(
          e.kept,
          `${orient} ${id}: every point keeps its value-axis position`,
        );
        assert.ok(
          e.lines.every(v => Math.abs(v - tick) < 1.5),
          `${orient} ${id}: zero width on its center line`,
        );
        assert.strictEqual(e.opacity, 1);
      });
      assert.ok(
        quartiles,
        `${orient}: quartile lines collapse onto the center line`,
      );
      assert.ok(box, `${orient}: the box widens out of its center line`);
    },
  );
});

it("Violin starts entering violins on their center line and morphs updates from the old shape", async function () {
  const out = await run(async () => {
    const {el, viz} = await window.__draw(v =>
      v
        .data(window.__rows().filter(d => d.id !== "high"))
        .groupBy("id")
        .value("v")
        .inner(false),
    );
    const before = Object.fromEntries(
      Array.from(el.querySelectorAll("path[data-key^='density-']")).map(p => [
        p.getAttribute("data-key"),
        p.getAttribute("d"),
      ]),
    );
    viz.duration(5000).data(window.__rows()).render();
    for (
      let i = 0;
      i < 100 && !el.querySelector("path[data-key='density-high']");
      i++
    )
      await new Promise(resolve => setTimeout(resolve, 10));
    const now = Object.fromEntries(
      Array.from(el.querySelectorAll("path[data-key^='density-']")).map(p => [
        p.getAttribute("data-key"),
        {
          d: p.getAttribute("d"),
          enterD: p.__data__.enterD,
          final: p.__data__.d,
        },
      ]),
    );
    return {before, now};
  });
  const near = (a, b) => {
    const [x, y] = [a, b].map(s =>
      s.match(/-?[\d.]+(?:e[-+]?\d+)?/gi).map(Number),
    );
    return x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) < 2);
  };
  assert.ok(
    near(out.now["density-high"].d, out.now["density-high"].enterD),
    "the entering violin starts at its enterD",
  );
  assert.ok(
    !near(out.now["density-high"].d, out.now["density-high"].final),
    "and grows from there",
  );
  ["density-low", "density-mid"].forEach(k =>
    assert.ok(
      near(out.now[k].d, out.before[k]),
      `${k} morphs from its old shape`,
    ),
  );
});

it("Violin inner overlays: box, quartiles, and swarmed points", async function () {
  const out = await run(async () => {
    const count = async inner => {
      const {el} = await window.__draw(v =>
        v.data(window.__rows()).groupBy("id").value("v").inner(inner),
      );
      const overlays = Array.from(
        el.querySelectorAll(
          "[data-key='violin-box'] *, [data-key='violin-quartiles'] *",
        ),
      );
      const inert = overlays.every(
        n => n.getAttribute("pointer-events") === "none",
      );
      return {
        box: el.querySelectorAll("[data-key='violin-box'] rect").length,
        lines: new Set(
          Array.from(
            el.querySelectorAll("[data-key='violin-quartiles'] path"),
          ).map(n => n.getAttribute("data-key").replace("::hit", "")),
        ).size,
        points: el.querySelectorAll("[data-key='violin-points'] circle").length,
        inert,
        nan: window.__nan(el),
      };
    };
    return {
      box: await count("box"),
      quartiles: await count("quartiles"),
      points: await count("points"),
      all: await count(["box", "quartiles", "points"]),
      none: await count(false),
    };
  });
  assert.ok(out.box.box >= 3, "a box per violin");
  assert.strictEqual(out.box.lines, 0);
  assert.strictEqual(out.quartiles.lines, 9, "three lines per violin");
  assert.strictEqual(
    out.points.points,
    30 + 40 + 50,
    "one circle per observation",
  );
  assert.ok(
    out.all.box >= 3 && out.all.lines === 9 && out.all.points === 120,
    "overlays combine",
  );
  assert.ok(
    out.box.inert && out.quartiles.inert,
    "box and lines let the pointer through",
  );
  assert.deepStrictEqual(
    [out.none.box, out.none.lines, out.none.points],
    [0, 0, 0],
  );
  Object.values(out).forEach(o => assert.strictEqual(o.nan, 0));
});

it("Violin's inner box takes innerConfig.box.texture", async function () {
  const out = await run(async () => {
    const boxes = async innerConfig => {
      const {viz} = await window.__draw(v =>
        v
          .data(window.__rows())
          .groupBy("id")
          .value("v")
          .inner("box")
          .innerConfig(innerConfig),
      );
      const walk = (nodes, inBox, out = []) => {
        (nodes || []).forEach(n => {
          const box = inBox || n.key === "violin-box";
          if (box && n.type === "rect" && !`${n.key}`.endsWith("::hit"))
            out.push(String(n.paint && n.paint.fill));
          walk(n.children, box, out);
        });
        return out;
      };
      return walk(viz._chartScene, false);
    };
    return {
      textured: await boxes({box: {texture: "lines"}}),
      plain: await boxes({}),
    };
  });
  assert.ok(out.textured.length >= 3, "a box per violin");
  assert.ok(
    out.textured.some(f => f.startsWith("pattern:")),
    `the boxes are textured (${out.textured.join(", ")})`,
  );
  assert.ok(
    !out.plain.some(f => f.startsWith("pattern:")),
    "no texture without one configured",
  );
});

it("Violin dodges two groupBy levels, or splits them", async function () {
  const out = await run(async () => {
    const draw = async split => {
      const {el} = await window.__draw(v =>
        v
          .data(window.__rows())
          .groupBy(["id", "side"])
          .value("v")
          .inner(false)
          .split(split),
      );
      return {areas: window.__areas(el), ticks: window.__ticks(el, "x")};
    };
    return {dodged: await draw(false), split: await draw(true)};
  });
  const {dodged, split} = out;
  assert.strictEqual(Object.keys(dodged.areas).length, 6);
  const lowL = dodged.areas.low_L,
    lowR = dodged.areas.low_R;
  assert.ok(
    lowR.right <= lowL.left + 1 || lowL.right <= lowR.left + 1,
    "side by side without overlap",
  );
  assert.ok(
    Math.abs((lowL.cx + lowR.cx) / 2 - dodged.ticks.low.x) < 2,
    "the pair centers on its category",
  );
  const sL = split.areas.low_R,
    sR = split.areas.low_L;
  const center = split.ticks.low.x;
  assert.ok(Math.abs(sL.right - center) < 1.5, "first half ends at the center");
  assert.ok(
    Math.abs(sR.left - center) < 1.5,
    "second half starts at the center",
  );
});

it("Violin tooltips show the distribution on SVG and Canvas, translated", async function () {
  // One chart per page: a page's charts would share their tooltip elements.
  const hover = (id, configure) =>
    run(
      new Function(`return (async () => {
      const config = v => (${configure})(v.data(window.__rows()).groupBy("id").value("v").inner(false));
      const svg = await window.__draw(v => config(v).renderer("svg"));
      const a = window.__areas(svg.el)["${id}"];
      const rect = svg.el.getBoundingClientRect();
      svg.el.remove();
      const {el, viz} = await window.__draw(config);
      const target = viz.renderer() === "canvas"
        ? el.querySelector("canvas.d3plus-render-canvas")
        : el.querySelector("path[data-key='density-${id}']");
      const box = el.getBoundingClientRect();
      return window.__hover(target, box.left + a.cx - rect.left, box.top + a.cy - rect.top);
    })()`),
    );
  const svgTip = await hover("mid", "v => v");
  const canvasTip = await hover("high", "v => v.renderer('canvas')");
  const esTip = await hover("low", "v => v.locale('es-ES')");
  for (const [tip, id, n] of [
    [svgTip, "mid", 40],
    [canvasTip, "high", 50],
  ]) {
    assert.ok(tip.startsWith(id), `titled by the group: ${tip}`);
    assert.ok(tip.includes(`Observations ${n}`), `observation count: ${tip}`);
    [
      "Maximum",
      "Upper Quartile",
      "Median",
      "Lower Quartile",
      "Minimum",
    ].forEach(label => assert.ok(tip.includes(label), `${label}: ${tip}`));
  }
  ["Mediana", "Cuartil Superior", "Máximo", "Mínimo", "Observaciones"].forEach(
    label => assert.ok(esTip.includes(label), `${label}: ${esTip}`),
  );
});

it("Violin points show each observation's value", async function () {
  const out = await run(async () => {
    const {el} = await window.__draw(v =>
      v.data(window.__rows()).groupBy("id").value("v").inner("points"),
    );
    const c = el.querySelector(
      "circle[data-key^='density-point-mid-'], [data-key^='density-point-mid-'] circle",
    );
    const b = c.getBoundingClientRect();
    return window.__hover(c, (b.left + b.right) / 2, (b.top + b.bottom) / 2);
  });
  assert.ok(/^mid v \d/.test(out), `value row: ${out}`);
});

it("Violin orders categories by median and draws small multiples", async function () {
  const out = await run(async () => {
    const sorted = await window.__draw(v =>
      v
        .data(window.__rows())
        .groupBy("id")
        .value("v")
        .medianSort("descending")
        .inner(false),
    );
    const faceted = await window.__draw(
      v =>
        v
          .data(window.__rows())
          .groupBy("id")
          .value("v")
          .facet("f")
          .inner(false),
      [900, 400],
    );
    const areas = window.__areas(sorted.el);
    return {
      order: Object.entries(areas)
        .sort((a, b) => a[1].cx - b[1].cx)
        .map(([k]) => k),
      panels: (faceted.viz._facetPanels || []).length,
      facetAreas: faceted.el.querySelectorAll("path[data-key*='density-']")
        .length,
      nan: window.__nan(faceted.el),
    };
  });
  assert.deepStrictEqual(out.order, ["high", "mid", "low"]);
  assert.strictEqual(out.panels, 2);
  assert.ok(
    out.facetAreas >= 6,
    `a violin per group per panel (${out.facetAreas})`,
  );
  assert.strictEqual(out.nan, 0);
});

it("Violin redraws with new data and an empty dataset", async function () {
  const out = await run(async () => {
    const {el, viz} = await window.__draw(v =>
      v.data(window.__rows()).groupBy("id").value("v"),
    );
    await new Promise(resolve =>
      viz.data(window.__rows().filter(d => d.id !== "low")).render(resolve),
    );
    const after = Object.keys(window.__areas(el));
    await new Promise(resolve => viz.data([]).render(resolve));
    return {after, empty: Object.keys(window.__areas(el)).length};
  });
  assert.deepStrictEqual(out.after, ["mid", "high"]);
  assert.strictEqual(out.empty, 0);
});
