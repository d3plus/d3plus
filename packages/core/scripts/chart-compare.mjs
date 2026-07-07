/**
    Renders each chart example three ways — the published v3 bundle
    (@d3plus/core@3.1.6 from jsDelivr), the freshly-built local v4 UMD bundle
    with its default SVG backend, and the same v4 bundle with the Canvas backend
    (`.renderer("canvas")`) — then composites each trio side-by-side and assembles
    overview contact sheets.

    Outputs to /tmp/d3plus-compare/:
      v3/<name>.png, v4/<name>.png, v4-canvas/<name>.png   raw 900x600 renders
      pairs/<name>.png               side-by-side composite (v3 | v4 svg | v4 canvas)
      overview-N.png                 scaled contact sheets

    Run from packages/core:  node scripts/chart-compare.mjs
*/

import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const coreDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const umdPath = path.join(coreDir, "umd", "d3plus-core.full.js");
const v3Url = "https://cdn.jsdelivr.net/npm/@d3plus/core@3.1.6/umd/d3plus-core.full.min.js";
const outDir = "/tmp/d3plus-compare";

const W = 900, H = 600;

for (const d of ["v3", "v4", "v4-canvas", "pairs"]) {
  fs.mkdirSync(path.join(outDir, d), {recursive: true});
}

/** Rewrites a builder body to opt the v4 chart into the Canvas backend. */
function canvasBody(body) {
  return body.replace(/\.render\(done\)/, '.renderer("canvas").render(done)');
}

function buildUmd() {
  return new Promise((resolve, reject) => {
    const buildScript = path.resolve(coreDir, "../../scripts/build-umd.js");
    const child = spawn("node", [buildScript], {cwd: coreDir, stdio: "inherit"});
    child.on("error", reject);
    child.on("close", code =>
      code === 0 ? resolve() : reject(new Error(`build exited ${code}`)),
    );
  });
}

const cryptoPolyfill =
  "if(typeof crypto!==\"undefined\"&&!crypto.randomUUID){" +
  "let n=0;crypto.randomUUID=()=>" +
  "\"00000000-0000-4000-8000-\"+String(n++).padStart(12,\"0\");}";

