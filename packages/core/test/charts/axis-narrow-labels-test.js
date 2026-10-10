import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A crowded axis sizes each label's box to the label's own width. A box
    narrower than the label TextBox's fontMin (8px) used to draw nothing,
    even though its fixed-size text fit, so a 60-point LinePlot lost its
    single-digit labels (1, 3, 5, 7, 9) while showing 11, 14, 17, ….
    Driven in real Chromium for text measurement.
*/

after(closeBrowser);

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
    for (const label of ["1", "3", "5", "7", "9"])
      assert.ok(r.shown.includes(label), `${renderer}: shows "${label}" (${r.shown.join(", ")})`);
    if (renderer === "svg") {
      const texts = r.boxes.map(b => b.text);
      assert.ok(texts.includes("1") && texts.includes("60"), `svg draws the labels (${texts.join(", ")})`);
      const sorted = r.boxes.slice().sort((a, b) => a.left - b.left);
      sorted.slice(1).forEach((b, i) =>
        assert.ok(b.left >= sorted[i].right, `"${sorted[i].text}" and "${b.text}" don't overlap`));
    }
  }
});
