import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    fontMin/fontMax bound the fontResize search only: a fixed fontSize is
    measured, wrapped, and painted at the size given.
*/

after(async () => {
  await closeBrowser();
});

it("TextBox uses a fixed fontSize as given, and bounds only a resized one", async function () {
  this.timeout(60000);

  const out = await render('<svg id="s" width="400" height="400"><g id="box"></g></svg>', () =>
    new Promise(resolve => {
      const box = new window.d3plus.TextBox().select("#box");
      const sizes = configure => {
        configure(box.data([{text: "3"}]).width(300).height(300).x(0).y(0));
        const datum = box._textData()[0];
        return {fS: datum.fS, lH: datum.lH};
      };
      const o = {};
      o.aboveMax = sizes(b => b.fontResize(false).fontMax(50).fontMin(8).fontSize(80).lineHeight(96));
      o.belowMin = sizes(b => b.fontResize(false).fontMax(50).fontMin(8).fontSize(6).lineHeight(7.2));
      o.resized = sizes(b => b.fontResize(true).fontMax(20).fontMin(8).fontSize(10).lineHeight(12));
      box.fontResize(false).fontMax(50).fontMin(8).fontSize(80).lineHeight(96).render(() => {
        o.painted = document.querySelector("#box text").getAttribute("font-size");
        resolve(o);
      });
    }),
  );

  assert.strictEqual(out.aboveMax.fS, 80, "a fixed fontSize above fontMax is kept");
  assert.strictEqual(out.aboveMax.lH, 96, "and keeps its lineHeight");
  assert.strictEqual(out.belowMin.fS, 6, "a fixed fontSize below fontMin is kept");
  assert.ok(out.resized.fS <= 20, `a resized font stays within fontMax (${out.resized.fS})`);
  assert.ok(out.resized.fS >= 8, `a resized font stays within fontMin (${out.resized.fS})`);
  assert.strictEqual(parseFloat(out.painted), 80, "the painted text uses the fixed size");
});
