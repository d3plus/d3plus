import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Funnel renders in Chromium on both backends: the emitted scene (necks
    behind one path per stage, then labels), label placement inside and
    beside stages, conversion lines, tooltips, translations, hover dimming,
    the legend, horizontal and tapered layouts, small multiples, and Canvas
    painting + picking.
*/

const stages = [
  {id: "Visited", value: 12400},
  {id: "Pricing", value: 6900},
  {id: "Trial", value: 3100},
  {id: "Activated", value: 1850},
  {id: "Subscribed", value: 760},
];

it(
  "Funnel emits necks, stage paths, and labels",
  {timeout: 180000},
  async function () {
    // The first browser test also builds the UMD bundle.
    const out = await render(
      "<div id='viz' style='width:600px;height:400px'></div>",
      async data => {
        const viz = new window.d3plus.Funnel()
          .select("#viz")
          .duration(0)
          .data(data);
        await new Promise(r => viz.render(r));
        const scene = viz._chartScene;
        const svg = document.querySelector("#viz svg");
        const paths = scene.filter(n => n.type === "path");
        return {
          keys: paths.map(n => n.key),
          neckInteractive: paths
            .filter(n => n.key.endsWith("-neck"))
            .map(n => n.interactive),
          neckDatum: paths.find(n => n.key === "funnel-Pricing-neck").datum.id,
          neckOpacity: paths.find(n => n.key === "funnel-Pricing-neck").paint
            .opacity,
          neckFill: paths.find(n => n.key === "funnel-Pricing-neck").paint.fill,
          stageFill: paths.find(n => n.key === "funnel-Pricing").paint.fill,
          firstPath: paths.find(n => n.key === "funnel-Visited").d,
          texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
          aria: [...svg.querySelectorAll("[aria-label]")].map(n =>
            n.getAttribute("aria-label"),
          ),
          nan: [...svg.querySelectorAll("*")].filter(n =>
            [...n.attributes].some(a => a.value.includes("NaN")),
          ).length,
          legend: viz.schema.legend({}, viz._filteredData),
          zoom: viz.zoom(),
          transform: viz._chartTransform,
          margin: viz._margin,
        };
      },
      stages,
    );
    assert.deepStrictEqual(out.keys, [
      "funnel-Pricing-neck",
      "funnel-Trial-neck",
      "funnel-Activated-neck",
      "funnel-Subscribed-neck",
      "funnel-Visited",
      "funnel-Pricing",
      "funnel-Trial",
      "funnel-Activated",
      "funnel-Subscribed",
    ]);
    assert.ok(
      out.neckInteractive.every(v => v === false),
      "necks aren't hit targets",
    );
    assert.strictEqual(
      out.neckDatum,
      "Pricing",
      "a neck belongs to the stage it leads into",
    );
    assert.strictEqual(out.neckOpacity, 0.35);
    assert.strictEqual(
      out.neckFill,
      out.stageFill,
      "necks take their stage's fill",
    );
    assert.ok(
      /^M2,2L2,/.test(out.firstPath),
      `first stage spans the width (${out.firstPath})`,
    );
    for (const t of ["Visited", "12.4k", "Subscribed", "760"])
      assert.ok(out.texts.includes(t), `renders "${t}"`);
    assert.ok(!out.texts.some(t => /of first/.test(t)), "no rates by default");
    assert.ok(out.aria.includes("1. Visited, 12.4k."), "stage aria label");
    assert.strictEqual(out.nan, 0, "no NaN attributes");
    assert.strictEqual(out.legend, false, "stages are labeled, so no legend");
    assert.strictEqual(out.zoom, false, "zoom is off by default");
  },
);

