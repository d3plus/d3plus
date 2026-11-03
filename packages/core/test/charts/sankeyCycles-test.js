import {it} from "vitest";
import assert from "assert";

import {sankeyAcyclicLinks} from "../../internal.ts";

const link = (source, target, value = 1) => ({source, target, value});
const pairs = links => links.map(l => `${l.source}>${l.target}`);

/** Whether `links` (node indices) contain a loop. */
function hasLoop(links) {
  const out = new Map();
  for (const l of links) {
    if (!out.has(l.source)) out.set(l.source, []);
    out.get(l.source).push(l.target);
  }
  const state = new Map();
  const visit = n => {
    state.set(n, 1);
    for (const z of out.get(n) || []) {
      if (state.get(z) === 1) return true;
      if (!state.has(z) && visit(z)) return true;
    }
    state.set(n, 2);
    return false;
  };
  return [...out.keys()].some(n => !state.has(n) && visit(n));
}

it("sankeyAcyclicLinks leaves out the lighter link of a 2-cycle", () => {
  const links = [link(0, 1, 5), link(1, 0, 2)];
  const {kept, looped} = sankeyAcyclicLinks(links);
  assert.deepStrictEqual(kept, [links[0]]);
  assert.deepStrictEqual(looped, [links[1]]);
  // The heavier link is kept wherever it is listed.
  const swapped = sankeyAcyclicLinks([links[1], links[0]]);
  assert.deepStrictEqual(swapped.looped, [links[1]]);
});

it("sankeyAcyclicLinks leaves out the lightest link of a 3-cycle", () => {
  const links = [link(0, 1, 3), link(1, 2, 1), link(2, 0, 2), link(2, 3, 4)];
  const {kept, looped} = sankeyAcyclicLinks(links);
  assert.deepStrictEqual(pairs(looped), ["1>2"]);
  assert.deepStrictEqual(pairs(kept), ["0>1", "2>0", "2>3"]);
});

it("sankeyAcyclicLinks breaks several loops that share nodes", () => {
  // 0 → 1 → 2 → 0 and 1 → 3 → 1 share node 1; 0 → 2 → 0 shares 0 and 2.
  const links = [
    link(0, 1, 10),
    link(1, 2, 8),
    link(2, 0, 1),
    link(1, 3, 6),
    link(3, 1, 2),
    link(0, 2, 5),
    link(2, 4, 7),
  ];
  const {kept, looped} = sankeyAcyclicLinks(links);
  assert.deepStrictEqual(pairs(looped), ["2>0", "3>1"]);
  assert.ok(!hasLoop(kept));
  // Every link left out would close a loop again.
  for (const l of looped) assert.ok(hasLoop([...kept, l]), pairs([l])[0]);
});

it("sankeyAcyclicLinks leaves a graph with no loops untouched", () => {
  const links = [
    link(0, 1, 1),
    link(0, 2, 9),
    link(1, 3, 2),
    link(2, 3, 4),
    link(3, 4, 3),
    link(0, 4, 1),
  ];
  const {kept, looped} = sankeyAcyclicLinks(links);
  assert.deepStrictEqual(kept, links);
  assert.deepStrictEqual(looped, []);
  assert.deepStrictEqual(sankeyAcyclicLinks([]), {kept: [], looped: []});
});

it("sankeyAcyclicLinks breaks ties by the order links are given in", () => {
  const links = [link(0, 1), link(1, 2), link(2, 0)];
  assert.deepStrictEqual(pairs(sankeyAcyclicLinks(links).looped), ["2>0"]);
  const rotated = [links[1], links[2], links[0]];
  assert.deepStrictEqual(pairs(sankeyAcyclicLinks(rotated).looped), ["0>1"]);
  // A value that isn't a number weighs nothing.
  const odd = [link(0, 1, NaN), link(1, 0, 1)];
  assert.deepStrictEqual(pairs(sankeyAcyclicLinks(odd).looped), ["0>1"]);
});

it("sankeyAcyclicLinks leaves out links from a node to itself", () => {
  const links = [link(0, 0, 100), link(0, 1, 1), link(1, 1, 1)];
  const {kept, looped} = sankeyAcyclicLinks(links);
  assert.deepStrictEqual(kept, [links[1]]);
  assert.deepStrictEqual(looped, [links[0], links[2]]);
});

it("sankeyAcyclicLinks is quick on large, dense graphs with loops", () => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = 200;
  const links = [];
  for (let s = 0; s < n; s++)
    for (let t = 0; t < n; t++)
      if (s !== t && random() < 0.25)
        links.push(link(s, t, Math.ceil(random() * 100)));
  const start = performance.now();
  const {kept, looped} = sankeyAcyclicLinks(links);
  const time = performance.now() - start;
  assert.ok(time < 1000, `${links.length} links in ${time}ms`);
  assert.strictEqual(kept.length + looped.length, links.length);
  assert.ok(looped.length > 0 && !hasLoop(kept));
  // Keeps the heavier side: more than half of the total flow.
  const flow = ls => ls.reduce((t, l) => t + l.value, 0);
  assert.ok(flow(kept) > flow(looped));
  // Maximal: each left-out link would close a loop.
  for (const l of looped.slice(0, 50)) assert.ok(hasLoop([...kept, l]));
  // Same input, same choice.
  assert.deepStrictEqual(
    sankeyAcyclicLinks(links).looped.map(l => links.indexOf(l)),
    looped.map(l => links.indexOf(l)),
  );
});
