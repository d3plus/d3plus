import {it} from "vitest";
import {CanvasRenderer} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Every chart's filled data marks honor `shapeConfig.texture` and
    `shapeConfig.backgroundImage`, on SVG and Canvas. Each case renders once
    per feature and backend, then walks the rendered scene graph: every filled
    data mark in the chart body must carry a `pattern:` fill (texture) or a
    `<key>-bgimage` image group (backgroundImage), and so must the legend
    swatches when a legend shows. On SVG the patterns and images must also
    reach the DOM, with each pattern stroked in a color.

    Stroked marks (lines, links, axes) have no fill to texture and are left
    out by the fill check, and a case with `links` checks that its link and
    line paths stay unfilled while its nodes take the texture; the few filled
    marks that intentionally take neither feature are named per case. A case
    with `shapeKey` also takes a texture set under that shape's own
    shapeConfig key.
*/

/** Builds every case inside the page (accessors can't cross into it). */
const pageCases = () => {
  const flat = [
    {id: "alpha", value: 29},
    {id: "beta", value: 18},
    {id: "gamma", value: 12},
  ];
  const series = ["alpha", "beta"].flatMap((id, k) =>
    [2019, 2020, 2021].map((year, j) => ({
      id,
      year,
      value: 10 + k * 5 + ((j * 7 + k * 3) % 11),
    })),
  );
  const nested = [
    {parent: "x", id: "alpha", value: 29},
    {parent: "x", id: "beta", value: 10},
    {parent: "y", id: "gamma", value: 20},
  ];
  const grid = [
    {row: "r1", column: "c1", value: 1},
    {row: "r1", column: "c2", value: 2},
    {row: "r2", column: "c1", value: 3},
    {row: "r2", column: "c2", value: 4},
  ];
  const nodes = [
    {id: "alpha", x: 1, y: 1},
    {id: "beta", x: 3, y: 1},
    {id: "gamma", x: 2, y: 3},
  ];
  const links = [
    {source: "alpha", target: "beta", value: 5},
    {source: "beta", target: "gamma", value: 3},
    {source: "gamma", target: "alpha", value: 4},
  ];
  const samples = Array.from({length: 60}, (_, i) => ({
    id: i,
    group: ["Low", "High"][i % 2],
    value: ((i * 37) % 23) + (i % 2) * 8,
  }));
  const box = ["alpha", "beta"].flatMap(id =>
    [20, 40, 74, 80, 115, 125, 150, 170, 180, 300].map((v, sub) => ({
      id,
      sub,
      value: v,
    })),
  );
  const topojson = {
    type: "Topology",
    objects: {
      c: {
        type: "GeometryCollection",
        geometries: [
          {type: "Polygon", arcs: [[0]], id: "x"},
          {type: "Polygon", arcs: [[1]], id: "y"},
        ],
      },
    },
    arcs: [
      [
        [-10, 40],
        [0, 40],
        [0, 60],
        [-10, 60],
        [-10, 40],
      ],
      [
        [0, 40],
        [10, 40],
        [10, 60],
        [0, 60],
        [0, 40],
      ],
    ],
  };
  return {
    Treemap: {
      config: {data: flat, groupBy: "id", sum: "value"},
      shapeKey: "Rect",
    },
    Pack: {
      config: {data: flat, groupBy: "id", sum: "value"},
      shapeKey: "Circle",
    },
    Pie: {
      config: {data: flat, groupBy: "id", value: "value"},
      shapeKey: "Path",
    },
    Donut: {config: {data: flat, groupBy: "id", value: "value"}},
    Sunburst: {config: {data: nested, groupBy: ["parent", "id"], sum: "value"}},
    Tree: {config: {data: nested, groupBy: ["parent", "id"]}, links: true},
    Network: {config: {nodes, links}, links: true},
    Sankey: {config: {links: links.slice(0, 2), value: "value"}},
    Rings: {config: {links, center: "alpha"}, links: true},
    Chord: {config: {links, value: "value"}},
    Geomap: {
      config: {
        data: [
          {id: "x", value: 3},
          {id: "y", value: 5},
        ],
        tiles: false,
        topojson,
        zoom: false,
      },
    },
    Matrix: {
      config: {data: grid, row: "row", column: "column"},
      shapeKey: "Rect",
    },
    RadialMatrix: {
      config: {data: grid, row: "row", column: "column"},
      shapeKey: "Path",
    },
    Priestley: {
      config: {
        data: [
          {id: "a", start: 2000, end: 2005},
          {id: "b", start: 2002, end: 2008},
        ],
        start: "start",
        end: "end",
      },
      shapeKey: "Rect",
    },
    Radar: {
      config: {data: series, groupBy: "id", metric: "year", value: "value"},
    },
    // A needle and its hub are pointers: they take a texture but no image.
    Gauge: {
      config: {data: [{id: "Speed", value: 72}], domain: [0, 100]},
      noImage: /-(indicator|hub)$/,
    },
    GaugeProgress: {
      cls: "Gauge",
      config: {
        data: [{id: "CPU", value: 64}],
        domain: [0, 100],
        indicator: "progress",
      },
    },
    BarChart: {config: {data: series, groupBy: "id", x: "year", y: "value"}},
    AreaPlot: {config: {data: series, groupBy: "id", x: "year", y: "value"}},
    // A line has no fill: only its paths are checked, and they stay unfilled.
    LinePlot: {
      config: {data: series, groupBy: "id", x: "year", y: "value"},
      links: true,
      stroked: true,
    },
    StackedArea: {config: {data: series, groupBy: "id", x: "year", y: "value"}},
    LinePlotConfidence: {
      cls: "LinePlot",
      config: {
        data: series.map(d => ({...d, lci: d.value - 3, hci: d.value + 3})),
        groupBy: "id",
        x: "year",
        y: "value",
        confidence: ["lci", "hci"],
      },
    },
    Plot: {
      config: {
        data: series,
        groupBy: ["id", "year"],
        x: "year",
        y: "value",
        size: "value",
        color: "id",
      },
    },
    // Only the boxes fill: medians are rules and whisker ends and outliers are markers.
    BoxWhisker: {
      config: {data: box, groupBy: ["id", "sub"], x: "id", y: "value"},
      marks: m => m.type === "rect" && m.width > 30 && m.height > 5,
    },
    Histogram: {config: {data: samples, groupBy: "group", value: "value"}},
    Pyramid: {
      config: {
        data: ["Male", "Female"].flatMap(sex =>
          ["0-9", "10-19", "20-29"].map((age, b) => ({
            sex,
            age,
            population: 900 - b * 200,
          })),
        ),
        groupBy: "sex",
        y: "age",
        x: "population",
      },
    },
    Beeswarm: {
      config: {
        data: samples,
        groupBy: "id",
        color: "group",
        x: "value",
        y: "group",
      },
    },
  };
};