it("Funnel places labels inside wide stages and beside narrow ones", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:600px'></div>",
    async data => {
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .data(data)
        .conversion("both");
      await new Promise(r => viz.render(r));
      const labels = viz._chartScene.filter(n => n.type === "text");
      const text = n => n.lines.map(l => l.text).join(" ");
      const byText = t => labels.find(n => text(n) === t);
      const x = n => n.transform.x + n.lines[0].x;
      return {
        texts: labels.map(text),
        visitedX: x(byText("Visited")),
        subscribedX: x(byText("Subscribed")),
        center: viz.ctx.funnel.center,
        nameWeight: byText("Visited").font.weight,
        valueWeight: byText("12.4k").font.weight,
        visitedColor: byText("Visited").paint.fill,
        subscribedColor: byText("Subscribed").paint.fill,
      };
    },
    stages,
  );
  assert.ok(out.texts.includes("Pricing"));
  assert.ok(
    out.texts.some(t => /% of first$/.test(t)),
    "first-stage rate line",
  );
  assert.ok(
    out.texts.some(t => /% of previous$/.test(t)),
    "previous-stage rate line",
  );
  assert.ok(
    !out.texts.includes("100% of first"),
    "the first stage shows no rates",
  );
  assert.ok(
    Math.abs(out.visitedX - out.center) < 1,
    "a wide stage's label is centered inside it",
  );
  assert.strictEqual(out.nameWeight, 600, "the name is bold");
  assert.strictEqual(out.valueWeight, 400);
  assert.ok(
    out.subscribedX > out.center,
    "a narrow stage's label goes to its right",
  );
  assert.notStrictEqual(
    out.visitedColor,
    out.subscribedColor,
    "inside labels contrast with the fill",
  );
});

it("Funnel tooltips show the value and conversion rates, translated", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .data(data)
        .locale("es-ES")
        .conversion("first");
      await new Promise(r => viz.render(r));
      const tbody = viz.schema.tooltipConfig.tbody;
      const rows = viz._filteredData;
      const cells = (d, i) => tbody(d, i).map(r => r.join(": "));
      return {
        first: cells(rows[0], 0),
        third: cells(rows[2], 2),
        texts: [...document.querySelectorAll("#viz text")].map(
          t => t.textContent,
        ),
      };
    },
    stages,
  );
  assert.strictEqual(out.first.length, 1, "the first stage has only its value");
  assert.strictEqual(out.third.length, 3);
  assert.ok(out.third[1].startsWith("% de la Primera Etapa: 25"), out.third[1]);
  assert.ok(
    out.third[2].startsWith("% de la Etapa Anterior: 44"),
    out.third[2],
  );
  assert.ok(
    out.texts.some(t => /de la primera$/.test(t)),
    "label suffix is translated",
  );
});

it("Funnel dims other stages and their necks on hover", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .data(data);
      await new Promise(r => viz.render(r));
      viz.hover(d => d.id === "Trial");
      await new Promise(r => setTimeout(r, 50));
      const opacity = key => {
        const el = document.querySelector(`#viz [data-key='${key}']`);
        return el ? Number(el.getAttribute("opacity") ?? 1) : null;
      };
      return {
        trial: opacity("funnel-Trial"),
        trialNeck: opacity("funnel-Trial-neck"),
        pricing: opacity("funnel-Pricing"),
        pricingNeck: opacity("funnel-Pricing-neck"),
      };
    },
    stages,
  );
  assert.strictEqual(out.trial, 1, "hovered stage stays opaque");
  assert.strictEqual(out.trialNeck, 0.35, "its neck keeps its own opacity");
  assert.strictEqual(out.pricing, 0.5, "other stages dim");
  assert.strictEqual(out.pricingNeck, 0.175, "other necks dim");
});

it("Funnel draws horizontally, tapered, smooth, and without necks or labels", async function () {
  const out = await render(
    "<div id='a' style='width:600px;height:300px'></div><div id='b' style='width:400px;height:400px'></div><div id='c' style='width:400px;height:400px'></div>",
    async data => {
      const draw = (sel, cfg) => {
        const viz = new window.d3plus.Funnel()
          .select(sel)
          .duration(0)
          .data(data)
          .config(cfg);
        return new Promise(r => viz.render(r)).then(() => viz);
      };
      const h = await draw("#a", {orient: "horizontal"});
      const t = await draw("#b", {
        taper: true,
        curve: "smooth",
        connector: false,
      });
      const n = await draw("#c", {
        shapeConfig: {label: false},
        stagePadding: 0,
      });
      const paths = viz => viz._chartScene.filter(x => x.type === "path");
      return {
        hFirst: paths(h).find(x => x.key === "funnel-Visited").d,
        hShared: h.ctx.funnel,
        tNecks: paths(t).filter(x => x.key.endsWith("-neck")).length,
        tPoints: paths(t)
          .find(x => x.key === "funnel-Visited")
          .d.split("L").length,
        nTexts: n._chartScene.filter(x => x.type === "text").length,
        nNecks: paths(n).filter(x => x.key.endsWith("-neck")).length,
      };
    },
    stages,
  );
  assert.ok(
    /^M2,2L/.test(out.hFirst),
    "horizontal stages start at the left edge",
  );
  assert.strictEqual(out.hShared.orient, "horizontal");
  assert.strictEqual(out.tNecks, 0, "connector(false) drops the necks");
  assert.ok(out.tPoints > 8, "a smooth taper is sampled along its sides");
  assert.strictEqual(out.nTexts, 0, "shapeConfig.label false hides labels");
  assert.strictEqual(out.nNecks, 0, "touching stages leave no gap to fill");
});

