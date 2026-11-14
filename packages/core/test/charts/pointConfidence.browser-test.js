/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Error bars on points, on SVG and Canvas: `confidence` draws a vertical
    error bar on each Scatter point, and `{x: [...], y: [...]}` adds a
    horizontal one (a cross), widens the x axis, and lists both axes'
    bounds in the point's tooltip.
*/

const probe = ([renderer, confidence]) =>
  new Promise(resolve => {
    const rows = [
      {id: "a", x: 10, xl: 6, xh: 13, y: 5, yl: 4, yh: 7},
      {id: "b", x: 20, xl: 15, xh: 30, y: 9, yl: 6, yh: 11},
    ];
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
      const viz = new window.d3plus.Scatter()
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
        .confidence(confidence)
        .data(rows);
      viz.render(() => done(viz));
    };
    draw("svg", svgViz => {
      const dot = el.querySelector('[data-key="b"]').getBoundingClientRect();
      const at = [dot.left + dot.width / 2, dot.top + dot.height / 2];
      const order = walk(svgViz._chartScene).map(n => String(n.key));
      draw(renderer, viz => {
        const bars = walk(viz._chartScene).filter(n =>
          String(n.key).endsWith("::confidence"),
        );
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
          setTimeout(() => {
            const tip = document.querySelector(".d3plus-tooltip");
            resolve({
              bars: bars.map(n => ({
                key: n.key,
                shapeType: n.shapeType,
                strokes: n.d.split("M").length - 1,
              })),
              // Error bars paint beneath their points.
              below: order.indexOf("b::confidence") < order.indexOf("b"),
              x: viz._xAxis._d3Scale.domain(),
              rows: tip
                ? Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
                    Array.from(tr.querySelectorAll("td")).map(
                      td => td.textContent,
                    ),
                  )
                : [],
            });
          }, 60),
        );
      });
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Scatter: confidence draws a capped vertical error bar on each point (${renderer})`, async function () {
    const r = await render("", probe, [renderer, ["yl", "yh"]]);
    assert.deepStrictEqual(r.bars, [
      {key: "a::confidence", shapeType: "Circle", strokes: 3},
      {key: "b::confidence", shapeType: "Circle", strokes: 3},
    ]);
    assert.ok(r.below);
    // The x axis isn't stretched by y's bounds.
    assert.ok(r.x[0] > 4, `${r.x}`);
    assert.deepStrictEqual(r.rows, [
      ["Lower Bound", "6"],
      ["Upper Bound", "11"],
    ]);
  });

  it(`Scatter: {x, y} bounds draw a cross, widen x, and list both axes in the tooltip (${renderer})`, async function () {
    const r = await render("", probe, [
      renderer,
      {x: ["xl", "xh"], y: ["yl", "yh"]},
    ]);
    assert.deepStrictEqual(
      r.bars.map(b => b.strokes),
      [6, 6],
    );
    assert.ok(r.x[0] <= 6 && r.x[1] >= 30, `${r.x}`);
    assert.deepStrictEqual(r.rows, [
      ["Lower Bound (x)", "15"],
      ["Upper Bound (x)", "30"],
      ["Lower Bound (y)", "6"],
      ["Upper Bound (y)", "11"],
    ]);
  });
}
