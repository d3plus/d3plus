import {it} from "vitest";
import {CanvasRenderer} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    TextBox line placement drawn by both renderers: justified lines span the
    box (all but the last), percentage anchors put each line that share of the
    way across, `truncateWord` output stays inside the box, and right-to-left
    text mirrors it. SVG lines are measured from their tspans' boxes; Canvas
    lines from the painted pixels.
*/

const BOX = {x: 20, y: 20, width: 240, height: 300};
const LONG =
  "The quick brown fox jumps over the lazy dog, then keeps running across the open field until the sun goes down behind the distant hills.";

/**
    Draws one TextBox with `config` on `renderer` and returns its scene node
    and the drawn horizontal extent of each line, relative to the box's left
    edge: `{left, right}`.
*/
const draw = ({config, renderer, rtl}) =>
  new Promise(resolve => {
    if (rtl) document.body.dir = "rtl";
    const box = new window.d3plus.TextBox()
      .data([{text: config.text}])
      .fontFamily("Arial")
      .fontSize(16)
      .fontColor("black")
      .x(BOX.x)
      .y(BOX.y)
      .width(BOX.width)
      .height(BOX.height)
      .config({...config, text: d => d.text});
    if (renderer === "svg") {
      document.body.insertAdjacentHTML(
        "beforeend",
        '<svg id="s" width="400" height="400"></svg>',
      );
      box.select("#s").render(() => {
        const node = box.toScene().children[0];
        const extents = [...document.querySelectorAll("#s text > tspan")].map(
          t => {
            const b = t.getBBox();
            return {left: b.x, right: b.x + b.width};
          },
        );
        resolve({node, extents});
      });
      return;
    }
    const host = document.createElement("div");
    document.body.appendChild(host);
    const scene = {width: 400, height: 400, root: box.toScene()};
    const canvasRenderer = new CanvasRenderer();
    canvasRenderer.mount({container: host, width: 400, height: 400});
    canvasRenderer.drawScene(scene);
    const node = scene.root.children[0];
    const canvas = host.querySelector("canvas");
    const ratio = canvas.width / 400;
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // The ink of each line: the dark pixels between its cap height and descent.
    const extents = node.lines.map(line => {
      const top = Math.floor((BOX.y + line.y - 14) * ratio);
      const bottom = Math.ceil((BOX.y + line.y + 3) * ratio);
      let left = Infinity,
        right = -Infinity;
      for (let py = top; py <= bottom; py++)
        for (let px = 0; px < canvas.width; px++)
          if (img.data[(py * canvas.width + px) * 4 + 3] > 30) {
            left = Math.min(left, px);
            right = Math.max(right, px + 1);
          }
      return {left: left / ratio - BOX.x, right: right / ratio - BOX.x};
    });
    const pick = (x, y) =>
      canvasRenderer.pick([BOX.x + x, BOX.y + y])?.node.key ?? null;
    resolve({
      node,
      extents,
      picks: node.lines.map(line => ({
        nearLeft: pick(4, line.y - 6),
        nearRight: pick(BOX.width - 4, line.y - 6),
      })),
    });
  });

const drawn = (renderer, config, rtl = false) =>
  render("", draw, {renderer, config, rtl});

