import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Icicle, RESET, Sunburst, Treemap} from "../../index.ts";
import {hasOwnClick, hasUserClick} from "../../src/charts/viz/userClick.ts";

useJsdom();

/**
    A chart knows its own click handlers by identity through `config()`
    merges, `on()`, and `RESET`; a bound handler of the user's is the user's.
*/

const both = viz => ({
  own: hasOwnClick(viz, "click.shape"),
  user: hasUserClick(viz, "click.shape"),
});

for (const Chart of [Treemap, Icicle, Sunburst]) {
  const name = Chart.name;

  it(`${name}: its own click handler survives config merges and RESET`, () => {
    const viz = new Chart();
    const own = viz.on("click.shape");
    assert.deepStrictEqual(both(viz), {own: true, user: false});

    viz.config({on: {mouseenter: () => undefined}, depth: 0});
    viz.on({"mousemove.legend": () => undefined});
    assert.strictEqual(viz.on("click.shape"), own);
    assert.deepStrictEqual(both(viz), {own: true, user: false}, "merged");

    viz.on("click.shape", function () {}.bind(viz));
    assert.deepStrictEqual(both(viz), {own: false, user: true}, "bound");

    viz.config({on: {"click.shape": RESET}});
    assert.deepStrictEqual(both(viz), {own: true, user: false}, "key RESET");

    viz.config({on: {"click.shape": null, click: () => undefined}});
    assert.deepStrictEqual(both(viz), {own: false, user: true});

    viz.config({on: RESET});
    assert.deepStrictEqual(both(viz), {own: true, user: false}, "on RESET");
  });
}

it("Treemap: the legend's own click handler is told apart from a bound one", () => {
  const viz = new Treemap();
  assert.strictEqual(hasOwnClick(viz, "click.legend"), true);
  assert.strictEqual(hasUserClick(viz, "click.legend"), false);
  viz.on("click.legend", function () {}.bind(viz));
  assert.strictEqual(hasOwnClick(viz, "click.legend"), false);
  assert.strictEqual(hasUserClick(viz, "click.legend"), true);
});

it("each chart knows only its own handlers", () => {
  const a = new Treemap();
  const b = new Treemap();
  b.on("click.shape", a.on("click.shape"));
  assert.deepStrictEqual(both(b), {own: false, user: true});
});
