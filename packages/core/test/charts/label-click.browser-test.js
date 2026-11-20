/* global MouseEvent */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A mark's label acts as the mark it labels (#1255): clicking or hovering a
    Pie wedge's label or a bar's label fires every handler with the same
    `(d, i, x)` as the wedge or bar, shows the same tooltip, and lights the
    same marks.
*/

const charts = {
  Pie: {
    shape: "Pie",
    src: `new lib.Pie()
      .data([{id: "alpha", value: 8}, {id: "beta", value: 72}, {id: "gamma", value: 20}])
      .groupBy("id").value("value")`,
  },
  BarChart: {
    shape: "Bar",
    src: `new lib.BarChart()
      .data([{id: "alpha", x: "alpha", y: 8}, {id: "beta", x: "beta", y: 72}, {id: "gamma", x: "gamma", y: 20}])
      .groupBy("id").x("x").y("y").label(d => d.id)`,
  },
};

const probe = async ([src, shape, renderer]) => {
  const target = document.getElementById("viz");
  const calls = [];
  const log = key => (d, i, x) => calls.push({key, d, i, x});
  const viz = new Function("lib", `return ${src};`)(window.d3plus)
    .duration(0)
    .width(500)
    .height(400)
    .on("click", log("click"))
    .on("click.shape", log("click.shape"))
    .on(`click.${shape}`, log(`click.${shape}`))
    .on("mousemove", log("mousemove"));
  await new Promise(r => viz.select(target).renderer(renderer).render(r));

  const host = target.querySelector(renderer === "canvas" ? "canvas" : "svg");
  const rect = host.getBoundingClientRect();
  // One point well inside each mark and each mark's label (its neighbors
  // pick the same node, clear of a hovered mark's wider stroke), by key.
  const pick = (x, y) => viz._sceneRenderer.pick([x, y])?.node;
  const inside = (node, x, y, r) =>
    [-r, 0, r].every(dx =>
      [-r, 0, r].every(dy => pick(x + dx, y + dy) === node),
    );
  const marks = new Map(),
    labels = new Map();
  for (let y = 2; y < 400; y += 2)
    for (let x = 2; x < 500; x += 2) {
      const node = pick(x, y);
      if (!node) continue;
      if (node.shapeType === shape) {
        if (!marks.has(node.key) && inside(node, x, y, 6))
          marks.set(node.key, {x, y, node});
      } else if (node.type === "text" && node.datum && !labels.has(node.key))
        if (inside(node, x, y, 1)) labels.set(node.key, {x, y, node});
    }

  const fire = (type, {x, y}) => {
    calls.length = 0;
    const clientX = rect.left + x,
      clientY = rect.top + y;
    const el =
      renderer === "canvas"
        ? host
        : document.elementFromPoint(clientX, clientY);
    el.dispatchEvent(new MouseEvent(type, {bubbles: true, clientX, clientY}));
    return calls.slice();
  };
  const settle = () => new Promise(r => setTimeout(r, 60));
  const opacities = () => {
    const out = {};
    const walk = n => {
      if (n.shapeType === shape) out[n.key] = n.paint?.opacity ?? 1;
      (n.children || []).forEach(walk);
    };
    walk(viz._paintedScene.root);
    return out;
  };
  const tooltip = () =>
    document.querySelector(".d3plus-tooltip .d3plus-tooltip-title")
      ?.textContent ?? null;

  const pairs = [];
  for (const [key, label] of labels) {
    const clickLabel = fire("click", label);
    if (!clickLabel.length) continue;
    // The mark that answers with the same row.
    const mark = [...marks.values()].find(
      m => fire("click", m)[0]?.d === clickLabel[0].d,
    );
    if (!mark) {
      pairs.push({key, mark: null});
      continue;
    }
    const clickMark = fire("click", mark);
    fire("mousemove", {x: 1, y: 1});
    await settle();
    const hoverMark = fire("mousemove", mark);
    await settle();
    const markHover = {tip: tooltip(), opacity: opacities()};
    fire("mousemove", {x: 1, y: 1});
    await settle();
    const hoverLabel = fire("mousemove", label);
    await settle();
    const labelHover = {tip: tooltip(), opacity: opacities()};
    const same = (a, b) =>
      a.length === b.length &&
      a.every(
        (c, n) =>
          c.key === b[n].key &&
          c.d === b[n].d &&
          c.i === b[n].i &&
          c.x === b[n].x,
      );
    pairs.push({
      key,
      mark: mark.node.key,
      clickKeys: clickLabel.map(c => c.key),
      sameClick: same(clickLabel, clickMark),
      sameHover: same(hoverLabel, hoverMark),
      labelRow: clickLabel[0].d,
      markHover,
      labelHover,
    });
  }
  return {labels: labels.size, pairs};
};

