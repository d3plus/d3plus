import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {withPage} from "~test/browser/page.js";

/**
    TextBox `textPath` and `hitbox` in a real browser. Path text is drawn by
    both renderers and compared pixel for pixel: the SVG is rasterized
    through an <img> and its ink box checked against the Canvas ink box. The
    hitbox is clicked with the real pointer, between lines and between words.
*/

const SIZE = 420;
const ARC = "M30,200 A180,150 0 0 1 390,200";
const WAVE = "M20,300 C100,220 180,380 260,300 S380,220 400,300";

/**
    Draws one TextBox config on both renderers and returns the SVG output
    (textPath element, its href target, glyph start positions) and each
    renderer's ink box.
*/
const drawBoth = ({config, rtl}) =>
  new Promise((resolve, reject) => {
    if (rtl) document.body.dir = "rtl";
    const {TextBox, CanvasRenderer, SvgRenderer} = window.d3plus;
    const box = () =>
      new TextBox()
        .fontFamily("Arial")
        .fontSize(18)
        .fontColor("black")
        .width(SIZE)
        .height(SIZE)
        .config(config);
    const svgHost = document.createElement("div");
    const canvasHost = document.createElement("div");
    document.body.append(svgHost, canvasHost);
    const scene = () => ({
      width: SIZE,
      height: SIZE,
      root: {type: "group", key: "root", children: [box().toScene()]},
    });
    const svgRenderer = new SvgRenderer();
    svgRenderer.mount({container: svgHost, width: SIZE, height: SIZE});
    svgRenderer.drawScene(scene(), {duration: 0});
    const canvasRenderer = new CanvasRenderer();
    canvasRenderer.mount({container: canvasHost, width: SIZE, height: SIZE});
    canvasRenderer.drawScene(scene(), {duration: 0});

    /** The box around every pixel with ink, in CSS pixels. */
    const inkBox = (canvas, ratio) => {
      const img = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height);
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity,
        count = 0;
      for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++)
          if (img.data[(y * canvas.width + x) * 4 + 3] > 60) {
            count++;
            x0 = Math.min(x0, x);
            y0 = Math.min(y0, y);
            x1 = Math.max(x1, x + 1);
            y1 = Math.max(y1, y + 1);
          }
      return {
        left: x0 / ratio,
        top: y0 / ratio,
        right: x1 / ratio,
        bottom: y1 / ratio,
        count,
      };
    };

    const svg = svgHost.querySelector("svg");
    const text = svg.querySelector("text");
    const textPath = text.querySelector("textPath");
    const href = textPath && textPath.getAttribute("href");
    const target = href && svg.querySelector(href);
    const glyphs = [];
    for (let k = 0; k < text.getNumberOfChars(); k += 3) {
      try {
        const p = text.getStartPositionOfChar(k);
        glyphs.push([p.x, p.y]);
      } catch {
        // Characters off the path have no position.
      }
    }
    const canvas = canvasHost.querySelector("canvas");
    const canvasInk = inkBox(canvas, canvas.width / SIZE);
    const image = new Image();
    image.onload = () => {
      const raster = document.createElement("canvas");
      raster.width = SIZE;
      raster.height = SIZE;
      raster.getContext("2d").drawImage(image, 0, 0);
      resolve({
        hasTextPath: !!textPath,
        href,
        targetTag: target ? target.tagName : null,
        targetInDefs: !!(target && target.closest("defs")),
        startOffset: textPath && Number(textPath.getAttribute("startOffset")),
        content: textPath && textPath.textContent,
        glyphs,
        svgInk: inkBox(raster, 1),
        canvasInk,
        node: scene().root.children[0].children.find(n => n.type === "text"),
      });
    };
    image.onerror = reject;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      new XMLSerializer().serializeToString(svg),
    )}`;
  });

const close = (a, b, tol, label) =>
  assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} vs ${b} (±${tol})`);

