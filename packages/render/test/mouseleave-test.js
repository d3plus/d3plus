import assert from "assert";

import it from "./jsdom.js";
import {CanvasRenderer, SvgRenderer} from "../es/index.js";

// Leaving the surface must always be reported — even when the pointer never
// rested on a node — so state tracked over empty space (a Plot crosshair) clears.
for (const [name, Ctor, selector] of [
  ["SvgRenderer", SvgRenderer, "svg.d3plus-render-svg"],
  ["CanvasRenderer", CanvasRenderer, "canvas"],
]) {
  it(`${name} dispatches mouseleave with no prior hover`, () => {
    const renderer = new Ctor();
    renderer.mount({container: document.body, width: 200, height: 100});
    renderer.drawScene({width: 200, height: 100, root: {type: "group", key: "root", children: []}});
    const events = [];
    renderer.on(e => events.push(e));
    const surface = document.querySelector(selector);
    surface.dispatchEvent(new window.MouseEvent("mouseleave", {clientX: 5, clientY: 5}));
    assert.deepStrictEqual(events.map(e => e.type), ["mouseleave"], "one mouseleave dispatched");
    assert.strictEqual(events[0].pick, null, "mouseleave carries no pick");
    renderer.destroy();
  });
}