it("Funnel colors stages by the first groupBy level and shows that legend", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async () => {
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .data([
          {phase: "Top", stage: "A", value: 100},
          {phase: "Top", stage: "B", value: 60},
          {phase: "Bottom", stage: "C", value: 30},
        ])
        .groupBy(["phase", "stage"]);
      await new Promise(r => viz.render(r));
      const fill = key => viz._chartScene.find(n => n.key === key).paint.fill;
      return {
        a: fill("funnel-Top-A"),
        b: fill("funnel-Top-B"),
        c: fill("funnel-Bottom-C"),
        legendItems: document.querySelectorAll("#viz .d3plus-Legend text")
          .length,
        legend: viz.schema.legend({}, [{}, {}]),
      };
    },
  );
  assert.strictEqual(out.a, out.b, "same phase, same color");
  assert.notStrictEqual(out.a, out.c, "different phases differ");
  assert.notStrictEqual(
    out.legend,
    false,
    "a legend when entries group stages",
  );
});

it("Funnel draws small multiples with one funnel per panel and no legend", async function () {
  const out = await render(
    "<div id='viz' style='width:800px;height:400px'></div>",
    async data => {
      const rows = ["A", "B"].flatMap((channel, c) =>
        data.map(d => ({...d, channel, value: d.value / (c + 1)})),
      );
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .data(rows)
        .facet("channel");
      await new Promise(r => viz.render(r));
      const flat = [];
      for (const n of sceneNodes(viz._chartScene)) {
        flat.push(n);
      }
      return {
        stagePaths: flat.filter(
          n => n.type === "path" && /funnel-Visited$/.test(n.key || ""),
        ).length,
        legend: viz.schema.legend({}, data),
        texts: [...document.querySelectorAll("#viz text")].map(
          t => t.textContent,
        ),
      };
    },
    stages,
  );
  assert.strictEqual(out.stagePaths, 2, "one first stage per panel");
  assert.strictEqual(out.legend, false, "stages are labeled in every panel");
  assert.ok(out.texts.includes("12.4k") && out.texts.includes("6.2k"));
});

it("Funnel shares one width scale across panels only when facetConfig asks", async function () {
  const out = await render(
    "<div id='viz' style='width:800px;height:400px'></div>",
    async data => {
      const rows = ["A", "B"].flatMap((channel, c) =>
        data.map(d => ({...d, channel, value: d.value / (c * 3 + 1)})),
      );
      // The width of each panel's first stage, read from its path's x extent.
      const firstWidths = viz => {
        const flat = [];
        for (const n of sceneNodes(viz._chartScene)) {
          flat.push(n);
        }
        return flat
          .filter(n => n.type === "path" && /funnel-Visited$/.test(n.key || ""))
          .map(n => {
            const xs = n.d
              .slice(1, -1)
              .split("L")
              .map(p => +p.split(",")[0]);
            return Math.max(...xs) - Math.min(...xs);
          });
      };
      const draw = async (renderer, facetConfig) => {
        document.querySelector("#viz").innerHTML = "";
        const viz = new window.d3plus.Funnel()
          .select("#viz")
          .duration(0)
          .renderer(renderer)
          .data(rows)
          .facet("channel");
        if (facetConfig) viz.facetConfig(facetConfig);
        await new Promise(r => viz.render(r));
        return firstWidths(viz);
      };
      return {
        independent: await draw("svg"),
        shared: await draw("svg", {scales: "shared"}),
        canvas: await draw("canvas", {scales: "shared"}),
      };
    },
    stages,
  );
  const [a, b] = out.independent;
  assert.ok(
    Math.abs(a - b) < 1,
    `each panel fills its own width by default (${a}, ${b})`,
  );
  const [sa, sb] = out.shared;
  assert.ok(Math.abs(sa - a) < 1, "the largest panel keeps its width");
  assert.ok(
    Math.abs(sb - sa / 4) < 1,
    `a panel with a quarter the volume draws a quarter as wide (${sb})`,
  );
  assert.deepStrictEqual(
    out.canvas.map(Math.round),
    out.shared.map(Math.round),
    "Canvas lays out the same",
  );
});

