import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    A timeline click lives inside the zoomable chart surface. d3-brush stops
    the click's mouseup from reaching d3-zoom, so a zoom gesture started by
    the same press would never end, and every later mousemove would repaint
    the chart instantly — snapping the transition the click just started to
    its end. The mouse moving right after a click must leave it animating.
*/
it("moving the mouse after a timeline click leaves the chart's transition running", async function () {
  this.timeout(60000);

  const out = await render('<div id="viz" style="width:600px;height:400px;"></div>', () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const data = ["A", "B", "C"].flatMap((id, i) =>
      [2019, 2020, 2021].map((year, y) => ({id, year, value: 10 + ((i * 7 + y * 5) % 9) * 5})));
    const viz = new window.d3plus.Treemap()
      .select("#viz")
      .data(data)
      .groupBy("id")
      .sum("value")
      .time("year")
      .duration(1500);
    return new Promise(resolve => viz.render(resolve)).then(async () => {
      await wait(1700);
      const draws = [];
      const renderer = viz._sceneRenderer;
      const drawScene = renderer.drawScene.bind(renderer);
      renderer.drawScene = (scene, opts) => {
        draws.push(opts && opts.duration ? opts.duration : 0);
        return drawScene(scene, opts);
      };

      const tile = () => document.querySelector('rect[data-key="treemap-A"]');
      const width = () => Number(tile().getAttribute("width"));
      const start = width();

      const label = [...document.querySelectorAll("text")].find(t => t.textContent.trim() === "2019");
      const box = label.getBoundingClientRect();
      const at = {clientX: box.x + box.width / 2, clientY: box.y + box.height / 2};
      const press = document.elementFromPoint(at.clientX, at.clientY);
      const fire = (el, type, point) => el.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window, button: 0, detail: 1, ...point,
      }));
      fire(press, "mousedown", at);
      fire(press, "mouseup", at);
      fire(press, "click", at);

      for (let i = 0; i < 100 && !draws.some(d => d > 0); i++) await wait(10);
      const animated = draws.length;
      const widths = [];
      for (let i = 0; i < 8; i++) {
        fire(document, "mousemove", {clientX: at.clientX + 5 * (i + 1), clientY: at.clientY - 20 * (i + 1)});
        await wait(40);
        widths.push(width());
      }
      const instant = draws.slice(animated).filter(d => d === 0).length;
      await wait(1700);
      return {
        pressed: press.getAttribute("class"),
        draws, instant, start, widths, end: width(),
      };
    });
  });

  assert.strictEqual(out.pressed, "overlay", "the press lands on the timeline's brush");
  assert.ok(out.draws.some(d => d > 0), `the click starts an animated draw: ${out.draws.join(", ")}`);
  assert.notStrictEqual(out.end, out.start, "the tile changes size for the new year");
  assert.strictEqual(out.instant, 0, "mousemoves after the click don't repaint the chart");
  const between = out.widths.filter(w => (w - out.start) * (w - out.end) < 0);
  assert.ok(
    between.length >= 2,
    `the tile passes through intermediate sizes (${out.start} → ${out.end}): ${out.widths.join(", ")}`,
  );
});