/** [filename, label, builder-body]. Body has `d3plus` + `done` in scope. */
const examples = [
  ["bar-chart", "BarChart", `
    new d3plus.BarChart()
      .select("#viz")
      .groupBy("group")
      .data([
        {group: "Alpha", x: "Q1", y: 35},
        {group: "Alpha", x: "Q2", y: 50},
        {group: "Alpha", x: "Q3", y: 25},
        {group: "Alpha", x: "Q4", y: 40},
        {group: "Beta",  x: "Q1", y: 20},
        {group: "Beta",  x: "Q2", y: 30},
        {group: "Beta",  x: "Q3", y: 45},
        {group: "Beta",  x: "Q4", y: 35},
      ])
      .x("x").y("y")
      .render(done);
  `],
  ["area-plot", "AreaPlot", `
    new d3plus.AreaPlot()
      .select("#viz")
      .groupBy("group")
      .data([
        {group: "A", x: 1, y: 10}, {group: "A", x: 2, y: 20}, {group: "A", x: 3, y: 15},
        {group: "A", x: 4, y: 25}, {group: "A", x: 5, y: 30}, {group: "A", x: 6, y: 22},
        {group: "B", x: 1, y: 5},  {group: "B", x: 2, y: 12}, {group: "B", x: 3, y: 18},
        {group: "B", x: 4, y: 14}, {group: "B", x: 5, y: 20}, {group: "B", x: 6, y: 28},
      ])
      .x("x").y("y")
      .render(done);
  `],
  ["line-plot", "LinePlot", `
    new d3plus.LinePlot()
      .select("#viz")
      .groupBy("group")
      .data([
        {group: "Series 1", x: 1, y: 10}, {group: "Series 1", x: 2, y: 22},
        {group: "Series 1", x: 3, y: 15}, {group: "Series 1", x: 4, y: 28},
        {group: "Series 1", x: 5, y: 35}, {group: "Series 1", x: 6, y: 30},
        {group: "Series 2", x: 1, y: 25}, {group: "Series 2", x: 2, y: 18},
        {group: "Series 2", x: 3, y: 32}, {group: "Series 2", x: 4, y: 26},
        {group: "Series 2", x: 5, y: 38}, {group: "Series 2", x: 6, y: 42},
      ])
      .x("x").y("y")
      .render(done);
  `],
  ["stacked-area", "StackedArea", `
    new d3plus.StackedArea()
      .select("#viz")
      .groupBy("group")
      .data([
        {group: "A", x: 1, y: 10}, {group: "A", x: 2, y: 20}, {group: "A", x: 3, y: 15},
        {group: "A", x: 4, y: 25}, {group: "A", x: 5, y: 30},
        {group: "B", x: 1, y: 5},  {group: "B", x: 2, y: 12}, {group: "B", x: 3, y: 18},
        {group: "B", x: 4, y: 14}, {group: "B", x: 5, y: 20},
        {group: "C", x: 1, y: 8},  {group: "C", x: 2, y: 15}, {group: "C", x: 3, y: 22},
        {group: "C", x: 4, y: 18}, {group: "C", x: 5, y: 25},
      ])
      .x("x").y("y")
      .render(done);
  `],
  ["bump-chart", "BumpChart", `
    new d3plus.BumpChart()
      .select("#viz")
      .groupBy("group")
      .data([
        {group: "Item A", x: "2020", y: 1}, {group: "Item A", x: "2021", y: 2},
        {group: "Item A", x: "2022", y: 1}, {group: "Item A", x: "2023", y: 3},
        {group: "Item B", x: "2020", y: 2}, {group: "Item B", x: "2021", y: 1},
        {group: "Item B", x: "2022", y: 3}, {group: "Item B", x: "2023", y: 2},
        {group: "Item C", x: "2020", y: 3}, {group: "Item C", x: "2021", y: 3},
        {group: "Item C", x: "2022", y: 2}, {group: "Item C", x: "2023", y: 1},
      ])
      .x("x").y("y")
      .render(done);
  `],
  // groupBy must include the value key — otherwise the observations sharing an
  // id are aggregated (summed) into a single point and each box collapses to a
  // line. ["id", "value"] keeps every observation distinct for the distribution.
  ["box-whisker", "BoxWhisker", `
    new d3plus.BoxWhisker()
      .select("#viz")
      .data([
        {id: "Group A", value: 300}, {id: "Group A", value: 20}, {id: "Group A", value: 180},
        {id: "Group A", value: 40}, {id: "Group A", value: 170}, {id: "Group A", value: 125},
        {id: "Group A", value: 74}, {id: "Group A", value: 80},
        {id: "Group B", value: 180}, {id: "Group B", value: 30}, {id: "Group B", value: 120},
        {id: "Group B", value: 50}, {id: "Group B", value: 140}, {id: "Group B", value: 115},
        {id: "Group B", value: 14}, {id: "Group B", value: 30},
        {id: "Group C", value: 220}, {id: "Group C", value: 90}, {id: "Group C", value: 160},
        {id: "Group C", value: 60}, {id: "Group C", value: 200}, {id: "Group C", value: 130},
        {id: "Group C", value: 45}, {id: "Group C", value: 100},
      ])
      .groupBy(["id", "value"])
      .x("id").y("value")
      .render(done);
  `],
  ["pie", "Pie", `
    new d3plus.Pie()
      .select("#viz")
      .data([
        {id: "Alpha",   value: 30},
        {id: "Beta",    value: 22},
        {id: "Gamma",   value: 18},
        {id: "Delta",   value: 15},
        {id: "Epsilon", value: 10},
        {id: "Zeta",    value: 5},
      ])
      .render(done);
  `],
  ["donut", "Donut", `
    new d3plus.Donut()
      .select("#viz")
      .data([
        {id: "Alpha",   value: 30},
        {id: "Beta",    value: 22},
        {id: "Gamma",   value: 18},
        {id: "Delta",   value: 15},
        {id: "Epsilon", value: 10},
        {id: "Zeta",    value: 5},
      ])
      .render(done);
  `],
  ["treemap", "Treemap", `
    new d3plus.Treemap()
      .select("#viz")
      .groupBy(["group", "id"])
      .data([
        {group: "Tech", id: "Alpha",    value: 30},
        {group: "Tech", id: "Beta",     value: 25},
        {group: "Tech", id: "Gamma",    value: 18},
        {group: "Tech", id: "Delta",    value: 12},
        {group: "Health", id: "Epsilon", value: 22},
        {group: "Health", id: "Zeta",    value: 16},
        {group: "Health", id: "Eta",     value: 10},
        {group: "Energy", id: "Theta",   value: 14},
        {group: "Energy", id: "Iota",    value: 8},
      ])
      .sum("value")
      .render(done);
  `],
  ["pack", "Pack", `
    new d3plus.Pack()
      .select("#viz")
      .groupBy(["group", "id"])
      .data([
        {group: "A", id: "1", value: 10}, {group: "A", id: "2", value: 20},
        {group: "A", id: "3", value: 15}, {group: "A", id: "4", value: 25},
        {group: "B", id: "5", value: 8},  {group: "B", id: "6", value: 18},
        {group: "B", id: "7", value: 12}, {group: "B", id: "8", value: 22},
        {group: "C", id: "9", value: 14}, {group: "C", id: "10", value: 16},
        {group: "C", id: "11", value: 9}, {group: "C", id: "12", value: 30},
      ])
      .sum("value")
      .render(done);
  `],
  ["tree", "Tree", `
    new d3plus.Tree()
      .select("#viz")
      .groupBy(["root", "branch", "leaf"])
      .data([
        {root: "Root", branch: "Branch 1", leaf: "Leaf A", id: "1a"},
        {root: "Root", branch: "Branch 1", leaf: "Leaf B", id: "1b"},
        {root: "Root", branch: "Branch 1", leaf: "Leaf C", id: "1c"},
        {root: "Root", branch: "Branch 2", leaf: "Leaf D", id: "2d"},
        {root: "Root", branch: "Branch 2", leaf: "Leaf E", id: "2e"},
        {root: "Root", branch: "Branch 3", leaf: "Leaf F", id: "3f"},
      ])
      .render(done);
  `],
  ["matrix", "Matrix", `
    new d3plus.Matrix()
      .select("#viz")
      .data([
        {row: "R1", column: "C1", value: 10},
        {row: "R1", column: "C2", value: 25},
        {row: "R1", column: "C3", value: 15},
        {row: "R2", column: "C1", value: 30},
        {row: "R2", column: "C2", value: 20},
        {row: "R2", column: "C3", value: 5},
        {row: "R3", column: "C1", value: 18},
        {row: "R3", column: "C2", value: 12},
        {row: "R3", column: "C3", value: 28},
      ])
      .groupBy(["row", "column"])
      .column("column")
      .row("row")
      .colorScale("value")
      .colorScaleConfig({scale: "jenks", legendConfig: {title: "Value"}})
      .colorScalePosition("right")
      .columnConfig({title: "Column"})
      .rowConfig({title: "Row"})
      .render(done);
  `],
  ["radial-matrix", "RadialMatrix", `
    new d3plus.RadialMatrix()
      .select("#viz")
      .data([
        {row: "Inner", column: "A", value: 10},
        {row: "Inner", column: "B", value: 25},
        {row: "Inner", column: "C", value: 15},
        {row: "Inner", column: "D", value: 20},
        {row: "Middle", column: "A", value: 18},
        {row: "Middle", column: "B", value: 22},
        {row: "Middle", column: "C", value: 28},
        {row: "Middle", column: "D", value: 12},
        {row: "Outer", column: "A", value: 30},
        {row: "Outer", column: "B", value: 16},
        {row: "Outer", column: "C", value: 24},
        {row: "Outer", column: "D", value: 8},
      ])
      .groupBy(["row", "column"])
      .column("column")
      .row("row")
      .colorScale("value")
      .colorScaleConfig({scale: "jenks", legendConfig: {title: "Value"}})
      .colorScalePosition("right")
      .render(done);
  `],
  ["priestley", "Priestley", `
    new d3plus.Priestley()
      .select("#viz")
      .data([
        {id: "Era 1", start: 1900, end: 1925, group: "Period A"},
        {id: "Era 2", start: 1920, end: 1950, group: "Period B"},
        {id: "Era 3", start: 1945, end: 1975, group: "Period A"},
        {id: "Era 4", start: 1965, end: 1990, group: "Period B"},
        {id: "Era 5", start: 1985, end: 2010, group: "Period A"},
        {id: "Era 6", start: 2005, end: 2025, group: "Period B"},
      ])
      .groupBy("group")
      .render(done);
  `],
  ["radar", "Radar", `
    new d3plus.Radar()
      .select("#viz")
      .data([
        {group: "A", metric: "Strength", value: 8},
        {group: "A", metric: "Speed", value: 6},
        {group: "A", metric: "Stamina", value: 9},
        {group: "A", metric: "Agility", value: 7},
        {group: "A", metric: "Intellect", value: 5},
        {group: "B", metric: "Strength", value: 5},
        {group: "B", metric: "Speed", value: 9},
        {group: "B", metric: "Stamina", value: 6},
        {group: "B", metric: "Agility", value: 8},
        {group: "B", metric: "Intellect", value: 9},
      ])
      .groupBy("group")
      .render(done);
  `],
  ["sankey", "Sankey", `
    new d3plus.Sankey()
      .select("#viz")
      .links([
        {source: "Source A", target: "Hub 1", value: 30},
        {source: "Source A", target: "Hub 2", value: 20},
        {source: "Source B", target: "Hub 1", value: 25},
        {source: "Source B", target: "Hub 2", value: 15},
        {source: "Hub 1", target: "Out X", value: 35},
        {source: "Hub 1", target: "Out Y", value: 20},
        {source: "Hub 2", target: "Out X", value: 15},
        {source: "Hub 2", target: "Out Y", value: 20},
      ])
      .render(done);
  `],
  ["network", "Network", `
    new d3plus.Network()
      .select("#viz")
      .nodes([
        {id: "A", x: -50, y: 0}, {id: "B", x: 50, y: 0},
        {id: "C", x: 0, y: -50}, {id: "D", x: 0, y: 50},
        {id: "E", x: -100, y: -50}, {id: "F", x: 100, y: 50},
      ])
      .links([
        {source: "A", target: "B"}, {source: "A", target: "C"},
        {source: "A", target: "D"}, {source: "B", target: "D"},
        {source: "C", target: "B"}, {source: "E", target: "A"},
        {source: "F", target: "B"},
      ])
      .render(done);
  `],
  ["rings", "Rings", `
    new d3plus.Rings()
      .select("#viz")
      .center("Hub")
      .nodes([
        {id: "Hub"},
        {id: "Node A"}, {id: "Node B"}, {id: "Node C"}, {id: "Node D"},
        {id: "Leaf 1"}, {id: "Leaf 2"}, {id: "Leaf 3"}, {id: "Leaf 4"},
      ])
      .links([
        {source: "Hub", target: "Node A"}, {source: "Hub", target: "Node B"},
        {source: "Hub", target: "Node C"}, {source: "Hub", target: "Node D"},
        {source: "Node A", target: "Leaf 1"}, {source: "Node B", target: "Leaf 2"},
        {source: "Node C", target: "Leaf 3"}, {source: "Node D", target: "Leaf 4"},
      ])
      .render(done);
  `],
  ["geomap", "Geomap", `
    new d3plus.Geomap()
      .select("#viz")
      .data([{id: "01", population: 4830620}, {id: "02", population: 733375}, {id: "04", population: 6641928}, {id: "05", population: 2958208}, {id: "06", population: 38421464}, {id: "08", population: 5278906}, {id: "09", population: 3593222}, {id: "10", population: 926454}, {id: "11", population: 647484}, {id: "12", population: 19645772}, {id: "13", population: 10006693}, {id: "15", population: 1406299}, {id: "16", population: 1616547}, {id: "17", population: 12873761}, {id: "18", population: 6568645}, {id: "19", population: 3093526}, {id: "20", population: 2892987}, {id: "21", population: 4397353}, {id: "22", population: 4625253}, {id: "23", population: 1329100}, {id: "24", population: 5930538}, {id: "25", population: 6705586}, {id: "26", population: 9900571}, {id: "27", population: 5419171}, {id: "28", population: 2988081}, {id: "29", population: 6045448}, {id: "30", population: 1014699}, {id: "31", population: 1869365}, {id: "32", population: 2798636}, {id: "33", population: 1324201}, {id: "34", population: 8904413}, {id: "35", population: 2084117}, {id: "36", population: 19673174}, {id: "37", population: 9845333}, {id: "38", population: 721640}, {id: "39", population: 11575977}, {id: "40", population: 3849733}, {id: "41", population: 3939233}, {id: "42", population: 12779559}, {id: "44", population: 1053661}, {id: "45", population: 4777576}, {id: "46", population: 843190}, {id: "47", population: 6499615}, {id: "48", population: 26538614}, {id: "49", population: 2903379}, {id: "50", population: 626604}, {id: "51", population: 8256630}, {id: "53", population: 6985464}, {id: "54", population: 1851420}, {id: "55", population: 5742117}, {id: "56", population: 579679}])
      .groupBy("id")
      .colorScale("population")
      .topojson("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .topojsonKey("states")
      .projection("geoAlbersUsa")
      .tiles(false)
      .render(done);
  `],
];

