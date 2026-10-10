import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Two charts with the same data on one page each own their tooltip. The
    pointer moves from a mark in the first chart straight to the same mark in
    the second: the second chart's tooltip shows (positioned at the pointer)
    once the first chart's clears, and no two tooltip elements on the page ever
    share an id — even in the moment both charts have one rendered.
*/

after(closeBrowser);

const body = `
  <div id="a" style="width: 400px; height: 300px"></div>
  <div id="b" style="width: 400px; height: 300px"></div>`;

const hoverAcross = ({type, renderer}) =>
  new Promise((resolve, reject) => {
    const data = [
      {id: "alpha", x: "A", y: 30},
      {id: "beta", x: "B", y: 50},
      {id: "gamma", x: "C", y: 20},
    ];
    const tick = ms => new Promise(r => setTimeout(r, ms));
    const make = sel =>
      new Promise(res => {
        const viz = new window.d3plus[type]()
          .data(data)
          .groupBy("id")
          .duration(0)
          .renderer(renderer)
          .select(sel);
        if (type === "Treemap") viz.sum("y");
        else viz.x("x").y("y");
        viz.render(() => res(viz));
      });
    const move = (x, y) =>
      document
        .elementFromPoint(x, y)
        .dispatchEvent(new MouseEvent("mousemove", {clientX: x, clientY: y, bubbles: true}));
    /** Fires `mouseleave` on every element the pointer leaves, up to the chart's container. */
    const leave = (x, y, container) => {
      for (let el = document.elementFromPoint(x, y); el && el !== container.parentNode; el = el.parentNode)
        el.dispatchEvent(new MouseEvent("mouseleave", {clientX: x, clientY: y}));
    };
    const tips = viz => [...(viz._tooltipClass._portalEl?.querySelectorAll(".d3plus-tooltip") ?? [])];
    const shown = viz => tips(viz).filter(t => getComputedStyle(t).visibility === "visible");
    const ids = () => [...document.querySelectorAll("[id^='d3plus-tooltip']")].map(el => el.id);

    (async () => {
      const [a, b] = [await make("#a"), await make("#b")];
      const boxA = document.querySelector("#a").getBoundingClientRect();
      const boxB = document.querySelector("#b").getBoundingClientRect();

      // Find a point over a mark in the first chart.
      let point;
      for (let y = 20; y < boxA.height && !point; y += 20)
        for (let x = 20; x < boxA.width && !point; x += 20) {
          move(boxA.left + x, boxA.top + y);
          await tick(0);
          if (shown(a).length) point = [x, y];
        }
      if (!point) throw new Error("no hoverable mark found in the first chart");
      const title = shown(a)[0].querySelector(".d3plus-tooltip-title").textContent;

      // Straight to the same mark in the second chart.
      leave(boxA.left + point[0], boxA.top + point[1], document.querySelector("#a"));
      const [bx, by] = [boxB.left + point[0], boxB.top + point[1]];
      move(bx, by);
      const idsWhileBoth = ids();
      await tick(50);

      const tipB = shown(b)[0];
      resolve({
        idsWhileBoth,
        tipsA: tips(a).length,
        shownB: shown(b).length,
        titleB: tipB?.querySelector(".d3plus-tooltip-title").textContent,
        title,
        offsetB: tipB ? Math.abs(tipB.getBoundingClientRect().top - by) : null,
      });
    })().catch(reject);
  });

for (const type of ["Treemap", "BarChart"])
  for (const renderer of ["svg", "canvas"])
    it(`${type} (${renderer}): two charts on one page each show their own tooltip`, async function () {
      this.timeout(120000);
      const r = await render(body, hoverAcross, {type, renderer});
      assert.strictEqual(
        new Set(r.idsWhileBoth).size,
        r.idsWhileBoth.length,
        `tooltip element ids are unique: ${r.idsWhileBoth.join(", ")}`,
      );
      assert.strictEqual(r.tipsA, 0, "the first chart's tooltip clears");
      assert.strictEqual(r.shownB, 1, "the second chart shows its tooltip");
      assert.strictEqual(r.titleB, r.title, "for the same mark");
      assert.ok(r.offsetB < 150, `next to the pointer (${r.offsetB}px away)`);
    });
