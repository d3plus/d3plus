import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Animated draws into a container that is off the page: one that was never
    attached, and one removed (not destroyed) after it drew. d3 finds a
    transition by walking up from each element it animates, so a transition
    scheduled on `<html>` can't be found from a chart off the page, and the
    draw threw `transition N not found`.
*/

/**
    Runs in the page: draws a Treemap twice, the second time with new data,
    and resolves once that draw's transition has settled. With `timeline`, its
    rows span two years, so it draws a timeline too.
*/
const drawTwice = ([renderer, timeline, attached]) =>
  new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.style.cssText = "width:480px;height:360px";
    if (attached) document.body.appendChild(container);
    const rows = scale =>
      ["a", "b", "c"].flatMap((id, i) =>
        (timeline ? [2020, 2021] : [2021]).map(year => ({
          id,
          year,
          value: (i + 1) * scale + year,
        })),
      );
    const viz = new window.d3plus.Treemap()
      .select(container)
      .renderer(renderer)
      .detectVisible(false)
      .duration(200)
      .groupBy("id")
      .sum("value")
      .time("year")
      .data(rows(1));
    const settle = () => new Promise(done => setTimeout(done, 400));
    // A draw that throws is caught and reported as "could not draw".
    const errors = [];
    const consoleError = console.error;
    console.error = (...args) => errors.push(args.map(String).join(" "));
    try {
      viz.render(() =>
        settle()
          .then(() => {
            if (attached) container.remove();
            return new Promise(done =>
              viz.data(rows(50)).render(() => settle().then(done)),
            );
          })
          .then(() => {
            const marks = container.querySelectorAll(
              "svg.d3plus-render-svg [data-key], canvas",
            ).length;
            const timeline = !!container.querySelector("g.d3plus-viz-timeline");
            viz.destroy();
            console.error = consoleError;
            resolve({errors, marks, timeline});
          })
          .catch(error => {
            console.error = consoleError;
            reject(error);
          }),
      );
    } catch (error) {
      console.error = consoleError;
      reject(error);
    }
  });

const cases = [
  ["svg", false],
  ["svg", true],
  ["canvas", true],
];
for (const [renderer, timeline] of cases)
  for (const attached of [false, true])
    it(`Treemap animates a ${renderer} redraw${timeline ? " with a timeline" : ""} ${attached ? "after its container leaves the page" : "into a container never on the page"}`, async () => {
      const out = await render("", drawTwice, [renderer, timeline, attached]);
      assert.deepStrictEqual(out.errors, [], "no draw failed");
      assert.ok(out.marks > 0, "it drew");
      assert.strictEqual(out.timeline, timeline, "with its timeline");
    });