/** Asserts the Canvas ink box matches the SVG ink box. */
const inkMatches = (out, tol = 4) => {
  assert.ok(out.svgInk.count > 200, "SVG drew text");
  assert.ok(out.canvasInk.count > 200, "Canvas drew text");
  for (const side of ["left", "top", "right", "bottom"])
    close(out.canvasInk[side], out.svgInk[side], tol, side);
};

it("textPath: SVG follows the path through a <textPath> into <defs>", async () => {
  const out = await render("", drawBoth, {
    config: {
      data: [{text: "Text follows an arc from one end to the other"}],
      textPath: ARC,
      textAnchor: "middle",
    },
  });
  assert.ok(out.hasTextPath, "draws a <textPath>");
  assert.ok(/^#d3plus-textpath-\d+-\d+$/.test(out.href), out.href);
  assert.strictEqual(out.targetTag, "path", "its href resolves to a path");
  assert.ok(out.targetInDefs, "the path sits in <defs>");
  assert.strictEqual(
    out.content,
    "Text follows an arc from one end to the other",
  );
  // Each sampled glyph starts on the arc: (x − 210)²/180² + (y − 200)²/150²
  // is 1 on the ellipse the arc follows.
  assert.ok(out.glyphs.length > 5);
  for (const [x, y] of out.glyphs) {
    const r = Math.hypot((x - 210) / 180, (y - 200) / 150);
    assert.ok(Math.abs(r - 1) < 0.02, `glyph at ${x},${y} sits on the arc`);
  }
  // middle: the line is centered on the path's length.
  const line = out.node.lines[0];
  close(out.startOffset + line.width / 2, out.node.lines[0].x, 0.01, "center");
});

for (const [name, config, rtl] of [
  [
    "an arc",
    {data: [{text: "Text follows an arc from end to end"}], textPath: ARC},
  ],
  [
    "a wave",
    {
      data: [{text: "A wave carries the words up and down"}],
      textPath: WAVE,
      textAnchor: "25%",
    },
  ],
  [
    "a circle",
    {
      data: [{text: "Around the circle the text goes, around and around"}],
      textPath: "M210,110 A100,100 0 1 1 209.9,110 Z",
    },
  ],
  [
    'side: "right"',
    {
      data: [{text: "Under the arc instead"}],
      textPath: ARC,
      side: "right",
      textAnchor: "middle",
    },
  ],
  [
    "right-to-left text",
    {data: [{text: "مرحبا بكم في هذا المثال New York"}], textPath: WAVE},
    true,
  ],
]) {
  it(`textPath: Canvas matches SVG on ${name}`, async () => {
    const out = await render("", drawBoth, {config, rtl});
    inkMatches(out);
  });
}

it("textPath: a long line is cut to the path with the ellipsis", async () => {
  const out = await render("", drawBoth, {
    config: {
      data: [
        {
          text: "This sentence is far too long to fit along the short path it has been given here",
        },
      ],
      textPath: "M20,100 L220,100",
      truncateWord: true,
    },
  });
  const line = out.node.lines[0];
  assert.ok(line.text.endsWith("..."), line.text);
  assert.ok(line.width <= 200, `fits the path (${line.width})`);
  assert.ok(out.svgInk.right <= 222, `SVG ink stays on the path`);
  assert.ok(out.canvasInk.right <= 222, `Canvas ink stays on the path`);
});

it("textPath: a redraw with a changed path updates it", async () => {
  const out = await render(
    "",
    () =>
      new Promise(resolve => {
        const {TextBox, SvgRenderer, CanvasRenderer} = window.d3plus;
        const host = document.createElement("div");
        const canvasHost = document.createElement("div");
        document.body.append(host, canvasHost);
        const svgRenderer = new SvgRenderer();
        svgRenderer.mount({container: host, width: 420, height: 420});
        const canvasRenderer = new CanvasRenderer();
        canvasRenderer.mount({container: canvasHost, width: 420, height: 420});
        const draw = d => {
          const scene = {
            width: 420,
            height: 420,
            root: {
              type: "group",
              key: "root",
              children: [
                new TextBox()
                  .data([{id: "a", text: "Moving text"}])
                  .textPath(d)
                  .fontFamily("Arial")
                  .fontSize(18)
                  .toScene(),
              ],
            },
          };
          svgRenderer.drawScene(scene, {duration: 0});
          canvasRenderer.drawScene(scene, {duration: 0});
        };
        const state = () => {
          const tp = host.querySelector("textPath");
          const defs = host.querySelectorAll("defs path");
          const canvas = canvasHost.querySelector("canvas");
          const ctx = canvas.getContext("2d");
          const ratio = canvas.width / 420;
          let top = Infinity;
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 3; i < img.data.length; i += 4)
            if (img.data[i] > 60)
              top = Math.min(top, Math.floor((i - 3) / 4 / canvas.width));
          return {
            href: tp.getAttribute("href"),
            d: host.querySelector(tp.getAttribute("href")).getAttribute("d"),
            defs: defs.length,
            canvasTop: top / ratio,
          };
        };
        draw("M20,100 L400,100");
        const before = state();
        draw("M20,300 L400,300");
        const after = state();
        draw(false);
        resolve({
          before,
          after,
          offPath: {
            textPath: !!host.querySelector("textPath"),
            tspans: host.querySelectorAll("text > tspan").length,
          },
        });
      }),
  );
  assert.strictEqual(out.before.d, "M20,100 L400,100");
  assert.strictEqual(out.after.d, "M20,300 L400,300", "the path updates");
  assert.strictEqual(out.after.href, out.before.href, "under the same id");
  assert.strictEqual(out.after.defs, 1, "one path in <defs>");
  assert.ok(out.before.canvasTop < 100 && out.after.canvasTop > 270);
  assert.deepStrictEqual(
    out.offPath,
    {textPath: false, tspans: 1},
    "without a path the text draws in its box again",
  );
});

