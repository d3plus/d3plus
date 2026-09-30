import assert from "assert";

import it from "./jsdom.js";
import {SvgRenderer} from "../es/index.js";

/** Builds a minimal scene from a flat list of child nodes. */
function scene(children) {
  return {width: 200, height: 100, root: {type: "group", key: "root", children}};
}

it("SvgRenderer mounts an svg and draws keyed primitives", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "rect", key: "a", x: 0, y: 0, width: 10, height: 20, paint: {fill: "red"}},
      {type: "circle", key: "b", cx: 50, cy: 50, r: 5, paint: {fill: "blue"}},
    ]),
  );

  const svg = document.querySelector("svg.d3plus-render-svg");
  assert.ok(svg, "svg is mounted");
  assert.strictEqual(svg.getAttribute("width"), "200", "svg width set");

  const rect = svg.querySelector('[data-key="a"]');
  assert.strictEqual(rect.tagName.toLowerCase(), "rect", "rect element created");
  assert.strictEqual(rect.getAttribute("width"), "10", "rect width applied");
  assert.strictEqual(rect.getAttribute("fill"), "red", "rect fill applied");

  const circle = svg.querySelector('[data-key="b"]');
  assert.strictEqual(circle.tagName.toLowerCase(), "circle", "circle element created");
  assert.strictEqual(circle.getAttribute("r"), "5", "circle radius applied");

  renderer.destroy();
});

it("SvgRenderer reconciles enter/update/exit by key", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "rect", key: "a", x: 0, y: 0, width: 10, height: 20},
      {type: "circle", key: "b", cx: 50, cy: 50, r: 5},
    ]),
  );

  // a updates, b exits, c enters.
  renderer.drawScene(
    scene([
      {type: "rect", key: "a", x: 0, y: 0, width: 99, height: 20},
      {type: "path", key: "c", d: "M0,0L10,10"},
    ]),
  );

  const root = document.querySelector("g.d3plus-render-root");
  assert.strictEqual(root.querySelector('[data-key="a"]').getAttribute("width"), "99", "node a updated in place");
  assert.strictEqual(root.querySelector('[data-key="b"]'), null, "node b removed on exit");
  const c = root.querySelector('[data-key="c"]');
  assert.ok(c, "node c entered");
  assert.strictEqual(c.getAttribute("d"), "M0,0L10,10", "entering path d applied");

  renderer.destroy();
});

it("SvgRenderer starts a flip-eligible entering node at enterFrom, not its own collapsed center", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  // Enter branch attrs are applied synchronously (the transition only tweens
  // toward the target afterward), so the DOM reflects the start state
  // immediately after drawScene returns — no need to advance any timers.
  renderer.drawScene(
    scene([{type: "rect", key: "new", x: 0, y: 0, width: 100, height: 50}]),
    {duration: 400, enterFrom: {x: 40, y: 20, width: 10, height: 10}},
  );

  const el = document.querySelector('[data-key="new"]');
  assert.strictEqual(el.getAttribute("x"), "40", "starts at enterFrom.x");
  assert.strictEqual(el.getAttribute("y"), "20", "starts at enterFrom.y");
  assert.strictEqual(el.getAttribute("width"), "10", "starts at enterFrom.width");
  assert.strictEqual(el.getAttribute("height"), "10", "starts at enterFrom.height");

  renderer.destroy();
});

it("SvgRenderer ignores enterFrom for a node tagged with an interactionGroup (chrome)", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([{type: "rect", key: "back", x: 0, y: 0, width: 100, height: 50, interactionGroup: "back"}]),
    {duration: 400, enterFrom: {x: 999, y: 999, width: 1, height: 1}},
  );

  const el = document.querySelector('[data-key="back"]');
  assert.strictEqual(el.getAttribute("x"), "50", "collapses to its own center, ignoring enterFrom");
  assert.strictEqual(el.getAttribute("width"), "0", "collapses its own width to 0, ignoring enterFrom");

  renderer.destroy();
});

it("SvgRenderer keeps a non-morph exit present until its collapse transition ends", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(scene([{type: "rect", key: "old", x: 0, y: 0, width: 10, height: 10}]));
  // A drill-up draw (exitTo set) with nothing exiting this round should not
  // disturb an unrelated, ordinary exit elsewhere in the same tree.
  const handle = renderer.drawScene(scene([]), {duration: 400});
  const el = document.querySelector('[data-key="old"]');
  assert.ok(el, "exiting element is still present synchronously (removal happens at transition end)");

  handle.cancel();
  renderer.destroy();
});

it("SvgRenderer orders elements by z within a group", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "rect", key: "top", x: 0, y: 0, width: 10, height: 10, z: 10},
      {type: "rect", key: "bottom", x: 0, y: 0, width: 10, height: 10, z: 1},
    ]),
  );

  const keys = [...document.querySelector("g.d3plus-render-root").children].map(el =>
    el.getAttribute("data-key"),
  );
  assert.deepStrictEqual(keys, ["bottom", "top"], "lower z renders first (underneath)");

  renderer.destroy();
});

it("SvgRenderer nests group nodes", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {
        type: "group",
        key: "g1",
        transform: {x: 5, y: 5},
        children: [{type: "circle", key: "inner", cx: 0, cy: 0, r: 3}],
      },
    ]),
  );

  const g = document.querySelector('[data-key="g1"]');
  assert.strictEqual(g.tagName.toLowerCase(), "g", "group is a <g>");
  assert.strictEqual(g.getAttribute("transform"), "translate(5,5)", "group transform applied");
  assert.ok(g.querySelector('[data-key="inner"]'), "child rendered inside group");

  renderer.destroy();
});