it("Funnel sorts stages with a comparator, and its labels follow the order", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:500px'></div>",
    async data => {
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .conversion("previous")
        .sort((a, b) => b.value - a.value)
        .data(data.slice().reverse());
      await new Promise(r => viz.render(r));
      return {
        order: viz._chartScene
          .filter(n => n.type === "path" && !/-neck$/.test(n.key))
          .map(n => n.key.replace("funnel-", "")),
        texts: [...document.querySelectorAll("#viz text")].map(
          t => t.textContent,
        ),
      };
    },
    stages,
  );
  assert.deepStrictEqual(
    out.order,
    stages.map(d => d.id),
  );
  // Pricing is 6.9k of Visited's 12.4k: 55.6% of the stage drawn before it.
  assert.ok(
    out.texts.some(t => /^55\.6\d*% of previous$/.test(t)),
    out.texts.join(" | "),
  );
});

it("Funnel paints on Canvas and picks the stage under the pointer", async function () {
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.Funnel()
        .select("#viz")
        .duration(0)
        .renderer("canvas")
        .data(data)
        .on("click", d => (window.__clicked = d && d.data ? d.data : d));
      await new Promise(r => viz.render(r));
      const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
      if (!canvas) return {hasCanvas: false};
      const ctx = canvas.getContext("2d");
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < px.length; i += 4)
        if (
          px[i + 3] > 250 &&
          !(px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245)
        )
          colors.add(`${px[i] >> 4}_${px[i + 1] >> 4}_${px[i + 2] >> 4}`);
      const stage = viz._chartScene.find(n => n.key === "funnel-Trial");
      const [, y0] = stage.d.slice(1).split("L")[0].split(",").map(Number);
      const rect = canvas.getBoundingClientRect();
      window.__clicked = undefined;
      canvas.dispatchEvent(
        new MouseEvent("click", {
          clientX: rect.left + viz._chartTransform.x + viz.ctx.funnel.center,
          clientY: rect.top + viz._chartTransform.y + y0 + 3,
          bubbles: true,
        }),
      );
      return {
        hasCanvas: true,
        colors: colors.size,
        clicked: window.__clicked && window.__clicked.id,
      };
    },
    stages,
  );
  assert.ok(out.hasCanvas, "a <canvas> is mounted");
  assert.ok(out.colors >= 5, `canvas paints the stages (${out.colors} colors)`);
  assert.strictEqual(out.clicked, "Trial", "clicking a stage picks its row");
});

it("Funnel's emit and label functions rebuild the scene from a layout", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const viz = new d3plus.Funnel().select("#viz").duration(0).data(data);
      await new Promise(r => viz.render(r));
      const {shapeData} = d3plus.applyFunnelLayout({viz});
      const nodes = d3plus.funnelEmit({viz, shapeData});
      const labels = d3plus.funnelLabelNodes(viz, shapeData, viz.ctx.funnel);
      const noShared = d3plus.funnelEmit({viz: {...viz, ctx: {}}, shapeData});
      return {
        emitted: nodes.map(n => n.key),
        scene: viz._chartScene.map(n => n.key),
        labels: labels.length,
        sceneLabels: viz._chartScene.filter(n => n.type === "text").length,
        empty: d3plus.funnelEmit({viz, shapeData: []}).length,
        noShared: noShared.length,
      };
    },
    stages,
  );
  assert.deepStrictEqual(
    out.emitted,
    out.scene,
    "emit reproduces the drawn scene",
  );
  assert.strictEqual(out.labels, out.sceneLabels);
  assert.strictEqual(out.labels, 10, "a name and a value per stage");
  assert.strictEqual(out.empty, 0);
  assert.strictEqual(out.noShared, 0, "nothing to draw without a layout");
});

