import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A BoxWhisker's boxes, medians, whiskers and outliers are siblings in the
    plot's scene, so each needs a key of its own for a redraw to pair it with
    itself. Keyed by array index, the keys repeated, and a redraw that changed
    the categories paired one category's parts with another's: the boxes stayed
    put and morphed into their neighbors, and SVG and Canvas paired the repeats
    differently. Each part is now keyed by its category and the part it draws.
*/

// Runs in the page: draws ABCD, redraws as `next` over a long transition, and
// reports each box's x before, during and after.
const transition = ([renderer, next]) =>
  new Promise(resolve => {
    const rows = cats =>
      cats.flatMap(c => {
        const base = (c.charCodeAt(0) - 64) * 20;
        return [0, 2, 4, 6, 8, 10, 30].map((v, j) => ({id: `${c}${j}`, x: c, y: base + v}));
      });
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus.BoxWhisker()
      .select(el)
      .renderer(renderer)
      .detectVisible(false)
      .legend(false)
      .duration(0)
      .width(600)
      .height(400)
      .groupBy("id")
      .x("x")
      .y("y")
      .data(rows(["A", "B", "C", "D"]));

    // The category a scene node draws, read off its datum.
    const category = datum => {
      for (let d = datum; d; d = d.data) {
        if (typeof d.x === "string") return d.x;
        if (typeof d.key === "string") return d.key;
      }
      return null;
    };
    const isBody = n => n && n.type === "rect" && n.width === 50 && n.height > 1;
    const walk = (nodes, out = []) => {
      for (const n of nodes || []) {
        if (n.type === "group") walk(n.children, out);
        else out.push(n);
      }
      return out;
    };
    const bodies = nodes => {
      const out = {};
      for (const n of walk(nodes)) if (isBody(n)) out[category(n.datum)] = n.transform.x;
      return out;
    };
    // Keys repeated among siblings anywhere in the scene.
    const repeats = nodes => {
      const out = [];
      const visit = (kids, parent) => {
        const seen = new Set();
        for (const n of kids || []) {
          const k = String(n.key);
          if (seen.has(k)) out.push(`${parent}/${k}`);
          seen.add(k);
          if (n.type === "group") visit(n.children, n.key);
        }
      };
      visit(nodes, "root");
      return out;
    };

    viz.render(() => {
      const before = bodies(viz._chartScene);
      const repeated = repeats(viz._chartScene);
      const keys = walk(viz._chartScene)
        .filter(n => category(n.datum) === "B" && n.shapeType)
        .map(n => String(n.key))
        .sort();
      const frames = [];
      const sr = viz._sceneRenderer;
      const svgBodies = () => {
        const out = {};
        for (const r of el.querySelectorAll("rect.d3plus-render-rect")) {
          const d = r.__data__;
          if (!isBody(d)) continue;
          const m = (r.getAttribute("transform") || "").match(/translate\(([^,\s)]+)/);
          out[category(d.datum)] = m ? Number(m[1]) : NaN;
        }
        return out;
      };
      // Tag each SVG element with the category it draws now, to see which
      // category it draws once the redraw reuses it.
      const tagged = [];
      if (renderer === "svg") {
        for (const r of el.querySelectorAll(".d3plus-render-rect, .d3plus-render-path, .d3plus-render-circle")) {
          const d = r.__data__;
          if (d && d.shapeType) tagged.push([r, category(d.datum)]);
        }
      } else {
        const paint = sr._paint.bind(sr);
        sr._paint = scene => {
          frames.push(bodies(scene.root.children));
          return paint(scene);
        };
      }
      let sampling = true;
      const sample = () => {
        if (!sampling) return;
        if (renderer === "svg") frames.push(svgBodies());
        requestAnimationFrame(sample);
      };
      viz.duration(1500).data(rows(next));
      requestAnimationFrame(sample);
      viz.render(() => {
        // Let the last transition frames land before reading the end state.
        setTimeout(() => {
          sampling = false;
          const moved = tagged
            .filter(([r]) => r.isConnected && r.__data__ && r.__data__.shapeType)
            .map(([r, was]) => [was, category(r.__data__.datum)])
            .filter(([was, now]) => was !== now);
          resolve({before, after: bodies(viz._chartScene), frames, repeated, keys, moved});
        }, 300);
      });
    });
  });