/** Renders one case per feature and backend and reports its marks. */
const probe = async ({name, feature, renderer, pageCasesSrc}) => {
  const spec = new Function(`return (${pageCasesSrc})();`)()[name];
  const image =
    "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
  const el = document.createElement("div");
  el.style.cssText = "width:600px;height:400px;";
  document.body.appendChild(el);
  const viz = new window.d3plus[spec.cls || name]()
    .select(el)
    .config(spec.config)
    .shapeConfig(
      feature === "texture"
        ? {texture: "lines"}
        : feature === "shapeTexture"
          ? {[spec.shapeKey]: {texture: "lines"}}
          : {backgroundImage: image},
    )
    .renderer(renderer)
    .duration(0);
  await new Promise(r => viz.render(r));

  const leaves = [];
  const walk = (node, anc) => {
    if (node.type === "group") {
      for (const c of node.children || []) walk(c, `${anc}>${node.key || ""}`);
      return;
    }
    leaves.push({...node, anc});
  };
  walk(viz._lastSceneRendered.root, "");
  const images = new Set(
    leaves.filter(l => l.type === "image").map(l => l.key),
  );
  const filled = leaves.filter(
    l =>
      ["rect", "circle", "path", "area"].includes(l.type) &&
      l.datum != null &&
      !String(l.key).endsWith("::hit") &&
      l.paint &&
      l.paint.fill &&
      !["none", "transparent"].includes(l.paint.fill) &&
      !/axis|Axis|Line-group/.test(l.anc),
  );
  const mark = l => ({
    key: String(l.key),
    type: l.type,
    width: l.width,
    height: l.height,
    textured: String(l.paint.fill).startsWith("pattern:"),
    image: images.has(`${l.key}-bgimage-img`),
  });
  const svg = el.querySelector("svg.d3plus-render-svg");
  const out = {
    chart: filled.filter(l => l.anc.includes("viz-chart-cells")).map(mark),
    legend: filled.filter(l => l.anc.includes("viz-legend")).map(mark),
    domPatternFills:
      renderer === "svg"
        ? svg.querySelectorAll("[fill^='url(#']").length
        : null,
    domImages: renderer === "svg" ? svg.querySelectorAll("image").length : null,
  };
  if (renderer === "svg") {
    const patterns = [...svg.querySelectorAll("pattern")];
    out.domPatterns = patterns.length;
    out.patternStrokes = patterns.flatMap(p =>
      [...p.querySelectorAll("[stroke]")].map(e => e.getAttribute("stroke")),
    );
    out.patternPaths = svg.querySelectorAll("path[fill^='url(']").length;
    out.patternNodes = svg.querySelectorAll(
      "circle[fill^='url('], rect[fill^='url(']",
    ).length;
  }
  el.remove();
  return out;
};