it("Funnel's stages, necks, and legend swatches take texture and backgroundImage on SVG and Canvas", async function () {
  const phases = [
    {phase: "Awareness", stage: "Impressions", value: 52000},
    {phase: "Awareness", stage: "Clicks", value: 21000},
    {phase: "Consideration", stage: "Views", value: 11800},
    {phase: "Conversion", stage: "Purchased", value: 1900},
  ];
  for (const renderer of ["svg", "canvas"]) {
    const out = await render(
      "",
      async ({data, renderer: r}) => {
        const image =
          "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
        const draw = async connectorConfig => {
          const el = document.createElement("div");
          el.style.cssText = "width:600px;height:400px";
          document.body.appendChild(el);
          const viz = new window.d3plus.Funnel()
            .select(el)
            .duration(0)
            .renderer(r)
            .config({
              data,
              groupBy: ["phase", "stage"],
              ...(connectorConfig ? {connectorConfig} : {}),
            })
            .shapeConfig({texture: "lines", backgroundImage: image});
          await new Promise(res => viz.render(res));
          const leaves = [];
          const walk = (n, anc) =>
            n.type === "group"
              ? (n.children || []).forEach(c =>
                  walk(c, `${anc}>${n.key || ""}`),
                )
              : leaves.push({...n, anc});
          walk(viz._lastSceneRendered.root, "");
          const groups = [];
          const walkGroups = n => {
            if (n.type !== "group") return;
            groups.push(n);
            (n.children || []).forEach(walkGroups);
          };
          walkGroups(viz._lastSceneRendered.root);
          const images = new Set(
            leaves.filter(n => n.type === "image").map(n => n.key),
          );
          const mark = n => ({
            key: n.key,
            textured: String(n.paint.fill).startsWith("pattern:"),
            image: images.has(`${n.key}-bgimage-img`),
            opacity: n.paint.opacity,
            imageOpacity: (
              groups.find(g => g.key === `${n.key}-bgimage`) || {paint: {}}
            ).paint.opacity,
          });
          const paths = leaves.filter(
            n => n.type === "path" && /^funnel-/.test(n.key),
          );
          const swatches = leaves.filter(
            n =>
              ["rect", "circle", "path"].includes(n.type) &&
              n.datum &&
              n.anc.includes("viz-legend") &&
              !String(n.key).endsWith("::hit") &&
              n.paint &&
              n.paint.fill &&
              n.paint.fill !== "none",
          );
          const svg = el.querySelector("svg");
          const dom = svg ? svg.querySelectorAll("image").length : null;
          el.remove();
          return {
            stages: paths.filter(n => !n.key.endsWith("-neck")).map(mark),
            necks: paths.filter(n => n.key.endsWith("-neck")).map(mark),
            swatches: swatches.map(mark),
            dom,
          };
        };
        return {
          inherit: await draw(undefined),
          off: await draw({texture: false, backgroundImage: false}),
        };
      },
      {data: phases, renderer},
    );
    const {inherit, off} = out;
    assert.strictEqual(
      inherit.stages.length,
      4,
      `${renderer}: a path per stage`,
    );
    assert.strictEqual(
      inherit.necks.length,
      3,
      `${renderer}: a neck between each pair`,
    );
    for (const m of [...inherit.stages, ...inherit.necks])
      assert.ok(m.textured && m.image, `${renderer}: ${m.key} takes both`);
    for (const m of inherit.necks)
      assert.strictEqual(
        m.imageOpacity,
        m.opacity,
        `${renderer}: ${m.key}'s image takes its opacity`,
      );
    assert.strictEqual(inherit.necks[0].opacity, 0.35);
    assert.strictEqual(
      inherit.swatches.length,
      3,
      `${renderer}: a swatch per phase`,
    );
    for (const m of inherit.swatches)
      assert.ok(
        m.textured && m.image,
        `${renderer}: swatch ${m.key} takes both`,
      );
    if (renderer === "svg")
      assert.ok(
        inherit.dom >= 4 + 3 + 3,
        `the DOM draws ${inherit.dom} images`,
      );
    assert.ok(
      off.stages.every(m => m.textured && m.image),
      `${renderer}: stages keep both`,
    );
    assert.ok(
      off.necks.every(m => !m.textured && !m.image),
      `${renderer}: connectorConfig turns both off`,
    );
  }
});