async function renderChart(browser, scriptTag, body, file) {
  const page = await browser.newPage({viewport: {width: W, height: H}});
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  try {
    await page.setContent(`<!doctype html><html><body>
      <style>
        body { margin: 0; font-family: Inter, system-ui, sans-serif; background: white; }
        #viz { width: ${W}px; height: ${H}px; }
      </style>
      <div id="viz"></div>
    </body></html>`);
    await page.addScriptTag({content: cryptoPolyfill});
    await page.addScriptTag(scriptTag);
    await page.evaluate(
      body =>
        new Promise((done, fail) => {
          try {
            const fn = new Function("d3plus", "done", body);
            fn(window.d3plus, () => setTimeout(done, 700));
            setTimeout(() => fail(new Error("render timed out")), 15000);
          } catch (e) {
            fail(e);
          }
        }),
      body,
    );
    await page.screenshot({path: file, fullPage: false});
    return {ok: true, errors};
  } catch (e) {
    // leave a blank/partial screenshot if possible for the composite
    try { await page.screenshot({path: file, fullPage: false}); } catch {}
    return {ok: false, error: e.message, errors};
  } finally {
    await page.close();
  }
}

function dataUri(file) {
  if (!fs.existsSync(file)) return "";
  return "data:image/png;base64," + fs.readFileSync(file).toString("base64");
}

