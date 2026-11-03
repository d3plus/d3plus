import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    How wide the node-link charts draw links whose `linkSize` values differ:
    Network and Rings up to half the smallest node's radius by default, or
    `linkSizeMax`; ArcDiagram up to the smallest node's radius.
*/

const nodes = ["a", "b", "c", "d"].map((id, k) => ({
  id,
  x: k % 2 ? 200 : 0,
  y: k > 1 ? 120 : 0,
}));
const links = [
  {source: "a", target: "b", w: 1},
  {source: "a", target: "c", w: 9},
  {source: "c", target: "d", w: 4},
  {source: "b", target: "b", w: 6},
];

/** Runs in the page: the drawn links' stroke widths and the nodes' radii. */
const widths = (prefix, shape) => viz => {
  const out = {links: [], radii: []};
  const walk = n => {
    const key = String(n.key ?? "");
    if (key.startsWith(prefix) && !key.includes("::") && n.type === "path")
      out.links.push(n.paint?.strokeWidth ?? 1);
    if (n.type === shape && n.r) out.radii.push(n.r);
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root);
  return out;
};

const draw = (chart, config, prefix = "network-link-") =>
  probeChart(
    `lib => new lib.${chart}().config(${JSON.stringify(config)}).linkSize(d => d.w)`,
    widths(prefix, "circle"),
  );

const near = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 0.01, `${msg}: ${a} is not close to ${b}`);

it("Network draws its heaviest link half as wide as the smallest node's radius", async () => {
  const out = await draw("Network", {nodes, links});
  assert.strictEqual(out.links.length, 4);
  near(Math.max(...out.links), Math.min(...out.radii) / 2, "heaviest");
  near(Math.min(...out.links), 1, "lightest");
});

it("Network takes linkSizeMax and linkSizeMin as given", async () => {
  const set = await draw("Network", {
    nodes,
    links,
    linkSizeMax: 3,
    linkSizeMin: 2,
  });
  near(Math.max(...set.links), 3, "heaviest");
  near(Math.min(...set.links), 2, "lightest");
  // A linkSizeMin past linkSizeMax is held to it.
  const held = await draw("Network", {
    nodes,
    links,
    linkSizeMax: 3,
    linkSizeMin: 5,
  });
  assert.deepStrictEqual([...new Set(held.links)], [3]);
});

it("Network keeps the width of links that all share one linkSize", async () => {
  const out = await probeChart(
    `lib => new lib.Network().config(${JSON.stringify({nodes, links})}).linkSize(4)`,
    widths("network-link-", "circle"),
  );
  assert.deepStrictEqual([...new Set(out.links)], [4]);
});

it("Network draws its nodes with no links", async () => {
  const out = await draw("Network", {nodes, links: []});
  assert.strictEqual(out.links.length, 0);
  assert.strictEqual(out.radii.length >= 4, true);
});

it("Rings caps links as Network does, and takes linkSizeMax", async () => {
  const rings = [
    {source: "a", target: "b", w: 1},
    {source: "a", target: "c", w: 9},
    {source: "c", target: "d", w: 4},
  ];
  const config = {links: rings, center: "a"};
  const out = await draw("Rings", config, "rings-link-");
  assert.strictEqual(out.links.length, 3);
  near(Math.max(...out.links), Math.min(...out.radii) / 2, "heaviest");
  const set = await draw("Rings", {...config, linkSizeMax: 2}, "rings-link-");
  near(Math.max(...set.links), 2, "heaviest");
});

it("ArcDiagram draws its heaviest link as wide as the smallest node's radius", async () => {
  const out = await draw("ArcDiagram", {nodes, links}, "arc-link-");
  assert.strictEqual(out.links.length, 4);
  near(Math.max(...out.links), Math.min(...out.radii), "heaviest");
});