const pageCasesSrc = pageCases.toString();
const cases = Object.entries(pageCases());

for (const [name, spec] of cases) {
  for (const feature of ["texture", "backgroundImage"]) {
    if (spec.stroked && feature === "backgroundImage") continue;
    it(
      `${name}: shapeConfig.${feature} reaches every filled mark on SVG and Canvas`,
      {timeout: 120000},
      async function () {
        for (const renderer of ["svg", "canvas"]) {
          const label = `${name} (${renderer})`;
          const r = await render("", probe, {
            name,
            feature,
            renderer,
            pageCasesSrc,
          });
          if (feature === "texture" && renderer === "svg") {
            if (spec.links)
              assert.strictEqual(
                r.patternPaths,
                0,
                `${label}: link/line paths stay unfilled`,
              );
            if (spec.links && !spec.stroked)
              assert.ok(r.patternNodes > 0, `${label}: nodes are textured`);
            for (const s of r.patternStrokes)
              assert.ok(
                !s.includes("object"),
                `${label}: pattern stroke "${s}" is a color`,
              );
          }
          if (spec.stroked) continue;
          const pick = spec.marks ? m => spec.marks(m) : () => true;
          const exempt =
            feature === "backgroundImage" && spec.noImage
              ? m => spec.noImage.test(m.key)
              : () => false;
          assert.ok(
            r.chart.filter(pick).length > 0,
            `${label}: has filled marks`,
          );
          const marks = r.chart.filter(m => pick(m) && !exempt(m));
          const has = m => (feature === "texture" ? m.textured : m.image);
          const missing = marks
            .filter(m => !has(m))
            .map(m => `${m.type}:${m.key}`);
          assert.deepStrictEqual(
            missing,
            [],
            `${label}: every filled mark takes the ${feature}`,
          );
          const legendMissing = r.legend.filter(m => !has(m)).map(m => m.key);
          assert.deepStrictEqual(
            legendMissing,
            [],
            `${label}: every legend swatch takes the ${feature}`,
          );
          if (renderer === "svg") {
            const drawn =
              feature === "texture" ? r.domPatternFills : r.domImages;
            assert.ok(
              drawn >= marks.length + r.legend.length,
              `${label}: the DOM draws them (${drawn})`,
            );
            if (feature === "texture")
              assert.ok(
                r.domPatterns > 0,
                `${label}: defines texture patterns`,
              );
          }
        }
      },
    );
  }
  if (spec.shapeKey) {
    it(
      `${name}: shapeConfig.${spec.shapeKey}.texture fills its shapes with a pattern`,
      {timeout: 120000},
      async function () {
        const r = await render("", probe, {
          name,
          feature: "shapeTexture",
          renderer: "svg",
          pageCasesSrc,
        });
        assert.ok(
          r.domPatternFills > 0,
          `${name}: per-shape texture fills shapes with a pattern`,
        );
      },
    );
  }
}

