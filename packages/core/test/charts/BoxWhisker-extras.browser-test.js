/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    BoxWhisker's extras in a real browser, on SVG and Canvas: a mean diamond
    and jittered observation points by default, notches and widths by count
    on request, and tooltips that list a box's mean and notch and a point's
    value.
*/

const probe = ([renderer, config, hover]) =>
  new Promise(resolve => {
    const rows = [];
    [
      ["A", 40, [10, 20, 30, 35, 40, 45, 50, 60, 70, 140]],
      ["B", 10, [30, 35, 40, 45, 50]],
    ].forEach(([cat, , values]) =>
      values.forEach((v, k) => rows.push({id: `${cat}${k}`, cat, v})),
    );
    document.body.style.margin = "0";
    const el = document.createElement("div");
    document.body.appendChild(el);
    const walk = (nodes, out = []) => {
      for (const n of nodes || []) {
        if (n.type === "group") walk(n.children, out);
        else out.push(n);
      }
      return out;
    };
    const draw = (kind, done) => {
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
        .x("cat")
        .y("v")
        .config(config)
        .data(rows);
      viz.render(() => done(viz));
    };
    const tooltip = () => {
      const tip = document.querySelector(".d3plus-tooltip");
      return tip
        ? {
            title: tip.querySelector(".d3plus-tooltip-title").textContent,
            rows: Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
              Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
            ),
          }
        : null;
    };
    // The scene's box parts, and the page point of the part `hover` names.
    draw("svg", svgViz => {
      const keyed = {};
      for (const n of walk(svgViz._chartScene)) keyed[n.key] = n;
      const target = hover && el.querySelector(`[data-key="${hover}"]`);
      const box = target && target.getBoundingClientRect();
      const at = box && [box.left + box.width / 2, box.top + box.height / 2];
      draw(renderer, viz => {
        const nodes = walk(viz._chartScene).filter(
          n => !String(n.key).endsWith("::hit"),
        );
        const scene = nodes.map(n => ({
          key: n.key,
          type: n.type,
          x: n.transform?.x,
          y: n.transform?.y,
          width: n.width,
          d: n.d,
        }));
        if (!at) return resolve({scene});
        const surface =
          renderer === "canvas"
            ? el.querySelector("canvas")
            : document.elementFromPoint(...at);
        surface.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            clientX: at[0],
            clientY: at[1],
          }),
        );
        requestAnimationFrame(() =>
          setTimeout(() => resolve({scene, tip: tooltip()}), 60),
        );
      });
    });
  });

const run = (renderer, config, hover) =>
  render("", probe, [renderer, config, hover]);
const byKey = scene => Object.fromEntries(scene.map(n => [n.key, n]));

for (const renderer of ["svg", "canvas"]) {
  it(`BoxWhisker: a mean diamond and jittered points by default (${renderer})`, async function () {
    const {scene} = await run(renderer, {});
    const nodes = byKey(scene);
    for (const cat of ["A", "B"]) {
      assert.strictEqual(nodes[`${cat}-mean`].type, "path");
      assert.strictEqual(nodes[`${cat}-box`].type, "rect");
    }
    // A's mean (45) sits above its median (42.5): fewer pixels down.
    assert.ok(nodes["A-mean"].y < nodes["A-median"].y);
    const points = scene.filter(n => String(n.key).includes("-point-"));
    // Every observation but A's outlier (140) is a point.
    assert.strictEqual(points.length, 14);
    const center = nodes["A-box"].x;
    const aPoints = points.filter(n => n.key.startsWith("A-"));
    assert.ok(
      aPoints.some(n => Math.abs(n.x - center) > 3),
      "jittered",
    );
    assert.ok(
      aPoints.every(n => Math.abs(n.x - center) <= 15.01),
      "inside 0.6 of the box",
    );
    assert.ok(!scene.some(n => Number.isNaN(n.x) || Number.isNaN(n.y)));
  });

  it(`BoxWhisker: notches and widths by count (${renderer})`, async function () {
    const {scene} = await run(renderer, {
      boxNotch: true,
      boxWidthByCount: true,
      boxPoints: false,
      boxMean: false,
    });
    const nodes = byKey(scene);
    assert.strictEqual(nodes["A-box"].type, "path");
    assert.ok(nodes["A-box"].d.split("L").length === 10, "a notched outline");
    // B holds half of A's observations: √0.5 of its width.
    assert.ok(
      Math.abs(
        nodes["B-median"].width / nodes["A-median"].width - Math.SQRT1_2,
      ) < 1e-6,
    );
    assert.ok(!scene.some(n => String(n.key).includes("-point-")));
    assert.strictEqual(nodes["A-mean"], undefined);
  });

  it(`BoxWhisker: a box's tooltip lists its mean and notch; a point's, its value (${renderer})`, async function () {
    const box = await run(
      renderer,
      {boxNotch: true, boxPoints: false},
      "B-box",
    );
    assert.deepStrictEqual(box.tip.rows, [
      ["Upper Whisker", "50"],
      ["Upper Quartile", "45"],
      ["Median", "40"],
      // The notch follows its median; the mean takes its place by value.
      ["Notch", "32.9 – 47.1"],
      ["Mean", "40"],
      ["Lower Quartile", "35"],
      ["Lower Whisker", "30"],
    ]);
    const point = await run(renderer, {boxMean: false}, "B-point-B4");
    assert.strictEqual(point.tip.title, "B4");
    assert.deepStrictEqual(point.tip.rows, [["v", "50"]]);
  });
}
