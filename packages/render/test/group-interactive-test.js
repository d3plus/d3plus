import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {CanvasRenderer, SvgRenderer} from "../index.ts";

useJsdom({augment: false});

/**
    A group's `interactive: false` covers everything inside it on both
    backends: a child cannot opt back in, a nested group cannot either, and
    nodes outside the group still catch the pointer.
*/

const rect = (key, x, y, extra = {}) => ({
  type: "rect",
  key,
  x,
  y,
  width: 20,
  height: 20,
  datum: {id: key},
  paint: {fill: "#888"},
  ...extra,
});

/** A mark under everything, an inert group, a live group, and a sibling painted after both. */
function scene({inert = false, z = false} = {}) {
  const order = z ? [3, 2, 1] : [undefined, undefined, undefined];
  return {
    width: 200,
    height: 120,
    root: {
      type: "group",
      key: "root",
      children: [
        {
          type: "rect",
          key: "under",
          x: 0,
          y: 0,
          width: 200,
          height: 120,
          datum: {id: "under"},
          paint: {fill: "#eee"},
        },
        {
          type: "group",
          key: "inert",
          interactive: !inert,
          children: [
            rect("inert-plain", 10, 10, {z: order[0]}),
            rect("inert-optin", 40, 10, {interactive: true, z: order[1]}),
            {
              type: "group",
              key: "inert-nested",
              interactive: true,
              transform: {x: 70, y: 10},
              z: order[2],
              children: [rect("inert-deep", 0, 0, {interactive: true})],
            },
          ],
        },
        {
          type: "group",
          key: "live",
          children: [
            rect("live-child", 10, 50),
            rect("live-off", 40, 50, {interactive: false}),
            {
              type: "group",
              key: "live-inner",
              interactive: false,
              clip: {type: "rect", x: 70, y: 50, width: 20, height: 20},
              children: [rect("live-inner-child", 70, 50)],
            },
          ],
        },
        rect("sibling", 100, 10),
      ],
    },
  };
}

/** Each leaf, the center of its box, and whether it catches the pointer. */
const leaves = inert => [
  ["inert-plain", [20, 20], !inert],
  ["inert-optin", [50, 20], !inert],
  ["inert-deep", [80, 20], !inert],
  ["live-child", [20, 60], true],
  ["live-off", [50, 60], false],
  ["live-inner-child", [80, 60], false],
  ["sibling", [110, 20], true],
];

function mounted(Ctor) {
  const renderer = new Ctor();
  renderer.mount({container: document.body, width: 200, height: 120});
  return renderer;
}

const byKey = key => document.querySelector(`[data-key="${key}"]`);

/** The key each leaf's center picks on Canvas: the leaf, or the mark beneath it. */
function canvasPicks(renderer, inert) {
  return leaves(inert).map(([, point]) => renderer.pick(point).node.key);
}

/** The key an event dispatched on each leaf's element reports on SVG, or null. */
function svgPicks(renderer, inert) {
  const picks = [];
  const off = renderer.on(e => picks.push(e.pick ? e.pick.node.key : null));
  for (const [key] of leaves(inert))
    byKey(key).dispatchEvent(
      new window.MouseEvent("click", {bubbles: true, clientX: 1, clientY: 1}),
    );
  off();
  return picks;
}

for (const inert of [true, false]) {
  const label = inert ? "interactive: false" : "interactive: true";

  it(`CanvasRenderer: a group with ${label} decides hit-testing for everything inside it`, () => {
    const renderer = mounted(CanvasRenderer);
    renderer.drawScene(scene({inert}));
    assert.deepStrictEqual(
      canvasPicks(renderer, inert),
      leaves(inert).map(([key, , hit]) => (hit ? key : "under")),
    );
    renderer.destroy();
  });
}

it("CanvasRenderer: an inert group's z-sorted children stay out of hit-testing", () => {
  const renderer = mounted(CanvasRenderer);
  renderer.drawScene(scene({inert: true, z: true}));
  assert.deepStrictEqual(
    canvasPicks(renderer, true),
    leaves(true).map(([key, , hit]) => (hit ? key : "under")),
  );
  renderer.destroy();
});

it("CanvasRenderer: the pointer passes through an inert group to the mark beneath", () => {
  const renderer = mounted(CanvasRenderer);
  renderer.drawScene(scene({inert: true}));
  const events = [];
  renderer.on(e => events.push(`${e.type}:${e.pick ? e.pick.node.key : "-"}`));
  const canvas = document.querySelector("canvas");
  const fire = (type, [clientX, clientY]) =>
    canvas.dispatchEvent(
      new window.MouseEvent(type, {bubbles: true, clientX, clientY}),
    );
  // Over the child that sets `interactive: true`, then across to the sibling.
  fire("mousemove", [50, 20]);
  fire("click", [50, 20]);
  fire("mousemove", [110, 20]);
  assert.deepStrictEqual(events, [
    "mouseenter:under",
    "mousemove:under",
    "click:under",
    "mouseleave:-",
    "mouseenter:sibling",
    "mousemove:sibling",
  ]);
  renderer.destroy();
});

it("CanvasRenderer: a group's children follow its `interactive` from one draw to the next", () => {
  const renderer = mounted(CanvasRenderer);
  renderer.drawScene(scene({inert: true}));
  assert.strictEqual(renderer.pick([50, 20]).node.key, "under");
  renderer.drawScene(scene({inert: false}));
  assert.strictEqual(renderer.pick([50, 20]).node.key, "inert-optin");
  renderer.drawScene(scene({inert: true}));
  assert.strictEqual(renderer.pick([50, 20]).node.key, "under");
  renderer.destroy();
});

it("SvgRenderer: only the node that sets `interactive: false` carries pointer-events, so its contents inherit it", () => {
  const renderer = mounted(SvgRenderer);
  renderer.drawScene(scene({inert: true}));
  const attrs = keys =>
    Object.fromEntries(
      keys.map(key => [key, byKey(key).getAttribute("pointer-events")]),
    );
  assert.deepStrictEqual(
    attrs([
      "inert",
      "inert-plain",
      "inert-optin",
      "inert-nested",
      "inert-deep",
      "live",
      "live-child",
      "live-off",
      "live-inner",
      "live-inner-child",
      "sibling",
    ]),
    {
      inert: "none",
      "inert-plain": null,
      "inert-optin": null,
      "inert-nested": null,
      "inert-deep": null,
      live: null,
      "live-child": null,
      "live-off": "none",
      "live-inner": "none",
      "live-inner-child": null,
      sibling: null,
    },
  );
  for (const key of ["inert-optin", "inert-nested", "inert-deep"])
    assert.strictEqual(
      byKey(key).style.pointerEvents,
      "",
      `${key} sets no pointer-events style`,
    );
  // The group turns interactive: the attribute goes, and its contents with it.
  renderer.drawScene(scene({inert: false}));
  assert.strictEqual(byKey("inert").getAttribute("pointer-events"), null);
  assert.deepStrictEqual(svgPicks(renderer, false).slice(0, 3), [
    "inert-plain",
    "inert-optin",
    "inert-deep",
  ]);
  renderer.destroy();
});
