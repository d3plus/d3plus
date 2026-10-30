import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    ArcDiagram in Chromium, on SVG and Canvas: nodes along the line in
    `nodeSort` order, one arc per link from node to node, hover and click
    focus on nodes and arcs, link tooltips, arrows, crowded labels, the dark
    theme, keyboard focus, vertical lines, and the table view.
*/

const nodes = [
  {id: "Echo", group: "b"},
  {id: "Alpha", group: "a"},
  {id: "Delta", group: "b"},
  {id: "Bravo", group: "a"},
  {id: "Charlie", group: "c"},
  {id: "Foxtrot", group: "c"},
];
const links = [
  {source: "Alpha", target: "Bravo", value: 4},
  {source: "Alpha", target: "Echo", value: 1},
  {source: "Bravo", target: "Charlie", value: 2},
  {source: "Delta", target: "Echo", value: 6},
  {source: "Charlie", target: "Alpha", value: 3},
];

const box = "<div id='viz' style='width:640px;height:400px'></div>";

/**
    Runs in the page: draws an ArcDiagram from `config` and reads its painted
    scene back: each node's circle, each arc's path, and the arrowheads.
*/
const draw = ([config, renderer, data]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.ArcDiagram()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data(data.nodes)
      .nodes(data.nodes)
      .links(data.links)
      .config(config);
    window.__viz = viz;
    viz.render(() => {
      const circles = [];
      const arcs = [];
      let arrows = 0;
      const walk = n => {
        const key = String(n.key);
        if (n.type === "circle" && key.startsWith("arc-node-"))
          circles.push({id: n.datum.id, cx: n.cx, cy: n.cy, r: n.r});
        if (n.type === "path" && key.startsWith("arc-link-"))
          arcs.push({
            key,
            d: n.d,
            hit: key.endsWith("::hit"),
            stroke: n.paint.stroke,
            source: n.datum.source.id,
            target: n.datum.target.id,
            side: n.datum.arc.side,
          });
        if (key.startsWith("arc-arrow-")) arrows++;
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      const m = viz._margin;
      const height = viz.schema.height - m.top - m.bottom;
      resolve({circles, arcs, arrows, height});
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`ArcDiagram ${renderer}: nodes sit along the line in nodeSort order`, async () => {
    const order = async nodeSort => {
      const {circles} = await render(box, draw, [
        {nodeSort, color: "group"},
        renderer,
        {nodes, links},
      ]);
      const ys = new Set(circles.map(c => Math.round(c.cy * 100)));
      assert.strictEqual(ys.size, 1, "every node on one line");
      const sorted = [...circles].sort((a, b) => a.cx - b.cx);
      const gaps = sorted.slice(1).map((c, i) => c.cx - sorted[i].cx);
      assert.ok(
        gaps.every(g => Math.abs(g - gaps[0]) < 0.01),
        "evenly spaced",
      );
      return sorted.map(c => c.id).join(",");
    };
    assert.strictEqual(
      await order("data"),
      "Echo,Alpha,Delta,Bravo,Charlie,Foxtrot",
    );
    assert.strictEqual(
      await order("label"),
      "Alpha,Bravo,Charlie,Delta,Echo,Foxtrot",
    );
    assert.strictEqual(
      await order("group"),
      "Alpha,Bravo,Delta,Echo,Charlie,Foxtrot",
    );
    assert.strictEqual(
      await order("degree"),
      "Alpha,Bravo,Charlie,Echo,Delta,Foxtrot",
    );
  });

  it(`ArcDiagram ${renderer}: each link is one arc from its source node to its target node`, async () => {
    for (const arcSide of ["above", "below", "both"]) {
      const {circles, arcs, height} = await render(box, draw, [
        {arcSide, nodeSort: "label"},
        renderer,
        {nodes, links},
      ]);
      const drawn = arcs.filter(a => !a.hit);
      assert.strictEqual(
        drawn.length,
        links.length,
        `${arcSide}: one arc each`,
      );
      assert.strictEqual(arcs.filter(a => a.hit).length, links.length);
      const at = Object.fromEntries(circles.map(c => [c.id, c]));
      const line = circles[0].cy;
      for (const arc of drawn) {
        const m = arc.d.match(
          /^M([\d.-]+),([\d.-]+)A([\d.]+),([\d.]+) 0 0,([01]) ([\d.-]+),([\d.-]+)$/,
        );
        assert.ok(m, `an elliptical arc: ${arc.d}`);
        const [x1, y1, rx, ry, , x2, y2] = m.slice(1).map(Number);
        const s = at[arc.source];
        const t = at[arc.target];
        assert.ok(Math.abs(x1 - s.cx) < 0.01 && Math.abs(y1 - s.cy) < 0.01);
        assert.ok(Math.abs(x2 - t.cx) < 0.01 && Math.abs(y2 - t.cy) < 0.01);
        assert.ok(
          Math.abs(rx - Math.abs(x2 - x1) / 2) < 0.01,
          "spans its nodes",
        );
        assert.ok(ry <= rx + 0.01, "no taller than a semicircle");
        if (arc.side === "above") assert.ok(line - ry >= -0.01, "fits above");
        else assert.ok(line + ry <= height + 0.01, "fits below");
      }
    }
  });

  it(`ArcDiagram ${renderer}: hovering a node dims all but it, its neighbors, and their arcs`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const {circles} = await page.evaluate(draw, [
        {nodeSort: "label"},
        renderer,
        {nodes, links},
      ]);
      const point = await page.evaluate(id => {
        const viz = window.__viz;
        const host =
          document.querySelector("#viz svg") ||
          document.querySelector("#viz canvas");
        const rect = host.getBoundingClientRect();
        const node = viz.ctx.arcCtx.nodes.find(n => n.id === id);
        const t = viz._chartTransform || {x: 0, y: 0};
        return [rect.left + t.x + node.x, rect.top + t.y + node.y];
      }, "Echo");
      assert.ok(circles.length === nodes.length);
      await page.mouse.move(point[0] - 30, point[1] - 30);
      await page.mouse.move(...point, {steps: 3});
      await page.waitForTimeout(150);
      const state = await page.evaluate(() => {
        const opacity = {};
        const walk = n => {
          const key = String(n.key);
          if (key.startsWith("arc-node-") || /^arc-link-.*\d$/.test(key))
            opacity[key] = n.paint?.opacity ?? 1;
          (n.children || []).forEach(walk);
        };
        walk(window.__viz._paintedScene.root);
        const tip = document.querySelector(".d3plus-tooltip");
        return {opacity, tip: tip ? tip.textContent : ""};
      });
      const bright = k => state.opacity[k] === 1;
      assert.ok(state.tip.includes("Echo"), "the node's tooltip");
      assert.ok(state.tip.includes("Connections"), "with its connections");
      for (const id of ["Echo", "Alpha", "Delta"])
        assert.ok(bright(`arc-node-${id}`), `${id} stays bright`);
      for (const id of ["Bravo", "Charlie", "Foxtrot"])
        assert.ok(!bright(`arc-node-${id}`), `${id} dims`);
      assert.ok(bright("arc-link-Alpha-Echo-1"));
      assert.ok(bright("arc-link-Delta-Echo-3"));
      assert.ok(!bright("arc-link-Alpha-Bravo-0"), "other arcs dim");
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });

  it(`ArcDiagram ${renderer}: hovering an arc shows the link's tooltip and highlights its ends`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      await page.evaluate(draw, [
        {nodeSort: "label"},
        renderer,
        {nodes, links},
      ]);
      const point = await page.evaluate(() => {
        const viz = window.__viz;
        const host =
          document.querySelector("#viz svg") ||
          document.querySelector("#viz canvas");
        const rect = host.getBoundingClientRect();
        const link = viz.ctx.arcCtx.links.find(l => l.index === 3);
        const a = link.arc;
        const half = Math.abs(a.to - a.from) / 2;
        const t = viz._chartTransform || {x: 0, y: 0};
        return [
          rect.left + t.x + (a.from + a.to) / 2,
          rect.top + t.y + a.base - half * a.scale,
        ];
      });
      await page.mouse.move(point[0], point[1] + 40);
      await page.mouse.move(...point, {steps: 3});
      await page.waitForTimeout(150);
      const state = await page.evaluate(() => {
        const viz = window.__viz;
        const tip = document.querySelector(".d3plus-tooltip");
        const c = viz.ctx.arcCtx;
        return {
          tip: tip ? tip.textContent : "",
          nodes: c.nodes.filter(n => viz._hover(n.data, n.i)).map(n => n.id),
          links: c.links.filter(l => viz._hover(l, l.index)).map(l => l.index),
        };
      });
      assert.ok(state.tip.includes("Delta → Echo"), `got "${state.tip}"`);
      assert.deepStrictEqual(state.nodes.sort(), ["Delta", "Echo"]);
      assert.deepStrictEqual(state.links, [3]);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });

  it(`ArcDiagram ${renderer}: arrows mark each directed link's ends`, async () => {
    const count = async arrows =>
      (await render(box, draw, [{arrows}, renderer, {nodes, links}])).arrows;
    assert.strictEqual(await count(false), 0);
    assert.strictEqual(await count(true), links.length);
    assert.strictEqual(await count("both"), links.length * 2);
  });

  it(`ArcDiagram ${renderer}: crowded labels turn upright or thin out, and never overlap`, async () => {
    const many = Array.from({length: 60}, (_, i) => ({
      id: `Character ${i + 1}`,
    }));
    const chain = many.slice(1).map((n, i) => ({
      source: many[i].id,
      target: n.id,
    }));
    for (const width of [900, 420, 200]) {
      const result = await render(
        `<div id='viz' style='width:${width}px;height:400px'></div>`,
        async args => {
          await draw(args);
          const c = window.__viz.ctx.arcCtx;
          const texts = Array.from(document.querySelectorAll("#viz svg text"))
            .filter(t => t.textContent.startsWith("Character"))
            .map(t => {
              const r = t.getBoundingClientRect();
              return {x: r.x, y: r.y, width: r.width, height: r.height};
            });
          return {labels: c.labels, texts};
        },
        [{legend: false}, renderer, {nodes: many, links: chain}],
      );
      const {labels} = result;
      assert.ok(labels.length > 0, `${width}: labels draw`);
      const angle = labels[0].angle;
      assert.ok(angle === -90 || angle === -45, `${width}: rotated (${angle})`);
      if (width === 200)
        assert.ok(labels.length < many.length, "a tight line thins them");
      // Every label shares one angle: in its rotated frame, the boxes are
      // axis-aligned, so they overlap only if those boxes do.
      const rad = (-angle * Math.PI) / 180;
      const frame = l => {
        const x = l.x * Math.cos(rad) - l.y * Math.sin(rad);
        const y = l.x * Math.sin(rad) + l.y * Math.cos(rad);
        return {
          x: x + l.box.x,
          y: y + l.box.y,
          w: l.box.width,
          h: l.box.height,
        };
      };
      const boxes = labels.map(frame);
      for (let i = 1; i < boxes.length; i++) {
        const a = boxes[i - 1];
        const b = boxes[i];
        const apart =
          a.x + a.w <= b.x + 0.5 ||
          b.x + b.w <= a.x + 0.5 ||
          a.y + a.h <= b.y + 0.5 ||
          b.y + b.h <= a.y + 0.5;
        assert.ok(apart, `${width}: labels ${i - 1} and ${i} don't overlap`);
      }
      if (renderer === "svg" && angle === -90) {
        const t = result.texts.sort((a, b) => a.x - b.x);
        assert.ok(t.length === labels.length, "every label draws");
        for (let i = 1; i < t.length; i++)
          assert.ok(
            t[i].x >= t[i - 1].x + t[i - 1].width - 0.5,
            "DOM boxes apart",
          );
      }
    }
  });

  it(`ArcDiagram ${renderer}: the dark theme draws arcs in its link gray and labels in its ink`, async () => {
    const read = theme =>
      render(
        box,
        async args => {
          const out = await draw(args);
          const viz = window.__viz;
          let label = null;
          const walk = n => {
            if (n.type === "text" && String(n.key).startsWith("arc-label-"))
              label = n.paint.fill;
            (n.children || []).forEach(walk);
          };
          walk(viz._paintedScene.root);
          return {stroke: out.arcs[0].stroke, link: viz._theme.link, label};
        },
        [{theme}, renderer, {nodes, links}],
      );
    const light = await read("light");
    const dark = await read("dark");
    assert.strictEqual(dark.stroke, dark.link, "the dark link token");
    assert.notStrictEqual(dark.stroke, light.stroke);
    assert.notStrictEqual(dark.label, light.label, "labels follow the ink");
    const lum = c => {
      const [r, g, b] = c.match(/\d+/g).map(Number);
      return r + g + b;
    };
    const rgb = c =>
      c.startsWith("#")
        ? `rgb(${[1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))})`
        : c;
    assert.ok(
      lum(rgb(dark.label)) > lum(rgb(light.label)),
      "light ink on dark",
    );
  });

  it(`ArcDiagram ${renderer}: keyboard focus reaches nodes and arcs`, async () => {
    const visited = await render(
      box,
      async args => {
        await draw(args);
        const viz = window.__viz;
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
        host.focus();
        await wait();
        const seen = new Set();
        for (let i = 0; i < 16; i++) {
          if (viz._keyboardNav?.current) seen.add(viz._keyboardNav.current);
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
          );
          await wait();
        }
        return [...seen];
      },
      [{nodeSort: "label"}, renderer, {nodes, links}],
    );
    assert.ok(
      visited.some(k => k.startsWith("arc-node-")),
      `reaches nodes: ${visited}`,
    );
    assert.ok(
      visited.some(k => k.startsWith("arc-link-") && !k.endsWith("::hit")),
      `reaches arcs: ${visited}`,
    );
    assert.ok(!visited.some(k => k.startsWith("arc-label-")), "labels inert");
  });

  it(`ArcDiagram ${renderer}: clicking a node focuses it and its neighbors, and clicking it again clears`, async () => {
    const result = await render(
      box,
      async args => {
        await draw(args);
        const viz = window.__viz;
        const c = viz.ctx.arcCtx;
        const echo = c.nodes.find(n => n.id === "Echo");
        const active = () =>
          typeof viz._active === "function"
            ? c.nodes.filter(n => viz._active(n.data, n.i)).map(n => n.id)
            : [];
        viz.schema.on["click.shape"](echo.data, echo.i);
        const focused = active();
        viz.schema.on["click.shape"](echo.data, echo.i);
        const cleared = active();
        const link = c.links.find(l => l.index === 0);
        viz.schema.on["click.shape"](link, link.index);
        const arc = active();
        viz.schema.on["click.legend"]({id: "Alpha", group: "a"}, 0);
        const legend = active();
        return {focused, cleared, arc, legend};
      },
      [{nodeSort: "label"}, renderer, {nodes, links}],
    );
    assert.deepStrictEqual(result.focused.sort(), ["Alpha", "Delta", "Echo"]);
    assert.deepStrictEqual(result.cleared, []);
    assert.deepStrictEqual(result.arc.sort(), ["Alpha", "Bravo"]);
    assert.deepStrictEqual(result.legend, ["Alpha"]);
  });

  it(`ArcDiagram ${renderer}: a vertical line, colored arcs, and sized nodes`, async () => {
    const {circles, arcs} = await render(box, draw, [
      {
        orient: "vertical",
        linkColor: "source",
        color: "group",
        size: "weight",
      },
      renderer,
      {nodes: nodes.map((n, i) => ({...n, weight: i + 1})), links},
    ]);
    const xs = new Set(circles.map(c => Math.round(c.cx * 100)));
    assert.strictEqual(xs.size, 1, "every node on one vertical line");
    const radii = new Set(circles.map(c => c.r));
    assert.ok(radii.size > 1, "sized nodes");
    const drawn = arcs.filter(a => !a.hit);
    const strokes = new Set(drawn.map(a => a.stroke));
    assert.ok(strokes.size > 1, "arcs take their source node's color");
    for (const arc of drawn) {
      const m = arc.d.match(/^M([\d.-]+),([\d.-]+)A([\d.]+),([\d.]+)/);
      assert.ok(Number(m[3]) <= Number(m[4]) + 0.01, "bulges across the line");
    }
  });

  it(`ArcDiagram ${renderer}: the table view lists nodes, then links`, async () => {
    const table = await render(
      box,
      async args => {
        await draw(args);
        const viz = window.__viz;
        document
          .querySelector(".d3plus-top-left-controls-item .table-view-toggle")
          .click();
        await new Promise(r => setTimeout(r, 30));
        const heads = Array.from(
          document.querySelectorAll(".d3plus-table-view-table thead th"),
        ).map(th => th.textContent.trim());
        return {
          rows: viz._tableData(),
          heads,
          body: document.querySelectorAll(".d3plus-table-view-table tbody tr")
            .length,
        };
      },
      [{}, renderer, {nodes, links}],
    );
    assert.strictEqual(table.rows.length, nodes.length + links.length);
    assert.strictEqual(table.rows[0].id, "Echo");
    assert.strictEqual(table.rows[0].Connections, 2);
    const first = table.rows[nodes.length];
    assert.deepStrictEqual(
      [first.From, first.To, first.value],
      ["Alpha", "Bravo", 4],
    );
    for (const head of ["id", "group", "Connections", "From", "To", "value"])
      assert.ok(
        table.heads.some(h => h.includes(head)),
        `${head} column`,
      );
    assert.ok(table.body > 0, "rows render");
  });
}

it("ArcDiagram draws with reducedMotion and a size legend", async () => {
  const result = await render(
    box,
    args =>
      new Promise(resolve => {
        const viz = new window.d3plus.ArcDiagram()
          .select("#viz")
          .reducedMotion(true)
          .data(args.nodes.map((n, i) => ({...n, value: i + 1})))
          .nodes(args.nodes)
          .links(args.links)
          .size("value");
        viz.render(() =>
          resolve({
            legend: !!viz._sizeLegendFinal,
            nodes: viz.ctx.arcCtx.nodes.length,
          }),
        );
      }),
    {nodes, links},
  );
  assert.deepStrictEqual(result, {legend: true, nodes: nodes.length});
});