it(
  "BoxWhisker: a per-box texture accessor and shapeConfig.Box.backgroundImage reach the boxes",
  {timeout: 120000},
  async function () {
    const out = await render("", async () => {
      const data = ["alpha", "beta"].flatMap(id =>
        [20, 40, 74, 80, 115, 125, 150, 300].map((value, sub) => ({
          id,
          sub,
          value,
        })),
      );
      const el = document.createElement("div");
      el.style.cssText = "width:600px;height:400px;";
      document.body.appendChild(el);
      const viz = new window.d3plus.BoxWhisker()
        .select(el)
        .config({
          data,
          groupBy: ["id", "sub"],
          x: "id",
          y: "value",
          duration: 0,
        })
        .shapeConfig({
          texture: d => (d.id === "alpha" ? "lines" : false),
          Box: {
            backgroundImage: d =>
              d.id === "beta" ? "data:image/svg+xml,%3Csvg%2F%3E" : false,
          },
        });
      await new Promise(r => viz.render(r));
      const leaves = [];
      const walk = n =>
        n.type === "group" ? (n.children || []).forEach(walk) : leaves.push(n);
      walk(viz._lastSceneRendered.root);
      const boxes = leaves.filter(
        n =>
          n.type === "rect" &&
          n.width > 30 &&
          n.height > 5 &&
          n.datum &&
          n.datum.data &&
          !String(n.key).endsWith("::hit"),
      );
      const images = leaves.filter(n => n.type === "image").map(n => n.key);
      return boxes.map(b => ({
        // The merged box datum lists its rows' ids.
        id: String(b.datum.data.id).split("_")[0],
        textured: String(b.paint.fill).startsWith("pattern:"),
        image: images.includes(`${b.key}-bgimage-img`),
      }));
    });
    assert.deepStrictEqual(out, [
      {id: "alpha", textured: true, image: false},
      {id: "beta", textured: false, image: true},
    ]);
  },
);

/**
    A per-row `shapeConfig.texture` accessor reaches an AreaPlot's areas and a
    LinePlot's confidence bands, on SVG and Canvas. Each Area resolves the
    accessor against its merged row, so `d.id` is the series id and only the
    matching series is textured, in the chart and in the legend.
*/

/** Renders one chart and reports which areas and legend swatches are textured. */
const rowProbe = async ({cls, confidence, renderer}) => {
  const series = ["alpha", "beta"].flatMap((id, k) =>
    [2019, 2020, 2021].map((year, j) => ({
      id,
      year,
      value: 10 + k * 5 + j * 3,
      lci: 5 + k * 5 + j * 3,
      hci: 15 + k * 5 + j * 3,
    })),
  );
  const el = document.createElement("div");
  el.style.cssText = "width:600px;height:400px;";
  document.body.appendChild(el);
  const seen = [];
  const viz = new window.d3plus[cls]()
    .select(el)
    .config({data: series, groupBy: "id", x: "year", y: "value", duration: 0})
    .shapeConfig({
      texture: d => (seen.push(d.id), d.id === "alpha" ? "lines" : false),
    })
    .renderer(renderer);
  if (confidence) viz.confidence(["lci", "hci"]);
  await new Promise(r => viz.render(r));

  const leaves = [];
  const walk = (node, anc) => {
    if (node.type === "group")
      (node.children || []).forEach(c => walk(c, `${anc}>${node.key || ""}`));
    else leaves.push({node, anc});
  };
  walk(viz._lastSceneRendered.root, "");
  const textured = n => String(n.paint && n.paint.fill).startsWith("pattern:");
  const areas = leaves
    .filter(
      ({node, anc}) =>
        node.shapeType === "Area" &&
        anc.includes("viz-chart-cells") &&
        !String(node.key).endsWith("::hit"),
    )
    .map(({node}) => ({key: String(node.key), textured: textured(node)}));
  const legend = leaves
    .filter(
      ({node, anc}) =>
        anc.includes("viz-legend") &&
        node.datum != null &&
        ["rect", "circle", "path"].includes(node.type) &&
        !String(node.key).endsWith("::hit"),
    )
    // A swatch's key leads with its series id (then its opacity and texture).
    .map(({node}) => ({
      id: String(node.key).split("_")[0],
      textured: textured(node),
    }));
  const svg = el.querySelector("svg.d3plus-render-svg");
  const out = {
    areas,
    legend,
    seenIds: [...new Set(seen.map(String))].sort(),
    domPatternFills:
      renderer === "svg"
        ? svg.querySelectorAll("[fill^='url(#']").length
        : null,
  };
  el.remove();
  return out;
};

const rowCases = [
  {name: "AreaPlot areas", cls: "AreaPlot"},
  {name: "LinePlot confidence bands", cls: "LinePlot", confidence: true},
];

