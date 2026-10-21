import assert from "assert";
import {
  sankey,
  sankeyCenter,
  sankeyJustify,
  sankeyLeft,
  sankeyLinkHorizontal,
  sankeyRight,
} from "../../es/src/charts/Sankey/sankeyLayout.js";

const round = v => +v.toFixed(3);

/** A diamond: 0 splits into 1 and 2, which rejoin at 3. */
function diamond(align = sankeyJustify) {
  const nodes = [{}, {}, {}, {}];
  const links = [
    {source: 0, target: 1, value: 5},
    {source: 0, target: 2, value: 3},
    {source: 1, target: 3, value: 4},
    {source: 2, target: 3, value: 3},
  ];
  sankey().nodeAlign(align).nodePadding(10).nodeWidth(20).nodes(nodes).links(links).iterations(6).size([600, 400])();
  return {nodes, links};
}

it("sankey lays out nodes and links in place", () => {
  const {nodes, links} = diamond();
  assert.deepStrictEqual(
    nodes.map(d => [d.depth, d.height, d.x0, d.x1, round(d.y0), round(d.y1), d.value]),
    [
      [0, 2, 0, 20, 3.543, 393.543, 8],
      [1, 1, 290, 310, 0, 243.75, 5],
      [1, 1, 290, 310, 253.75, 400, 3],
      [2, 0, 580, 600, 25.112, 366.362, 7],
    ],
  );
  assert.deepStrictEqual(links.map(l => round(l.width)), [243.75, 146.25, 195, 146.25]);
  assert.strictEqual(links[0].source, nodes[0], "link ends resolve to their nodes");
  assert.deepStrictEqual(nodes[0].sourceLinks, [links[0], links[1]]);
});

it("sankey aligns nodes without outgoing links", () => {
  const nodes = [{}, {}, {}, {}];
  const links = [
    {source: 0, target: 1, value: 1},
    {source: 1, target: 2, value: 1},
    {source: 3, target: 2, value: 1},
  ];
  const layers = align => {
    const copy = nodes.map(() => ({}));
    sankey().nodeAlign(align).nodes(copy).links(links.map(l => ({...l}))).size([300, 100])();
    return copy.map(d => d.layer);
  };
  assert.deepStrictEqual(layers(sankeyLeft), [0, 1, 2, 0], "left: by depth");
  assert.deepStrictEqual(layers(sankeyRight), [0, 1, 2, 1], "right: by distance to a sink");
  assert.deepStrictEqual(layers(sankeyJustify), [0, 1, 2, 0], "justify: sinks in the last column");
  assert.deepStrictEqual(layers(sankeyCenter), [0, 1, 2, 1], "center: sources next to their targets");
});

it("sankey rejects circular links", () => {
  const links = [{source: 0, target: 1, value: 1}, {source: 1, target: 0, value: 1}];
  assert.throws(() => sankey().nodes([{}, {}]).links(links)(), /circular link/);
});

it("sankeyLinkHorizontal draws from the source's right edge to the target's left", () => {
  const {links} = diamond();
  assert.strictEqual(sankeyLinkHorizontal()(links[0]), "M20,125.418C155,125.418,155,121.875,290,121.875");
});
