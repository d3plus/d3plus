import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Network's `layout: "circle"` in real Chromium, on both renderers: the
    nodes on one circle, links bowing in toward the center with their
    arrowheads, loops and labels, node labels turned along their spokes,
    and the hover, link tooltip, legend, and click focus all still work.
    With `linkBundle`, bundled paths replace the bowed ones.
*/

const body = `
  <div id="viz" style="width:640px;height:520px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

const nodes = ["a", "b", "c", "d", "e", "f"].map(id => ({id}));
const links = [
  {source: "a", target: "b", w: 3},
  {source: "b", target: "c", w: 2},
  {source: "c", target: "a", w: 4},
  {source: "d", target: "e", w: 1},
  {source: "e", target: "f", w: 5},
  {source: "f", target: "d", w: 2},
  {source: "a", target: "d", w: 1},
  {source: "f", target: "f", w: 3},
];

/** Draws a circle Network, runs `steps` (a function source), and reads its scene. */
const draw = async ({config, renderer, steps}) => {
  // Functions don't survive the trip into the page, so `weighted` stands in
  // for sizing and labelling the links by their `w`.
  const {weighted, labelled, ...rest} = config;
  if (weighted) rest.linkSize = d => d.w;
  if (labelled) rest.linkLabel = d => d.w;
  const viz = new window.d3plus.Network()
    .config({duration: 0, layout: "circle", ...rest})
    .renderer(renderer)
    .select("#viz");
  await new Promise(resolve => viz.render(resolve));
  const flat = list =>
    list.flatMap(n => (n.children ? [n, ...flat(n.children)] : [n]));
  const summary = (scene = viz._chartScene) => {
    const all = flat(scene);
    return {
      circles: all
        .filter(n => n.type === "circle")
        .map(n => ({
          key: n.key,
          cx: n.cx,
          cy: n.cy,
          opacity: n.paint?.opacity ?? 1,
        })),
      links: all
        .filter(n => n.type === "path" && /^network-link-/.test(n.key))
        .map(n => ({key: n.key, d: n.d, opacity: n.paint?.opacity ?? 1})),
      arrows: all.filter(n => /arrow/.test(`${n.key}`)).length,
      linkLabels: all.filter(n => /^network-link-.*-label$/.test(`${n.key}`))
        .length,
      labels: all
        .filter(n => n.type === "text")
        .map(n => ({
          text: n.lines.map(l => l.text).join(" "),
          rotate: n.transform?.rotate ?? 0,
          key: `${n.key}`,
        })),
    };
  };
  const settle = () =>
    new Promise(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 60)),
    );
  const ctx = {viz, summary, settle, flat};
  const extra = steps
    ? await new Function("ctx", `return (${steps})(ctx)`)(ctx)
    : {};
  return {
    ...summary(),
    ...extra,
    circle: {
      center: viz.ctx.networkCtx.circle.center,
      radius: viz.ctx.networkCtx.circle.radius,
    },
  };
};

for (const renderer of ["svg", "canvas"]) {
  it(`Network circle (${renderer}): nodes on one circle, bowed links, spoke labels`, async () => {
    const drawn = await render(body, draw, {
      config: {
        nodes,
        links,
        weighted: true,
        labelled: true,
        arrows: true,
      },
      renderer,
    });
    const [cx, cy] = drawn.circle.center;
    assert.strictEqual(drawn.circles.length, 6);
    for (const c of drawn.circles)
      assert.ok(
        Math.abs(Math.hypot(c.cx - cx, c.cy - cy) - drawn.circle.radius) < 1e-6,
        `${c.key} on the circle`,
      );
    // Bowed links are drawn as many short runs, not one straight segment.
    const ab = drawn.links.find(l => /-a-b-/.test(l.key));
    assert.ok((ab.d.match(/L/g) || []).length > 10, ab.d);
    assert.ok(drawn.arrows >= 7, `${drawn.arrows} arrowheads`);
    const loop = drawn.links.find(l => /-f-f-/.test(l.key));
    assert.ok(loop && /C/.test(loop.d), "the loop is a curve");
    const nodeLabels = drawn.labels.filter(l => /^network-label-/.test(l.key));
    assert.deepStrictEqual(nodeLabels.map(l => l.text).sort(), [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
    assert.ok(
      nodeLabels.some(l => l.rotate),
      "labels turn along their spokes",
    );
    assert.ok(drawn.linkLabels >= 4, `${drawn.linkLabels} link labels`);
  });

  it(`Network circle (${renderer}): hover, link tooltip, legend, and click focus`, async () => {
    const drawn = await render(body, draw, {
      config: {nodes, links, weighted: true},
      renderer,
      steps: `async ({viz, summary, settle}) => {
        const scene = () => summary(viz.toScene().root ? [viz.toScene().root] : viz.toScene().children);
        const node = viz._chartScene.find(n => n.key === "network-Circle-b");
        viz.schema.on["mousemove.shape"].call(viz, node.datum, 0, undefined, new MouseEvent("mousemove", {clientX: 10, clientY: 10}));
        await settle();
        const hovered = scene();
        viz.schema.on["mouseleave.shape"].call(viz, node.datum, 0);
        const link = viz._chartScene.find(n => /^network-link-a-b-/.test(n.key));
        viz.schema.on["mousemove.shape"].call(viz, link.datum, 0, undefined, new MouseEvent("mousemove", {clientX: 10, clientY: 10}));
        await settle();
        const title = document.querySelector(".d3plus-tooltip-title");
        const linkTip = title ? title.textContent : null;
        viz.schema.on["mouseleave.shape"].call(viz, link.datum, 0);
        const legend = viz._legendData.length;
        viz.schema.on["click.shape"].call(viz, node.datum, 0, undefined, new MouseEvent("click"));
        await settle();
        return {hovered, linkTip, legend, focus: viz._focus};
      }`,
    });
    const op = key => drawn.hovered.circles.find(c => c.key === key).opacity;
    assert.ok(
      op("network-Circle-b") > op("network-Circle-e"),
      "b stays bright",
    );
    assert.ok(
      op("network-Circle-a") > op("network-Circle-e"),
      "its neighbor too",
    );
    assert.ok(
      drawn.linkTip && /a/.test(drawn.linkTip),
      `tooltip: ${drawn.linkTip}`,
    );
    assert.ok(drawn.legend >= 2, "clusters in the legend");
    assert.strictEqual(drawn.focus, "b");
  });

  it(`Network circle (${renderer}): linkBundle replaces the bowed paths`, async () => {
    const drawn = await render(body, draw, {
      config: {nodes, links, linkBundle: true},
      renderer,
      steps: `async ({viz}) => ({
        bundled: viz.ctx.networkCtx.links.filter(l => l.points).length,
        bowed: viz.ctx.networkCtx.links.filter(l => l.points && l.points.length === 25).length,
      })`,
    });
    assert.strictEqual(drawn.bundled, 7, "every link but the loop");
    assert.strictEqual(drawn.bowed, 0, "none bowed");
    assert.strictEqual(drawn.circles.length, 6);
  });
}
