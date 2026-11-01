import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Reference line and band labels draw above the data, so they move clear
    of the bars' own labels: to another corner, the line's other end or side,
    or along it, staying inside the plot, on both renderers.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

// Every painted text line's box in surface pixels, with the text and
// whether it belongs to an annotation.
const PRELUDE = `
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const textBoxes = chart => {
    const out = [];
    const walk = (list, ox, oy, annotation) => list.forEach(n => {
      const t = n.transform || {};
      const x = ox + (t.x || 0), y = oy + (t.y || 0);
      const inAnnotation = annotation || String(n.key).startsWith("annotation-");
      if (n.type === "text") {
        const size = n.font.size, anchor = n.font.anchor || "start";
        const baseline = n.font.baseline || "alphabetic";
        const above = baseline === "hanging" ? 0 : baseline === "middle" ? size / 2 : size * 0.8;
        n.lines.forEach(l => {
          if (!l.text || !l.width) return;
          const shift = anchor === "middle" ? l.width / 2 : anchor === "end" ? l.width : 0;
          out.push({
            text: l.text, annotation: inAnnotation,
            x: x + n.x + l.x - shift, y: y + n.y + l.y - above, width: l.width, height: size,
          });
        });
      }
      if (n.children) walk(n.children, x, y, inAnnotation);
    });
    walk(chart._sceneRenderer._scene.root.children, 0, 0, false);
    return out;
  };
`;

function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

const overlaps = (a, b) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const sales = `const sales = [
  {region: "North", sales: 42},
  {region: "South", sales: 52},
  {region: "East", sales: 31},
  {region: "West", sales: 51},
  {region: "Central", sales: 47},
];`;

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] BarChart: reference labels stay clear of the bar labels`, async () => {
    for (const width of [420, 640, 900]) await check(renderer, width);
  });
}

async function check(renderer, width) {
  const r = await page(
    `${sales}
      document.querySelector("#viz").style.width = arg.width + "px";
      const chart = new d3plus.BarChart()
        .data(sales).groupBy("region").x("region").y("sales").legend(false)
        .renderer(arg.renderer)
        .referenceLines([
          {x: "East", label: "Pilot", labelPosition: "end"},
          {y: 50, label: "Quota", dash: "6 3"},
        ])
        .referenceBands([{x: ["South", "West"], label: "Campaign"}]);
      await done(chart);
      const area = chart._plotArea;
      return {boxes: textBoxes(chart), area};
      `,
    {renderer, width},
  );
  const refs = r.boxes.filter(b => b.annotation);
  const bars = r.boxes.filter(
    b => !b.annotation && /^(North|South|East|West|Central)$/.test(b.text),
  );
  assert.deepStrictEqual(
    refs.map(b => b.text).sort(),
    ["Campaign", "Pilot", "Quota"],
    `${width}px: every reference label draws`,
  );
  assert.ok(
    bars.length >= 5,
    `${width}px: the bars draw their labels (${bars.length})`,
  );
  for (const ref of refs) {
    for (const bar of bars)
      assert.ok(
        !overlaps(ref, bar),
        `${width}px: "${ref.text}" ${JSON.stringify(ref)} overlaps "${bar.text}" ${JSON.stringify(bar)}`,
      );
    for (const other of refs)
      if (other !== ref)
        assert.ok(
          !overlaps(ref, other),
          `${width}px: "${ref.text}" overlaps "${other.text}"`,
        );
  }
}