it("SvgRenderer sweeps a motion trail for a moving trailed point on transition", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 200});
  const circle = extra => ({
    type: "circle", key: "p", cx: 0, cy: 0, r: 5,
    paint: {fill: "#ff0000"}, transform: {x: 10, y: 10}, trail: true, ...extra,
  });

  // First draw establishes the point's position; nothing to trail from yet.
  renderer.drawScene(scene([circle()]));
  assert.ok(!document.querySelector(".d3plus-trail"), "no trail on the first draw");

  // Move it with a transition → a trail <path> is created beneath the point,
  // filled with the fade gradient (its `d`/opacity are then tweened per frame).
  // The path is created synchronously, so assert before cancelling the
  // transition (cancel avoids an async transform tick after JSDOM teardown).
  const handle = renderer.drawScene(scene([circle({transform: {x: 120, y: 90}})]), {duration: 400});
  const trail = document.querySelector(".d3plus-trail");
  assert.ok(trail, "trail path created for the moving point");
  assert.strictEqual(trail.tagName.toLowerCase(), "path", "trail is a path");
  assert.ok((trail.getAttribute("fill") || "").startsWith("url(#"), "trail filled by a gradient");
  const point = document.querySelector('[data-key="p"]');
  assert.strictEqual(trail.nextElementSibling, point, "trail sits just beneath the point");

  handle.cancel();
  renderer.destroy();
});

it("SvgRenderer sweeps a motion trail for a moving trailed rect on transition", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 200});
  const square = extra => ({
    type: "rect", key: "r", x: -6, y: -6, width: 12, height: 12,
    paint: {fill: "#1c7ed6"}, transform: {x: 10, y: 10}, trail: true, ...extra,
  });

  renderer.drawScene(scene([square()]));
  assert.ok(!document.querySelector(".d3plus-trail"), "no trail on the first draw");

  const handle = renderer.drawScene(scene([square({transform: {x: 120, y: 120}})]), {duration: 400});
  const trail = document.querySelector(".d3plus-trail");
  assert.ok(trail, "trail path created for the moving square");
  assert.strictEqual(trail.tagName.toLowerCase(), "path", "trail is a path");
  assert.ok((trail.getAttribute("fill") || "").startsWith("url(#"), "trail filled by a gradient");
  const mark = document.querySelector('[data-key="r"]');
  assert.strictEqual(trail.nextElementSibling, mark, "trail sits just beneath the square");

  handle.cancel();
  renderer.destroy();
});

it("SvgRenderer accumulates persistent trail paths across moves and keeps them at rest", () => {
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 200});
  const circle = extra => ({
    type: "circle", key: "p", cx: 0, cy: 0, r: 6, paint: {fill: "#1c7ed6"},
    transform: {x: 10, y: 10}, trail: true, trailPersist: 3, ...extra,
  });
  // One path per mark (a single fill), so segments are subpaths in its `d` —
  // count the "M" commands. Unlike the ephemeral trail it isn't removed on end.
  const paths = () => document.querySelectorAll('.d3plus-trail-persist[data-tkey="p"]');
  const segCount = () => {
    const p = paths()[0];
    return p ? (p.getAttribute("d").match(/M/g) || []).length : 0;
  };

  // Persistent trails are ordered in time by `sequence`; forward steps grow them.
  renderer.drawScene(scene([circle()]), {sequence: 0});
  assert.strictEqual(paths().length, 0, "no persistent trail before moving");

  const h1 = renderer.drawScene(scene([circle({transform: {x: 120, y: 80}})]), {duration: 400, sequence: 1});
  assert.strictEqual(paths().length, 1, "one trail path after the first move");
  assert.strictEqual(segCount(), 1, "one segment after the first move");
  assert.ok((paths()[0].getAttribute("fill") || "").startsWith("url(#"), "trail filled by a gradient");
  h1.cancel();

  const h2 = renderer.drawScene(scene([circle({transform: {x: 60, y: 150}})]), {duration: 400, sequence: 2});
  assert.strictEqual(paths().length, 1, "still a single trail path");
  assert.strictEqual(segCount(), 2, "two segments after the second move");
  h2.cancel();

  renderer.destroy();
});

it("SvgRenderer falls back to an ephemeral trail when no sequence is supplied", () => {
  // Without a sequence (a range/brushing selection, or no timeline) a persistent
  // trail can't be time-ordered, so it degrades to the plain ephemeral trail.
  const renderer = new SvgRenderer();
  renderer.mount({container: document.body, width: 200, height: 200});
  const circle = extra => ({
    type: "circle", key: "p", cx: 0, cy: 0, r: 6, paint: {fill: "#1c7ed6"},
    transform: {x: 10, y: 10}, trail: true, trailPersist: true, ...extra,
  });

  renderer.drawScene(scene([circle()]));
  const h = renderer.drawScene(scene([circle({transform: {x: 120, y: 80}})]), {duration: 400});
  assert.strictEqual(document.querySelectorAll(".d3plus-trail-persist").length, 0, "no persistent trail without a sequence");
  assert.ok(document.querySelector(".d3plus-trail"), "an ephemeral trail is drawn instead");
  h.cancel();

  renderer.destroy();
});
