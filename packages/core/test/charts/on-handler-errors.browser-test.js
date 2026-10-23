import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    An `on` handler that throws: the error is reported as an uncaught error
    (the page's `error` event sees it) instead of vanishing, and the other
    handlers for the same click still run, on both backends.
*/

for (const renderer of ["svg", "canvas"]) {
  it(`a throwing on() handler is reported and the others still run (${renderer})`, async () => {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:500px;height:300px;"></div>',
    );
    try {
      await page.evaluate(
        renderer =>
          new Promise(resolve => {
            window.__fired = [];
            new window.d3plus.Treemap()
              .data([
                {id: "alpha", value: 29},
                {id: "beta", value: 10},
              ])
              .groupBy("id")
              .sum("value")
              .legend(false)
              .duration(0)
              .renderer(renderer)
              .on("click.shape", () => {
                throw new Error("handler blew up");
              })
              .on("click.Rect", d => window.__fired.push(d.id))
              .select("#viz")
              .render(() => resolve());
          }),
        renderer,
      );
      const box = await page.evaluate(() => {
        const r = document.querySelector("#viz").getBoundingClientRect();
        return [r.left, r.top];
      });
      await page.mouse.click(box[0] + 20, box[1] + 150);
      const fired = await page.evaluate(() => window.__fired);
      assert.deepStrictEqual(fired, ["alpha"], "click.Rect still ran");
      assert.ok(
        errors.some(message => message.includes("handler blew up")),
        `the error was reported (got ${JSON.stringify(errors)})`,
      );
    } finally {
      await close();
    }
  });
}