async function compositePair(browser, name, label, v3Res, v4Res, v4cRes) {
  const v3Img = dataUri(path.join(outDir, "v3", `${name}.png`));
  const v4Img = dataUri(path.join(outDir, "v4", `${name}.png`));
  const v4cImg = dataUri(path.join(outDir, "v4-canvas", `${name}.png`));
  const badge = res =>
    res.ok ? "" : `<span class="bad">render failed: ${(res.error || "").replace(/</g, "&lt;")}</span>`;
  const panel = (title, sub, img, res) => `
    <div class="panel">
      <div class="cap"><b>${title}</b> <span class="sub">${sub}</span> ${badge(res)}</div>
      ${img ? `<img src="${img}" width="${W}" height="${H}">` : `<div class="missing">no output</div>`}
    </div>`;
  const html = `<!doctype html><html><body>
    <style>
      body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #fff; }
      .title { font-size: 22px; font-weight: 700; padding: 14px 20px 8px; }
      .row { display: flex; gap: 2px; background: #e5e7eb; }
      .panel { background: #fff; }
      .cap { padding: 8px 14px; font-size: 14px; color: #111; border-bottom: 1px solid #eee; }
      .sub { color: #888; font-weight: 400; }
      .bad { color: #c0392b; font-weight: 600; margin-left: 8px; }
      img { display: block; }
      .missing { width: ${W}px; height: ${H}px; display: flex; align-items: center;
                 justify-content: center; color: #c0392b; font-size: 20px; }
    </style>
    <div class="title">${label}</div>
    <div class="row">
      ${panel("v3", "@d3plus/core@3.1.6", v3Img, v3Res)}
      ${panel("v4 · SVG", "this branch", v4Img, v4Res)}
      ${panel("v4 · Canvas", 'renderer("canvas")', v4cImg, v4cRes)}
    </div>
  </body></html>`;
  const page = await browser.newPage({viewport: {width: W * 3 + 6, height: H + 100}});
  await page.setContent(html);
  await page.screenshot({path: path.join(outDir, "pairs", `${name}.png`), fullPage: true});
  await page.close();
}