/**
    Mounts a two-line TextBox (with or without a hitbox) on `renderer`, and
    logs the datum of each click the renderer reports.
*/
const mountHitbox = ({renderer, hitbox}) => {
  const {TextBox, CanvasRenderer, SvgRenderer} = window.d3plus;
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;left:0;top:0";
  document.body.appendChild(host);
  const r = renderer === "svg" ? new SvgRenderer() : new CanvasRenderer();
  r.mount({container: host, width: 400, height: 300});
  const tb = new TextBox()
    .data([
      {
        id: "label",
        // Capitals keep the long word whole, so it takes the second line
        // and the first spreads its three words across the box.
        text: "Wide gaps between ABCDEFGHIJKLMNOPQRSTU",
      },
    ])
    .fontFamily("Arial")
    .fontSize(16)
    .lineHeight(40)
    .textAnchor("justify")
    .hitbox(hitbox)
    .x(50)
    .y(50)
    .width(300)
    .height(150);
  r.drawScene(
    {
      width: 400,
      height: 300,
      root: {type: "group", key: "root", children: [tb.toScene()]},
    },
    {duration: 0},
  );
  window.__clicks = [];
  r.on(e => {
    if (e.type === "click")
      window.__clicks.push(e.pick ? e.pick.datum.id : null);
  });
  const node = tb.toScene().children.find(n => n.type === "text");
  const runs = node.lines[0].runs;
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = "16px Arial";
  const end = runs[0].x + ctx.measureText(runs[0].text.trimEnd()).width;
  const y0 = 50 + node.lines[0].y;
  return {
    // Between the first two justified words, and between the two lines.
    betweenWords: [50 + (end + runs[1].x) / 2, y0 - 5],
    betweenLines: [80, y0 + 18],
    onGlyph: [50 + 4, y0 - 5],
    outside: [380, 280],
  };
};