// The key check reads the same DCBA redraw the travel check samples.
const runs = new Map();
const transitionOnce = (renderer, next) => {
  const key = `${renderer}:${next.join("")}`;
  if (!runs.has(key)) runs.set(key, render("", transition, [renderer, next]));
  return runs.get(key);
};

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker scene keys are unique and stable per category (${renderer})`, async function () {
    const out = await transitionOnce(renderer, ["D", "C", "B", "A"]);
    assert.deepStrictEqual(out.repeated, [], "no key repeats among its siblings");
    assert.deepStrictEqual(out.keys, [
      "B-box",
      "B-median",
      "B-outlier-6",
      "B-whisker-bottom",
      "B-whisker-bottom-end",
      "B-whisker-bottom::hit",
      "B-whisker-top",
      "B-whisker-top-end",
      "B-whisker-top::hit",
    ]);
  });

  for (const next of [["D", "C", "B", "A"], ["B", "C", "D", "E"]]) {
    it(`BoxWhisker boxes travel with their category, ABCD -> ${next.join("")} (${renderer})`, async function () {
      const out = await transitionOnce(renderer, next);
      assert.deepStrictEqual(out.moved, [], "no SVG element switches category");
      for (const cat of next.filter(c => c in out.before)) {
        const from = out.before[cat];
        const to = out.after[cat];
        const xs = out.frames.map(f => f[cat]).filter(x => x !== undefined);
        const lo = Math.min(from, to) - 1;
        const hi = Math.max(from, to) + 1;
        assert.ok(xs.length > 2, `${cat}: box sampled mid-transition`);
        assert.ok(xs.every(x => x >= lo && x <= hi), `${cat}: box stays between ${from} and ${to}`);
        assert.ok(
          xs.some(x => Math.abs(x - from) > 10 && Math.abs(x - to) > 10),
          `${cat}: box passes between ${from} and ${to} (saw ${xs.map(Math.round)})`,
        );
      }
    });
  }
}

// Runs in the page: finds where B's parts sit in an SVG draw, then points at
// each one in a `renderer` draw and reports what the chart's handlers saw.
const pointAt = renderer =>
  new Promise(resolve => {
    const rows = ["A", "B", "C", "D"].flatMap(c => {
      const base = (c.charCodeAt(0) - 64) * 20;
      return [0, 2, 4, 6, 8, 10, 30].map((v, j) => ({id: `${c}${j}`, x: c, y: base + v}));
    });
    const category = datum => {
      for (let d = datum; d; d = d.data) {
        if (typeof d.x === "string") return d.x;
        if (typeof d.key === "string") return d.key;
      }
      return null;
    };
    document.body.style.margin = "0";
    const el = document.createElement("div");
    document.body.appendChild(el);
    const draw = (kind, on, done) => {
      el.innerHTML = "";
      const viz = new window.d3plus.BoxWhisker()
        .select(el)
        .renderer(kind)
        .detectVisible(false)
        .legend(false)
        .duration(0)
        .width(600)
        .height(400)
        .groupBy("id")
        .x("x")
        .y("y")
        .data(rows);
      for (const [k, fn] of Object.entries(on)) viz.on(k, fn);
      viz.render(() => done(viz));
    };
    draw("svg", {}, () => {
      // B's box body, top whisker line, top whisker end and outlier, found by
      // what they draw rather than by key.
      const parts = {};
      for (const node of el.querySelectorAll("svg [class*='d3plus-render-']")) {
        const d = node.__data__;
        if (!d || !d.shapeType || category(d.datum) !== "B" || String(d.key).endsWith("::hit")) continue;
        const b = node.getBoundingClientRect();
        const at = [b.left + b.width / 2, b.top + b.height / 2];
        if (d.shapeType === "Circle") parts.outlier = at;
        else if (d.shapeType === "Line") {
          if (!parts.whisker || at[1] < parts.whisker[1]) parts.whisker = at;
        } else if (d.width === 50 && d.height > 1) parts.box = at;
        else if (d.width === 20 && (!parts.end || at[1] < parts.end[1])) parts.end = at;
      }
      const seen = [];
      const log = shape => d => seen.push({shape, category: category(d)});
      draw(renderer, {"mousemove.Rect": log("Rect"), "mousemove.Line": log("Line"), "mousemove.Circle": log("Circle")}, () => {
        const out = {};
        for (const [part, [x, y]] of Object.entries(parts)) {
          seen.length = 0;
          const target = renderer === "canvas" ? el.querySelector("canvas") : document.elementFromPoint(x, y);
          target.dispatchEvent(new MouseEvent("mousemove", {bubbles: true, clientX: x, clientY: y}));
          out[part] = seen.slice();
        }
        resolve(out);
      });
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker: pointing at a box part reports that part (${renderer})`, async function () {
    const out = await render("", pointAt, renderer);
    assert.deepStrictEqual(out, {
      box: [{shape: "Rect", category: "B"}],
      end: [{shape: "Rect", category: "B"}],
      outlier: [{shape: "Circle", category: "B"}],
      whisker: [{shape: "Line", category: "B"}],
    });
  });
}