async function buildOverview(browser, items, perSheet) {
  const sheets = [];
  for (let i = 0; i < items.length; i += perSheet) {
    sheets.push(items.slice(i, i + perSheet));
  }
  const sw = 380, sh = Math.round(sw * H / W);
  for (let s = 0; s < sheets.length; s++) {
    const rows = sheets[s].map(({name, label, v3Res, v4Res, v4cRes}) => {
      const v3Img = dataUri(path.join(outDir, "v3", `${name}.png`));
      const v4Img = dataUri(path.join(outDir, "v4", `${name}.png`));
      const v4cImg = dataUri(path.join(outDir, "v4-canvas", `${name}.png`));
      const cell = (img, ok) =>
        img && ok
          ? `<img src="${img}" width="${sw}" height="${sh}">`
          : `<div class="x" style="width:${sw}px;height:${sh}px">failed</div>`;
      return `<div class="rrow">
        <div class="rlabel">${label}</div>
        <div class="cells">
          <div class="cell">${cell(v3Img, v3Res.ok)}</div>
          <div class="cell">${cell(v4Img, v4Res.ok)}</div>
          <div class="cell">${cell(v4cImg, v4cRes.ok)}</div>
        </div>
      </div>`;
    }).join("");
    const html = `<!doctype html><html><body>
      <style>
        body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #fff; padding: 16px; }
        .head { display: flex; margin-left: 150px; }
        .head div { width: ${sw}px; text-align: center; font-weight: 700; font-size: 16px; padding: 6px 0; }
        .rrow { display: flex; align-items: center; border-top: 1px solid #eee; padding: 6px 0; }
        .rlabel { width: 150px; font-weight: 600; font-size: 14px; }
        .cells { display: flex; gap: 8px; }
        .cell img { display: block; border: 1px solid #eee; }
        .x { display: flex; align-items: center; justify-content: center; color: #c0392b; border: 1px solid #eee; }
      </style>
      <div class="head"><div>v3 &nbsp;<span style="font-weight:400;color:#888">(3.1.6)</span></div><div>v4 SVG &nbsp;<span style="font-weight:400;color:#888">(branch)</span></div><div>v4 Canvas &nbsp;<span style="font-weight:400;color:#888">(branch)</span></div></div>
      ${rows}
    </body></html>`;
    const page = await browser.newPage({viewport: {width: 150 + sw * 3 + 80, height: 800}});
    await page.setContent(html);
    const file = path.join(outDir, `overview-${s + 1}.png`);
    await page.screenshot({path: file, fullPage: true});
    await page.close();
    console.log(`  overview sheet ${s + 1} -> ${file}`);
  }
}