for (const [name, {shape, src}] of Object.entries(charts))
  for (const renderer of ["svg", "canvas"])
    it(`${name} (${renderer}): a label reports its mark's (d, i, x) to click and hover`, async () => {
      const out = await render(
        '<div id="viz" style="width:500px;height:400px"></div>',
        probe,
        [src, shape, renderer],
      );
      const pairs = out.pairs;
      assert.ok(
        pairs.length >= 2,
        `clicked at least two labels (${pairs.length})`,
      );
      for (const p of pairs) {
        assert.ok(p.mark, `${p.key}: a mark answers with the label's row`);
        for (const k of ["click.shape", `click.${shape}`, "click"])
          assert.ok(
            p.clickKeys.includes(k),
            `${p.key}: "${k}" fires on the label`,
          );
        assert.ok(
          p.sameClick,
          `${p.key}: click handlers get the mark's (d, i, x)`,
        );
        assert.ok(p.sameHover, `${p.key}: mousemove gets the mark's (d, i, x)`);
        assert.strictEqual(p.labelRow.__d3plus__, undefined, "a source row");
        assert.ok(
          p.labelHover.tip,
          `${p.key}: hovering the label shows a tooltip`,
        );
        assert.strictEqual(
          p.labelHover.tip,
          p.markHover.tip,
          "the mark's tooltip",
        );
        assert.deepStrictEqual(
          p.labelHover.opacity,
          p.markHover.opacity,
          `${p.key}: lights the same marks`,
        );
      }
    });

const lineProbe = async renderer => {
  const target = document.getElementById("viz");
  const calls = [];
  const log = key => (d, i, x) => calls.push({key, d, i, x});
  const data = [
    {id: "alpha", x: 1, y: 8},
    {id: "alpha", x: 2, y: 9},
    {id: "alpha", x: 3, y: 12},
    {id: "beta", x: 1, y: 72},
    {id: "beta", x: 2, y: 60},
    {id: "beta", x: 3, y: 64},
  ];
  const viz = new window.d3plus.LinePlot()
    .data(data)
    .groupBy("id")
    .x("x")
    .y("y")
    .lineLabels(true)
    .duration(0)
    .width(500)
    .height(400)
    .on("click.shape", log("click.shape"))
    .on("click.Line", log("click.Line"));
  await new Promise(r => viz.select(target).renderer(renderer).render(r));
  const host = target.querySelector(renderer === "canvas" ? "canvas" : "svg");
  const rect = host.getBoundingClientRect();
  let label = null;
  for (let y = 2; y < 400 && !label; y += 2)
    for (let x = 2; x < 500; x += 2) {
      const node = viz._sceneRenderer.pick([x, y])?.node;
      if (node?.type === "text" && node.datum && /^beta/.test(node.key)) {
        label = {x: x + 1, y: y + 1, node};
        break;
      }
    }
  if (!label) return {label: false};
  const clientX = rect.left + label.x,
    clientY = rect.top + label.y;
  const el =
    renderer === "canvas" ? host : document.elementFromPoint(clientX, clientY);
  el.dispatchEvent(new MouseEvent("click", {bubbles: true, clientX, clientY}));
  el.dispatchEvent(
    new MouseEvent("mousemove", {bubbles: true, clientX, clientY}),
  );
  await new Promise(r => setTimeout(r, 60));
  const tip = document.querySelector(".d3plus-tooltip .d3plus-tooltip-title");
  return {
    label: true,
    keys: calls.map(c => c.key),
    rows: calls.map(c => [c.d.id, c.d.x, c.x.data === c.d]),
    indexes: calls.map(c => c.i),
    sameX: calls.every(c => c.x === calls[0].x),
    tip: tip ? tip.textContent : null,
  };
};

for (const renderer of ["svg", "canvas"])
  it(`LinePlot (${renderer}): a line's label reports the point it sits by, as the line does there`, async () => {
    const out = await render(
      '<div id="viz" style="width:500px;height:400px"></div>',
      lineProbe,
      renderer,
    );
    assert.ok(out.label, "found the beta line's label");
    assert.deepStrictEqual(out.keys, ["click.shape", "click.Line"]);
    assert.deepStrictEqual(
      out.rows,
      [
        ["beta", 3, true],
        ["beta", 3, true],
      ],
      "d is the row of the point the label sits by (the line's last)",
    );
    assert.deepStrictEqual(out.indexes, [5, 5], "i is that row's index");
    assert.ok(out.sameX, "x is that point's wrapped datum");
    assert.strictEqual(
      out.tip,
      "beta",
      "hovering the label shows the line's tooltip",
    );
  });