for (const {name, cls, confidence} of rowCases) {
  it(
    `${name}: a per-row texture accessor gets the merged row, on SVG and Canvas`,
    {timeout: 120000},
    async function () {
      for (const renderer of ["svg", "canvas"]) {
        const label = `${name} (${renderer})`;
        const r = await render("", rowProbe, {cls, confidence, renderer});
        assert.deepStrictEqual(
          r.areas.map(a => [a.key, a.textured]).sort(),
          [
            ["alpha", true],
            ["beta", false],
          ],
          `${label}: only the alpha area is textured`,
        );
        assert.deepStrictEqual(
          r.seenIds,
          ["alpha", "beta"],
          `${label}: the accessor only sees series rows`,
        );
        // A LinePlot's legend draws a line and a point per series; each takes its series' texture.
        assert.deepStrictEqual(
          [...new Set(r.legend.map(s => `${s.id}:${s.textured}`))].sort(),
          ["alpha:true", "beta:false"],
          `${label}: only the alpha legend swatches are textured`,
        );
        if (renderer === "svg") {
          const textured = r.areas
            .concat(r.legend)
            .filter(m => m.textured).length;
          assert.strictEqual(
            r.domPatternFills,
            textured,
            `${label}: the DOM fills each textured area and swatch with a pattern`,
          );
        }
      }
    },
  );
}

// backgroundImage already resolves through the merged row; keep it that way.
it(
  "AreaPlot: a per-row backgroundImage accessor gets the merged row, on SVG and Canvas",
  {timeout: 120000},
  async function () {
    for (const renderer of ["svg", "canvas"]) {
      const images = await render(
        "",
        async renderer => {
          const data = ["alpha", "beta"].flatMap(id =>
            [2019, 2020].map((year, j) => ({id, year, value: 10 + j})),
          );
          const el = document.createElement("div");
          el.style.cssText = "width:600px;height:400px;";
          document.body.appendChild(el);
          const viz = new window.d3plus.AreaPlot()
            .select(el)
            .config({data, groupBy: "id", x: "year", y: "value", duration: 0})
            .shapeConfig({
              Area: {
                backgroundImage: d =>
                  d.id === "alpha" ? "data:image/svg+xml,%3Csvg%2F%3E" : false,
              },
            })
            .renderer(renderer);
          await new Promise(r => viz.render(r));
          const keys = [];
          const walk = n =>
            n.type === "group"
              ? (n.children || []).forEach(walk)
              : n.type === "image" && keys.push(String(n.key));
          walk(viz._lastSceneRendered.root);
          el.remove();
          return keys;
        },
        renderer,
      );
      assert.deepStrictEqual(
        images,
        ["alpha-bgimage-img"],
        `${renderer}: only the alpha area draws its image`,
      );
    }
  },
);

it("CanvasRenderer paints a real texture pattern, not the solid fallback", async () => {
  const res = await render('<div id="B"></div>', async () => {
    const B = document.getElementById("B");
    const r = new CanvasRenderer();
    r.mount({container: B, width: 100, height: 100, pixelRatio: 1});
    // A high-contrast lines texture: red background (== the solid fallback the
    // first frame paints) with thick blue diagonal lines. Blue pixels can only
    // appear once the SVG tile rasterizes into a real CanvasPattern.
    const token =
      "pattern:" +
      JSON.stringify({
        texture: "lines",
        background: "#ff0000",
        stroke: "#0000ff",
        strokeWidth: 4,
        size: 10,
      });
    r.drawScene({
      width: 100,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [
          {
            type: "rect",
            key: "a",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            paint: {fill: token},
          },
        ],
      },
    });
    const canvas = B.querySelector("canvas.d3plus-render-canvas");
    const ctx = canvas.getContext("2d");
    const sample = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0,
        blue = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 150 && data[i + 2] < 100) red++;
        if (data[i + 2] > 150 && data[i] < 100) blue++;
      }
      return {red, blue};
    };
    // Poll until the async tile rasterizes and the renderer repaints (≤ ~1s).
    for (let k = 0; k < 40; k++) {
      const s = sample();
      if (s.blue > 0 && s.red > 0) return s;
      await new Promise(done => window.setTimeout(done, 25));
    }
    return sample();
  });
  assert.ok(res.red > 0, "tile background (red) painted");
  assert.ok(
    res.blue > 0,
    "tile stroke lines (blue) painted — a real CanvasPattern tiled, not the solid fallback",
  );
});