for (const renderer of ["svg", "canvas"]) {
  it(`hitbox: clicks between lines and words reach the datum (${renderer})`, async () => {
    for (const hitbox of [true, false]) {
      const clicks = await withPage("", async page => {
        const points = await page.evaluate(mountHitbox, {renderer, hitbox});
        const out = {};
        for (const [name, [x, y]] of Object.entries(points)) {
          await page.evaluate(() => (window.__clicks = []));
          await page.mouse.move(x, y);
          await page.mouse.click(x, y);
          out[name] = await page.evaluate(() => window.__clicks[0] ?? null);
        }
        return out;
      });
      assert.strictEqual(clicks.onGlyph, "label", `glyphs pick (${hitbox})`);
      assert.strictEqual(clicks.outside, null, `outside misses (${hitbox})`);
      const expected = hitbox ? "label" : null;
      // Canvas hit-tests text by each line's box, so the gaps inside a line
      // already pick; SVG picks only glyphs.
      assert.strictEqual(
        clicks.betweenWords,
        renderer === "canvas" ? "label" : expected,
        `between words (${hitbox})`,
      );
      assert.strictEqual(
        clicks.betweenLines,
        expected,
        `between lines (${hitbox})`,
      );
    }
  });
}

it("hitbox: the rect covers the padded box and shares the text's transform", async () => {
  const out = await render("", () => {
    const children = new window.d3plus.TextBox()
      .data([{id: "a", text: "Turned"}])
      .padding(10)
      .rotate(30)
      .hitbox({padding: 4})
      .x(100)
      .y(50)
      .width(200)
      .height(80)
      .verticalAlign("middle")
      .toScene().children;
    return children.map(n => ({
      type: n.type,
      key: n.key,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      transform: n.transform,
      datum: n.datum,
    }));
  });
  const [hit, text] = out;
  assert.strictEqual(hit.type, "rect");
  assert.strictEqual(hit.key, "a::hit");
  assert.strictEqual(text.type, "text");
  assert.deepStrictEqual(hit.transform, text.transform);
  assert.deepStrictEqual(hit.datum, text.datum);
  // The rect's corner, moved by the transform, is the box's corner less the
  // hitbox padding: (100 − 4, 50 − 4) before rotation.
  close(hit.transform.x + hit.x, 96, 1e-9, "left");
  close(hit.transform.y + hit.y, 46, 1e-9, "top");
  assert.strictEqual(hit.width, 208);
  assert.strictEqual(hit.height, 88);
});

for (const renderer of ["svg", "canvas"]) {
  it(`hitbox: chart labels get hit rects that keyboard navigation skips (${renderer})`, async () => {
    const out = await render(
      '<div id="viz" style="width:500px;height:300px"></div>',
      renderer =>
        new Promise(resolve => {
          const draw = hitbox =>
            new Promise(done => {
              document.getElementById("viz").innerHTML = "";
              const viz = new window.d3plus.Treemap()
                .data([
                  {id: "alpha", value: 30},
                  {id: "beta", value: 20},
                  {id: "gamma", value: 10},
                ])
                .groupBy("id")
                .sum("value")
                .legend(false)
                .duration(0)
                .renderer(renderer)
                .shapeConfig({labelConfig: {hitbox}})
                .select("#viz");
              viz.render(() => {
                const nodes = [];
                const walk = n => {
                  nodes.push(n);
                  (n.children || []).forEach(walk);
                };
                const root = viz.toScene().root;
                walk(root);
                done({
                  hits: nodes.filter(
                    n => n.type === "rect" && `${n.key}`.endsWith("::hit"),
                  ).length,
                  targets: window.d3plus.focusTargets(root.children).length,
                });
              });
            });
          (async () => resolve([await draw(false), await draw(true)]))();
        }),
      renderer,
    );
    const [off, on] = out;
    assert.strictEqual(off.hits, 0);
    assert.ok(on.hits >= 3, `${on.hits} label hit rects`);
    assert.strictEqual(on.targets, off.targets, "focus targets unchanged");
  });
}
