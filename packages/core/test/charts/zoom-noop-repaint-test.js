import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    d3-zoom emits a zoom event for every mousemove of a drag, even one that
    can't move the view (a drag at 1×). Repainting for those would redraw the
    chart instantly, snapping a running transition to its end; a drag that
    does pan a zoomed-in chart must still repaint.
*/
it("dragging an unzoomed chart leaves its transition running; panning a zoomed one repaints", async function () {
  this.timeout(60000);

  const out = await render('<div id="viz" style="width:600px;height:400px;"></div>', () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const before = [{id: "A", value: 10}, {id: "B", value: 30}, {id: "C", value: 20}];
    const after = [{id: "A", value: 45}, {id: "B", value: 10}, {id: "C", value: 20}];
    const viz = new window.d3plus.Treemap()
      .select("#viz")
      .data(before)
      .groupBy("id")
      .sum("value")
      .zoom(true)
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
      const tile = () => document.querySelector('rect[data-key="treemap-C"]');
      const width = () => Number(tile().getAttribute("width"));
      const fire = (el, type, point) => el.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window, button: 0, detail: 1, ...point,
      }));
      const drag = async (from, steps) => {
        const press = document.elementFromPoint(from.clientX, from.clientY);
        fire(press, "mousedown", from);
        const widths = [];
        for (let i = 1; i <= steps; i++) {
          fire(window, "mousemove", {clientX: from.clientX - 15 * i, clientY: from.clientY - 10 * i});
          await wait(40);
          widths.push(width());
        }
        fire(window, "mouseup", {clientX: from.clientX - 15 * steps, clientY: from.clientY - 10 * steps});
        return widths;
      };

      const box = tile().getBoundingClientRect();
      const at = {clientX: box.x + box.width / 2, clientY: box.y + box.height / 2};
      const start = width();
      viz.data(after).render();
      for (let i = 0; i < 100 && !draws.some(d => d > 0); i++) await wait(10);
      const animated = draws.length;
      const widths = await drag(at, 8);
      const instant = draws.slice(animated).filter(d => d === 0).length;
      await wait(1700);
      const end = width();

      // Zoom in, then pan: those drags move the view and must repaint.
      const surface = viz._zoomEventTarget.node();
      surface.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true, cancelable: true, view: window, ctrlKey: true, deltaY: -300, ...at,
      }));
      await wait(100);
      const zoomedDraws = draws.length;
      await drag(at, 4);
      const pans = draws.slice(zoomedDraws).filter(d => d === 0).length;
      return {draws, instant, start, widths, end, pans};
    });
  });

  assert.ok(out.draws.some(d => d > 0), `the data change starts an animated draw: ${out.draws.join(", ")}`);
  assert.notStrictEqual(out.end, out.start, "the tile changes size for the new data");
  assert.strictEqual(out.instant, 0, "a drag that can't move the view doesn't repaint the chart");
  const between = out.widths.filter(w => (w - out.start) * (w - out.end) < 0);
  assert.ok(
    between.length >= 2,
    `the tile passes through intermediate sizes (${out.start} → ${out.end}): ${out.widths.join(", ")}`,
  );
  assert.ok(out.pans >= 2, `panning a zoomed-in chart repaints it (${out.pans} repaints)`);
});
