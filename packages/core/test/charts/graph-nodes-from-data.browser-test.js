import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    #118: a node-link chart given `data` and `links` but no `nodes` draws a
    node for every data row, linked or not, and for every link end. With
    `nodes` set, the nodes come from it alone, as before.
*/

const links = [
  {source: "a", target: "b"},
  {source: "b", target: "c"},
  {source: "c", target: "x"},
];
const data = [{id: "a"}, {id: "b"}, {id: "c"}, {id: "lonely"}];

/** Draws `chart` and resolves with the ids of its node shapes, sorted. */
const nodeIds = ([name, renderer, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[name]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(config);
    viz.render(() => {
      const ids = [];
      const walk = n => {
        const prefix = {
          Network: "network-Circle-",
          Sankey: "sankey-Rect-",
          ArcDiagram: "arc-node-",
        }[name];
        const key = String(n.key);
        if (key.startsWith(prefix) && !key.includes("::"))
          ids.push(key.slice(prefix.length));
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      resolve(ids.sort());
    });
  });

const box = "<div id='viz' style='width:600px;height:400px'></div>";

describe.each(["svg", "canvas"])("nodes from data and links (%s)", renderer => {
  for (const name of ["Network", "Sankey", "ArcDiagram"]) {
    it(`${name}: every data row and link end is a node`, async () => {
      const ids = await render(box, nodeIds, [name, renderer, {data, links}]);
      assert.deepStrictEqual(ids, ["a", "b", "c", "lonely", "x"]);
    });

    it(`${name}: links alone still draw their ends`, async () => {
      const ids = await render(box, nodeIds, [name, renderer, {links}]);
      assert.deepStrictEqual(ids, ["a", "b", "c", "x"]);
    });

    it(`${name}: nodes, when set, are the nodes`, async () => {
      const nodes = [{id: "a"}, {id: "b"}, {id: "c"}];
      const ids = await render(box, nodeIds, [
        name,
        renderer,
        {data, links, nodes},
      ]);
      assert.deepStrictEqual(ids, ["a", "b", "c"]);
    });
  }
});

/** Draws a Network and resolves with each node's center, by id, and the chart's size. */
const networkSpots = ([renderer, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Network()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .config(config);
    viz.render(() => {
      const spots = {};
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        const key = String(n.key);
        if (key.startsWith("network-Circle-") && !key.includes("::"))
          spots[key.slice("network-Circle-".length)] = [
            nx + (n.cx ?? 0),
            ny + (n.cy ?? 0),
          ];
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      resolve({spots, width: 600, height: 400});
    });
  });

describe.each(["svg", "canvas"])(
  "Network nodes without links (%s)",
  renderer => {
    it("sit in a row under the linked nodes, all in view", async () => {
      const {spots, width, height} = await render(box, networkSpots, [
        renderer,
        {data, links},
      ]);
      for (const [id, [x, y]] of Object.entries(spots)) {
        assert.ok(x > 0 && x < width, `${id} x ${x}`);
        assert.ok(y > 0 && y < height, `${id} y ${y}`);
      }
      const linkedBottom = Math.max(
        ...["a", "b", "c", "x"].map(id => spots[id][1]),
      );
      assert.ok(spots.lonely[1] > linkedBottom, "lonely sits below");
    });

    it("with no links at all, form a grid that fills the chart", async () => {
      const nodes = ["a", "b", "c", "d"].map(id => ({id}));
      const {spots} = await render(box, networkSpots, [
        renderer,
        {nodes, links: []},
      ]);
      const xs = new Set(Object.values(spots).map(([x]) => Math.round(x)));
      const ys = new Set(Object.values(spots).map(([, y]) => Math.round(y)));
      assert.deepStrictEqual([xs.size, ys.size], [2, 2], "a 2 × 2 grid");
    });
  },
);
