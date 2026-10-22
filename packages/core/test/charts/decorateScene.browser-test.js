import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `ChartDefinition.decorateScene` — the optional pass over a chart's
    finished scene. The hook receives every scene the chart builds, its
    return value is what the renderer paints (SVG and Canvas), it runs once
    per build including hover repaints, and a def without it builds the
    scene its base class builds.

    The Viz render pipeline awaits browser layout that never resolves under
    jsdom, so these run in Chromium. Each probe gets a fresh page (and copy of
    d3plus), so the tests set the hook on the page's own `treemapDef` (the def
    the `Treemap` class reads).
*/

const data = [
  {id: "alpha", value: 29},
  {id: "beta", value: 10},
  {id: "gamma", value: 2},
];

/** Renders a Treemap whose def adds a marker rect to the scene root. */
async function probe(renderer, hook) {
  return render.isolated(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async ({data, renderer, hook}) => {
      const {Treemap, treemapDef, Viz} = window.d3plus;
      const find = (node, key) => {
        if (!node) return undefined;
        if (node.key === key) return node;
        for (const child of node.children || []) {
          const hit = find(child, key);
          if (hit) return hit;
        }
        return undefined;
      };
      const calls = [];
      const builds = [];
      if (hook) {
        treemapDef.decorateScene = (viz, scene) => {
          calls.push({
            self: viz === window.__viz,
            root: scene.root.key,
            cells: !!find(scene.root, "viz-chart-cells"),
            marker: !!find(scene.root, "decorated-marker"),
          });
          const marker = {
            type: "rect",
            key: "decorated-marker",
            x: 1,
            y: 2,
            width: 3,
            height: 4,
            paint: {fill: "red"},
          };
          return {
            ...scene,
            root: {...scene.root, children: [...scene.root.children, marker]},
          };
        };
      }
      const viz = (window.__viz = new Treemap()
        .select("#viz")
        .renderer(renderer)
        .duration(0)
        .data(data)
        .groupBy("id")
        .sum("value"));
      await new Promise(resolve => viz.render(resolve));
      const first = {
        calls: calls.length,
        painted: !!find(viz._paintedScene.root, "decorated-marker"),
        rendered: viz._lastSceneRendered === viz._paintedScene,
        svgNode: !!document.querySelector("#viz [data-key='decorated-marker']"),
        canvas: !!document.querySelector("#viz canvas.d3plus-render-canvas"),
        kind: viz._sceneRenderer.kind,
      };

      // Count the scenes a hover repaint builds against the hook's calls.
      const toScene = viz.toScene.bind(viz);
      viz.toScene = () => {
        const scene = toScene();
        builds.push(scene);
        return scene;
      };
      const before = calls.length;
      viz.hover(d => d.id === "alpha");
      await new Promise(resolve =>
        requestAnimationFrame(() => setTimeout(resolve, 50)),
      );
      viz.toScene = toScene;
      const hover = {
        builds: builds.length,
        calls: calls.length - before,
        painted: !!find(viz._paintedScene.root, "decorated-marker"),
      };

      // Without a hook, the chart's scene is its base class's.
      const shape = node => [
        node.type,
        node.key,
        node.transform,
        (node.children || []).map(shape),
      ];
      const plain =
        JSON.stringify(shape(Viz.prototype.toScene.call(viz).root)) ===
        JSON.stringify(shape(viz.toScene().root));
      return {first, calls, hover, plain};
    },
    {data, renderer, hook},
  );
}

it(
  "decorateScene receives the finished scene and the SVG renderer paints its return value",
  {timeout: 300000},
  async function () {
    const {first, calls} = await probe("svg", true);
    assert.ok(first.calls >= 1, "the hook runs on the first render");
    assert.ok(calls[0].self, "it receives the chart instance");
    assert.strictEqual(calls[0].root, "viz-root", "and the finished scene");
    assert.ok(calls[0].cells, "with the chart cells already composed");
    assert.ok(!calls[0].marker, "before its own changes");
    assert.ok(first.painted, "the painted scene is the hook's return value");
    assert.ok(first.rendered, "and it reaches the renderer");
    assert.strictEqual(first.kind, "svg");
    assert.ok(first.svgNode, "the SVG renderer draws the added node");
  },
);

it(
  "decorateScene's return value is what the Canvas renderer paints",
  {timeout: 300000},
  async function () {
    const {first} = await probe("canvas", true);
    assert.ok(first.calls >= 1, "the hook runs on the first render");
    assert.strictEqual(first.kind, "canvas");
    assert.ok(first.canvas, "a canvas is mounted");
    assert.ok(
      first.painted && first.rendered,
      "the Canvas renderer receives the hook's scene",
    );
    assert.ok(!first.svgNode, "and no SVG node is drawn for it");
  },
);

it(
  "decorateScene runs once per scene build, including hover repaints",
  {timeout: 300000},
  async function () {
    for (const renderer of ["svg", "canvas"]) {
      const {hover} = await probe(renderer, true);
      assert.ok(hover.builds >= 1, `${renderer}: hovering repaints the scene`);
      assert.strictEqual(
        hover.calls,
        hover.builds,
        `${renderer}: the hook runs exactly once per scene built`,
      );
      assert.ok(
        hover.painted,
        `${renderer}: the hover repaint keeps its changes`,
      );
    }
  },
);

it(
  "a def without decorateScene builds the scene its base class builds",
  {timeout: 300000},
  async function () {
    const {first, calls, plain} = await probe("svg", false);
    assert.strictEqual(calls.length, 0);
    assert.ok(!first.painted, "nothing is added");
    assert.ok(plain, "toScene matches Viz.prototype.toScene");
  },
);