for (const renderer of ["svg", "canvas"]) {
  it(`TextBox justify fills every line but the last (${renderer})`, async () => {
    const {node, extents} = await drawn(renderer, {
      text: LONG,
      textAnchor: "justify",
    });
    assert.ok(extents.length >= 3, `wraps onto ${extents.length} lines`);
    const last = extents.length - 1;
    extents.forEach(({left, right}, i) => {
      assert.ok(Math.abs(left) <= 3, `line ${i} starts at the left (${left})`);
      if (i < last)
        assert.ok(
          Math.abs(right - BOX.width) <= 4,
          `line ${i} reaches the right edge (${right})`,
        );
    });
    assert.ok(
      extents[last].right < BOX.width - 20,
      `the last line stays start-aligned (${extents[last].right})`,
    );
    assert.strictEqual(node.font.anchor, "start");
    assert.ok(node.lines[0].runs.every(r => typeof r.x === "number"));
  });

  it(`TextBox justify spans right-to-left lines from the right edge (${renderer})`, async () => {
    const {node, extents} = await drawn(
      renderer,
      {
        text: "مرحبا بكم في هذا المثال الطويل الذي يلتف على عدة أسطر داخل المربع لكي نرى كيف يتم ضبط النص من الجهتين",
        textAnchor: "justify",
      },
      true,
    );
    assert.strictEqual(node.font.dir, "rtl");
    const last = extents.length - 1;
    assert.ok(last >= 1, "wraps");
    extents.forEach(({left, right}, i) => {
      assert.ok(
        Math.abs(right - BOX.width) <= 3,
        `line ${i} starts at the right (${right})`,
      );
      if (i < last)
        assert.ok(Math.abs(left) <= 4, `line ${i} reaches the left (${left})`);
    });
    assert.ok(extents[last].left > 20, "the last line stays at the start");
  });

  it(`TextBox percentage anchors place each line that share across (${renderer})`, async () => {
    for (const [align, share] of [
      ["25%", 0.25],
      ["50%", 0.5],
      ["100%", 1],
    ]) {
      const {extents} = await drawn(renderer, {text: LONG, textAnchor: align});
      extents.forEach(({left, right}, i) => {
        const expected = share * (BOX.width - (right - left));
        assert.ok(
          Math.abs(left - expected) <= 3,
          `${align} line ${i}: left ${left}, expected ${expected}`,
        );
      });
    }
  });

  it(`TextBox truncateWord output fits the box (${renderer})`, async () => {
    const config = {
      text: "Hydroxydeoxycorticosterones ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      height: 20,
    };
    const off = await drawn(renderer, {...config, truncateWord: false});
    const on = await drawn(renderer, {...config, truncateWord: true});
    const text = on.node.lines[0].text;
    assert.ok(text.endsWith("..."), text);
    assert.ok(
      text.length > off.node.lines[0].text.length,
      `cuts into the word: "${text}" vs "${off.node.lines[0].text}"`,
    );
    assert.ok(
      on.extents[0].right <= BOX.width + 1,
      `stays inside (${on.extents[0].right})`,
    );
    const first = await drawn(renderer, {
      text: "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ",
      height: 20,
      truncateWord: true,
    });
    assert.ok(first.node.lines[0].text.startsWith("ABC"));
    assert.ok(first.extents[0].right <= BOX.width + 1);
  });
}

it("TextBox canvas hit testing follows justified and right-to-left lines", async () => {
  const justified = await drawn("canvas", {text: LONG, textAnchor: "justify"});
  const last = justified.picks.length - 1;
  justified.picks.slice(0, last).forEach((p, i) => {
    assert.ok(p.nearLeft, `line ${i} picks at its left`);
    assert.ok(p.nearRight, `line ${i} picks at its right`);
  });
  assert.strictEqual(
    justified.picks[last].nearRight,
    null,
    "the start-aligned last line ends short of the right edge",
  );
  const rtl = await drawn("canvas", {text: "قصير"}, true);
  assert.ok(
    rtl.picks[0].nearRight,
    "right-to-left start text picks at the right",
  );
  assert.strictEqual(rtl.picks[0].nearLeft, null);
});

it("chart titles take percentage and justified anchors", async () => {
  const out = await render(
    '<div id="viz" style="width:600px;height:400px"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Plot()
          .data([
            {id: "a", x: 1, y: 2},
            {id: "b", x: 2, y: 1},
          ])
          .groupBy("id")
          .x("x")
          .y("y")
          .duration(0)
          .title("A short title")
          .titleConfig({textAnchor: "100%"})
          .select("#viz");
        viz.render(() => {
          const find = n =>
            n.key === "viz-title"
              ? n
              : (n.children || []).map(find).find(Boolean);
          const title = find(viz.toScene().root);
          resolve({title});
        });
      }),
  );
  const [line] = out.title.lines;
  assert.strictEqual(out.title.font.anchor, "start");
  assert.ok(line.x > 300, `the title sits at the right (${line.x})`);
  assert.ok(line.width > 0);
});
