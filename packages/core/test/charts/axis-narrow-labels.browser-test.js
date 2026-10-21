import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A crowded axis sizes each label's box to the label's own width. A box
    narrower than the label TextBox's fontMin (8px) used to draw nothing,
    even though its fixed-size text fit, so a 60-point LinePlot lost its
    single-digit labels while showing 11, 14, 17, ….
    Driven in real Chromium for text measurement.
*/

it("crowded point axis — single-digit labels show alongside wider ones", async () => {
  for (const renderer of ["svg", "canvas"]) {
    const r = await render('<div id="viz" style="width:600px;height:400px"></div>', renderer =>
      new Promise(resolve => {
        const data = Array.from({length: 60}, (_, i) => ({id: "A", x: i + 1, y: Math.sin(i / 5) * 10 + 20}));
        const viz = new window.d3plus.LinePlot()
          .data(data).groupBy("id").x("x").y("y")
          .renderer(renderer).duration(0).select("#viz");
        viz.render(() => {
          // the x-axis labels the scene paints, on either renderer
          const shown = [];
          const walk = (node, axis) => {
            if (!node) return;
            const inAxis = axis || node.key === "plot-x-axis";
            if (inAxis && node.type === "text") shown.push(`${node.datum.data.id}`);
            (node.children || []).forEach(c => walk(c, inAxis));
          };
          walk(viz._paintedScene.root, false);
          const boxes = Array.from(document.querySelectorAll("#viz [data-key='plot-x-axis'] text")).map(t => {
            const b = t.getBoundingClientRect();
            return {text: t.textContent, left: b.left, right: b.right};
          });
          resolve({shown, boxes});
        });
      }), renderer);
    // The axis thins its labels evenly, so the ones it keeps run 1, 1 + n,
    // 1 + 2n, …, single digits included.
    const shown = r.shown.map(Number).sort((a, b) => a - b);
    const step = shown[1] - shown[0];
    assert.ok(step > 1, `${renderer}: thins the labels (${r.shown.join(", ")})`);
    assert.deepStrictEqual(shown, Array.from({length: Math.floor(59 / step) + 1}, (_, i) => 1 + i * step),
      `${renderer}: shows every ${step}th label from "1" (${r.shown.join(", ")})`);
    assert.ok(shown.filter(d => d < 10).length >= 2, `${renderer}: shows single-digit labels (${r.shown.join(", ")})`);
    if (renderer === "svg") {
      const texts = r.boxes.map(b => b.text);
      assert.deepStrictEqual(texts.map(Number).sort((a, b) => a - b), shown, `svg draws the labels (${texts.join(", ")})`);
      const sorted = r.boxes.slice().sort((a, b) => a.left - b.left);
      sorted.slice(1).forEach((b, i) =>
        assert.ok(b.left >= sorted[i].right, `"${sorted[i].text}" and "${b.text}" don't overlap`));
    }
  }
});
