/**
    Renders one representative example of each chart type using the freshly-
    built UMD bundle in a headless Chromium, screenshots the rendered chart,
    and saves to /tmp/d3plus-screenshots/.

    Per-chart configs are tiny self-contained reproductions (not loaded from
    the dev/ HTMLs — those reach for ../../umd/d3plus-core.full.js which
    requires file:// loading and have unrelated debug noise).
*/

import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const coreDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const umdPath = path.join(coreDir, "umd", "d3plus-core.full.js");
const outDir = "/tmp/d3plus-screenshots";

fs.mkdirSync(outDir, {recursive: true});

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

/** Each entry: [filename, builder-function-body-as-string]. Body has `d3plus`
    + `done` in scope; should call done() after rendering completes. */
const examples = [
  ["bar-chart", `
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
  ["area-plot", `
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
  ["line-plot", `
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
  ["stacked-area", `
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
  ["bump-chart", `
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
  ["box-whisker", `
    new d3plus.BoxWhisker()
      .select("#viz")
      .groupBy("group")
      .data([
        {group: "A", x: "Group A", y: 10}, {group: "A", x: "Group A", y: 15},
        {group: "A", x: "Group A", y: 20}, {group: "A", x: "Group A", y: 25},
        {group: "A", x: "Group A", y: 30}, {group: "A", x: "Group A", y: 35},
        {group: "B", x: "Group B", y: 12}, {group: "B", x: "Group B", y: 18},
        {group: "B", x: "Group B", y: 24}, {group: "B", x: "Group B", y: 28},
        {group: "B", x: "Group B", y: 38}, {group: "B", x: "Group B", y: 45},
        {group: "C", x: "Group C", y: 8},  {group: "C", x: "Group C", y: 14},
        {group: "C", x: "Group C", y: 20}, {group: "C", x: "Group C", y: 26},
        {group: "C", x: "Group C", y: 32}, {group: "C", x: "Group C", y: 40},
      ])
      .x("x").y("y")
      .render(done);
  `],
  ["pie", `
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
  ["donut", `
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
  ["treemap", `
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
  ["pack", `
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
  ["tree", `
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
  ["matrix", `
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
      .render(done);
  `],
  ["radial-matrix", `
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
      .render(done);
  `],
  ["priestley", `
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
  ["radar", `
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
  ["sankey", `
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
  ["network", `
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
  ["rings", `
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
];

async function main() {
  console.log("Building UMD bundle…");
  await buildUmd();
  if (!fs.existsSync(umdPath)) throw new Error(`UMD bundle not found at ${umdPath}`);
  const umd = fs.readFileSync(umdPath, "utf8");

  const browser = await chromium.launch();
  const results = [];

  for (const [name, body] of examples) {
    const file = path.join(outDir, `${name}.png`);
    process.stdout.write(`  rendering ${name}…`);
    const page = await browser.newPage({viewport: {width: 900, height: 600}});
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    try {
      await page.setContent(`<!doctype html><html><body>
        <style>
          body { margin: 0; font-family: Inter, system-ui, sans-serif; background: white; }
          #viz { width: 900px; height: 600px; }
        </style>
        <div id="viz"></div>
      </body></html>`);
      await page.addScriptTag({content: cryptoPolyfill});
      await page.addScriptTag({content: umd});
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
      results.push({name, file, ok: true, errors});
      console.log(" ✓");
    } catch (e) {
      results.push({name, file, ok: false, error: e.message, errors});
      console.log(` ✗ ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("\nResults:");
  for (const r of results) {
    const tag = r.ok ? "✓" : "✗";
    console.log(`  ${tag} ${r.name.padEnd(20)} ${r.ok ? r.file : r.error}`);
    if (r.errors?.length) {
      for (const err of r.errors) console.log(`     page-error: ${err}`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
