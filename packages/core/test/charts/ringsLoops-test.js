import {it} from "vitest";
import assert from "assert";

import {ringsLoops} from "../../internal.ts";

const geom = {
  width: 400,
  height: 400,
  ringWidth: 60,
  primaryRing: 60,
  secondaryRing: 120,
};

/** A center at (200, 200) with primaries right and below it, and a secondary beyond the right one. */
function fixture() {
  const center = {id: "c", x: 200, y: 200, r: 30};
  const right = {id: "r", x: 260, y: 200, r: 8, radians: 0};
  const below = {id: "b", x: 200, y: 260, r: 8, radians: Math.PI / 2};
  const far = {id: "f", x: 320, y: 200, r: 6, radians: 0};
  const loose = {id: "loose"};
  const nodes = [center, right, below, far];
  const edge = (source, target, size = 1) => ({
    source,
    target,
    size,
    datum: {},
  });
  const edges = [edge(center, right), edge(center, below), edge(right, far)];
  return {center, right, below, far, loose, nodes, edges, edge};
}

it("ringsLoops draws a loop on each placed node with one", () => {
  const {center, right, far, loose, nodes, edges, edge} = fixture();
  const links = [
    ...edges,
    edge(center, center, 2),
    edge(right, right),
    edge(far, far),
    edge(loose, loose),
  ];
  const out = ringsLoops(links, nodes, edges, center, geom);
  assert.deepStrictEqual(
    out.map(l => l.source.id),
    ["c", "r", "f"],
    "a node that isn't placed draws no loop",
  );
  for (const l of out) {
    assert.strictEqual(l.source, l.target);
    assert.ok(l.loop.d.startsWith("M"));
    assert.ok(!l.loop.d.includes("NaN"));
  }
  assert.strictEqual(out[0].size, 2, "keeps its link's size");
});

it("ringsLoops points a loop away from its links and its label", () => {
  const {center, right, far, nodes, edges, edge} = fixture();
  const out = ringsLoops(
    [edge(center, center), edge(right, right), edge(far, far)],
    nodes,
    edges,
    center,
    geom,
  );
  const [c, r, f] = out.map(l => l.loop.angle);
  // The center's primaries sit right and below it: its loop points up-left.
  assert.ok(Math.cos(c) < 0 && Math.sin(c) < 0, `center ${c}`);
  // A ring node's label runs out from the center (right): its loop goes sideways.
  assert.ok(Math.abs(Math.sin(r)) > 0.9, `primary ${r}`);
  assert.ok(Math.abs(Math.sin(f)) > 0.9, `secondary ${f}`);
});

it("ringsLoops keeps the center's loop inside the first ring", () => {
  const {center, nodes, edges, edge} = fixture();
  const [loop] = ringsLoops([edge(center, center)], nodes, edges, center, geom);
  const reach = Math.hypot(loop.loop.apex.x - 200, loop.loop.apex.y - 200);
  assert.ok(reach <= 30 + (60 - 30) * 0.6 + 1e-9, `${reach}`);
  assert.deepStrictEqual(ringsLoops(edges, nodes, edges, center, geom), []);
});