async function main() {
  console.log("Building v4 UMD bundle…");
  await buildUmd();
  if (!fs.existsSync(umdPath)) throw new Error(`UMD bundle not found at ${umdPath}`);
  const v4Umd = fs.readFileSync(umdPath, "utf8");

  console.log("Fetching v3 bundle…");
  const v3Umd = await (await fetch(v3Url)).text();

  const browser = await chromium.launch();
  const items = [];

  for (const [name, label, body] of examples) {
    process.stdout.write(`  ${label.padEnd(14)} v3…`);
    const v3Res = await renderChart(browser, {content: v3Umd}, body, path.join(outDir, "v3", `${name}.png`));
    process.stdout.write(v3Res.ok ? " ✓" : " ✗");
    process.stdout.write("  v4-svg…");
    const v4Res = await renderChart(browser, {content: v4Umd}, body, path.join(outDir, "v4", `${name}.png`));
    process.stdout.write(v4Res.ok ? " ✓" : " ✗");
    process.stdout.write("  v4-canvas…");
    const v4cRes = await renderChart(browser, {content: v4Umd}, canvasBody(body), path.join(outDir, "v4-canvas", `${name}.png`));
    process.stdout.write(v4cRes.ok ? " ✓" : " ✗");
    await compositePair(browser, name, label, v3Res, v4Res, v4cRes);
    console.log("  composited");
    items.push({name, label, v3Res, v4Res, v4cRes});
  }

  console.log("\nBuilding overview sheets…");
  await buildOverview(browser, items, 6);

  await browser.close();

  console.log("\nSummary:");
  for (const {name, label, v3Res, v4Res, v4cRes} of items) {
    const f = r => (r.ok ? "✓" : `✗ ${r.error}`);
    console.log(`  ${label.padEnd(14)} v3:${f(v3Res).padEnd(20)} v4-svg:${f(v4Res).padEnd(20)} v4-canvas:${f(v4cRes)}`);
    for (const e of [...v3Res.errors, ...v4Res.errors, ...v4cRes.errors]) console.log(`       page-error: ${e}`);
  }
  console.log(`\nDone. Composites in ${path.join(outDir, "pairs")}/, overviews in ${outDir}/`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
