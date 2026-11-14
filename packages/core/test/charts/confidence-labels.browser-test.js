import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Labels beside error bars, on SVG and Canvas: a point's label placed
    outside its point keeps clear of every error bar's line and caps (or
    hides when no side is clear), and a bar with an error bar anchors its
    label at its base, away from the whisker at its end.
*/

const probe = ([renderer, kind, config]) =>
  new Promise(resolve => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const walk = (nodes, out = []) => {
      for (const n of nodes || []) {
        if (n.type === "group") walk(n.children, out);
        else out.push(n);
      }
      return out;
    };
    const viz = new window.d3plus[kind]()
      .select(el)
      .renderer(renderer)
      .detectVisible(false)
      .duration(0)
      .width(600)
      .height(400)
      .legend(false)
      .config(config);
    viz.render(() => {
      const nodes = walk(viz._chartScene);
      const at = n => ({x: n.transform?.x ?? 0, y: n.transform?.y ?? 0});
      // Each error bar's strokes, as [x1, y1, x2, y2] in plot pixels.
      const strokes = nodes
        .filter(n => String(n.key).endsWith("::confidence"))
        .flatMap(n => {
          const t = at(n);
          return Array.from(
            n.d.matchAll(/M([-\d.e]+),([-\d.e]+)L([-\d.e]+),([-\d.e]+)/g),
          ).map(m => [+m[1] + t.x, +m[2] + t.y, +m[3] + t.x, +m[4] + t.y]);
        });
      const labels = nodes
        .filter(n => n.type === "text" && n.lines?.length && n.datum)
        .map(n => {
          const t = at(n);
          return {
            key: String(n.key),
            text: n.lines.map(l => l.text).join(" "),
            anchor: n.font?.anchor,
            box: {x: t.x + n.x, y: t.y + n.y, width: n.width, height: n.height},
            line: {
              x: t.x + n.x + n.lines[0].x,
              y: t.y + n.y + n.lines[0].y,
              width: n.lines[0].width,
            },
          };
        });
      const bars = nodes
        .filter(n => n.type === "rect" && n.shapeType === "Bar")
        .filter(n => !String(n.key).endsWith("::hit"))
        .map(n => {
          const t = at(n);
          return {
            key: String(n.key),
            x: t.x + n.x,
            y: t.y + n.y,
            width: n.width,
            height: n.height,
          };
        });
      resolve({strokes, labels, bars});
    });
  });

/** Whether a label box overlaps a stroke's own box, widened by `pad`. */
const hits = (box, [x1, y1, x2, y2], pad) =>
  box.x < Math.max(x1, x2) + pad &&
  box.x + box.width > Math.min(x1, x2) - pad &&
  box.y < Math.max(y1, y2) + pad &&
  box.y + box.height > Math.min(y1, y2) - pad;

const studies = [
  [12, 9, 15, 3.1, 2.4, 3.9],
  [20, 17.5, 23, 4.4, 3.9, 5.2],
  [31, 25, 36, 5, 4.1, 5.6],
  [38, 35, 42, 6.3, 5.5, 7.4],
  [47, 40, 51, 6.9, 6.1, 7.5],
  [26, 22, 29, 6.2, 5.8, 6.9],
  [42, 40, 45, 4.2, 3.6, 4.9],
].map(([x, xl, xh, y, yl, yh], i) => ({
  id: `Study ${String.fromCharCode(65 + i)}`,
  x,
  xl,
  xh,
  y,
  yl,
  yh,
}));

for (const renderer of ["svg", "canvas"]) {
  it(`Scatter: a label beside its point keeps clear of every error bar line and cap (${renderer})`, async function () {
    for (const confidence of [
      {x: ["xl", "xh"], y: ["yl", "yh"]},
      ["yl", "yh"],
      {x: ["xl", "xh"]},
    ]) {
      const r = await render("", probe, [
        renderer,
        "Scatter",
        {data: studies, groupBy: "id", x: "x", y: "y", confidence},
      ]);
      assert.ok(r.strokes.length > 0, "error bars drew");
      const labels = r.labels.filter(l => l.text.startsWith("Study"));
      assert.ok(labels.length > 0, "some labels found room");
      for (const l of labels)
        for (const s of r.strokes)
          assert.ok(
            !hits(l.box, s, 0.5),
            `${l.text} overlaps an error bar at ${s.map(Math.round)}`,
          );
    }
  });

  it(`BarChart: a bar with an error bar anchors its label at its base (${renderer})`, async function () {
    const data = [
      {id: "Long", v: 40, lo: 30, hi: 45},
      {id: "Short", v: 8, lo: 6, hi: 12},
      {id: "Plain", v: 30},
    ];
    const horizontal = await render("", probe, [
      renderer,
      "BarChart",
      {
        data,
        groupBy: "id",
        discrete: "y",
        y: "id",
        x: "v",
        confidence: ["lo", "hi"],
      },
    ]);
    const label = id => horizontal.labels.find(l => l.text === id);
    const bar = id => horizontal.bars.find(b => b.key.startsWith(id));
    // Inside: starts at the bar's left end, its base.
    assert.strictEqual(label("Long").anchor, "start");
    assert.ok(label("Long").line.x - bar("Long").x < 6);
    // Outside: starts past the whisker's far end (45 → right of the bar).
    const longEnd = bar("Long").x + bar("Long").width;
    const reach = ((45 - 40) / 40) * bar("Long").width;
    const short = label("Short");
    const shortEnd = bar("Short").x + bar("Short").width;
    assert.ok(short.line.x > shortEnd + ((12 - 8) / 40) * bar("Long").width);
    assert.ok(longEnd + reach > longEnd);
    // A bar without bounds keeps its label at its end.
    assert.strictEqual(label("Plain").anchor, "end");

    const upright = await render("", probe, [
      renderer,
      "BarChart",
      {data, groupBy: "id", x: "id", y: "v", confidence: ["lo", "hi"]},
    ]);
    const tall = upright.labels.find(l => l.text === "Long");
    const tallBar = upright.bars.find(b => b.key.startsWith("Long"));
    // Its text sits in the bar's lower half, at the base.
    assert.ok(tall.line.y > tallBar.y + tallBar.height / 2, "near the bottom");
    const plain = upright.labels.find(l => l.text === "Plain");
    const plainBar = upright.bars.find(b => b.key.startsWith("Plain"));
    assert.ok(plain.line.y < plainBar.y + plainBar.height / 2, "near the top");
  });
}
