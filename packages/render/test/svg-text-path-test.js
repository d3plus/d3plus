import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {SvgRenderer} from "../index.ts";

useJsdom({augment: false});

const scene = children => ({
  width: 200,
  height: 100,
  root: {type: "group", key: "root", children},
});

const pathText = (key, d, extra = {}) => ({
  type: "text",
  key,
  x: 0,
  y: 0,
  font: {size: 10, anchor: "middle"},
  lines: [{text: "on a path", x: 50, y: 0, width: 40}],
  path: {d},
  ...extra,
});

it("SvgRenderer draws path text in a <textPath> along a <defs> path", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(scene([pathText("a", "M0,50 L200,50")]));
  const text = document.querySelector("text");
  const tp = text.querySelector("textPath");
  assert.ok(tp, "a <textPath>");
  assert.strictEqual(text.querySelectorAll(":scope > tspan").length, 0);
  const href = tp.getAttribute("href");
  const def = document.querySelector(`defs ${href}`);
  assert.ok(def, `${href} resolves in <defs>`);
  assert.strictEqual(def.getAttribute("d"), "M0,50 L200,50");
  // The line's left edge along the path, drawn start-anchored.
  assert.strictEqual(tp.getAttribute("startOffset"), "30");
  assert.strictEqual(text.getAttribute("text-anchor"), "start");
  assert.strictEqual(tp.textContent, "on a path");

  // A changed path rewrites the same def.
  renderer.drawScene(scene([pathText("a", "M0,80 L200,80")]));
  assert.strictEqual(document.querySelectorAll("defs path").length, 1);
  assert.strictEqual(
    document.querySelector(`defs ${href}`).getAttribute("d"),
    "M0,80 L200,80",
  );

  // side: "right" follows the path backwards.
  renderer.drawScene(
    scene([
      pathText("a", "M0,80 L200,80", {
        path: {d: "M0,80 L200,80", side: "right"},
      }),
    ]),
  );
  assert.strictEqual(
    document.querySelector(`defs ${href}`).getAttribute("d"),
    "M200,80L0,80",
  );

  // Off the path, the line draws in a tspan again.
  renderer.drawScene(scene([{...pathText("a", ""), path: undefined}]));
  assert.strictEqual(text.querySelector("textPath"), null);
  assert.strictEqual(text.querySelectorAll(":scope > tspan").length, 1);

  // An exiting node takes its def with it.
  renderer.drawScene(scene([pathText("b", "M0,10 L200,10")]));
  const ids = [...document.querySelectorAll("defs path")].map(p => p.id);
  renderer.drawScene(scene([]));
  for (const id of ids)
    assert.strictEqual(document.getElementById(id), null, `${id} removed`);
  renderer.destroy?.();
});

it("SvgRenderer embeds right-to-left path text so it reads right to left", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(
    scene([
      pathText("r", "M0,50 L200,50", {
        font: {size: 10, anchor: "start", dir: "rtl"},
        lines: [{text: "שלום", x: 200, y: 0, width: 40}],
      }),
    ]),
  );
  const tp = document.querySelector("textPath");
  assert.strictEqual(tp.textContent, "\u202Bשלום\u202C");
  assert.strictEqual(tp.getAttribute("startOffset"), "160");
  assert.strictEqual(document.querySelector("text").getAttribute("dir"), null);
});

it("SvgRenderer path text keeps styled runs", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});
  renderer.drawScene(
    scene([
      pathText("s", "M0,50 L200,50", {
        lines: [
          {
            text: "a b",
            x: 50,
            y: 0,
            width: 20,
            runs: [{text: "a "}, {text: "b", style: {weight: 700}}],
          },
        ],
      }),
    ]),
  );
  const runs = [...document.querySelectorAll("textPath > tspan")];
  assert.deepStrictEqual(
    runs.map(t => [t.textContent, t.getAttribute("style")]),
    [
      ["a ", null],
      ["b", "font-weight: 700"],
    ],
  );
});
