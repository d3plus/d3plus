import assert from "assert";
import {scaleSqrt} from "d3-scale";

import {closeBrowser, render} from "../playwright.js";
import {
  defaultSizeLegendValues,
  zoomSizeLegendScale,
} from "../../es/src/components/SizeLegend/sizeLegendLayout.js";

/**
    The nested-circle size legend's layout (#83): concentric circles that
    share a bottom tangent, radii straight from the chart's radius scale, and
    labels that never overlap. Layout measures text, so it runs in Chromium.
*/

after(async () => {
  await closeBrowser();
});

it("SizeLegend: default values are the extremes plus a round middle", () => {
  assert.deepStrictEqual(defaultSizeLegendValues([10, 1000]), [10, 500, 1000]);
  assert.deepStrictEqual(defaultSizeLegendValues([0.2, 37.1]), [0.2, 20, 37.1]);
  assert.deepStrictEqual(defaultSizeLegendValues([5, 800], 2), [5, 800]);
});

it("zoomSizeLegendScale: relabels so the zoomed circles fit the unzoomed box", () => {
  const scale = scaleSqrt().domain([0, 400]).range([0, 20]);
  assert.strictEqual(zoomSizeLegendScale(scale, 1), scale);
  const zoomed = zoomSizeLegendScale(scale, 2);
  // At 2×, radius 20 on screen is radius 10 in layout: the value 100.
  assert.deepStrictEqual(zoomed.domain(), [0, 100]);
  assert.strictEqual(zoomed(100), 20);
  assert.strictEqual(zoomed(25), scale(25) * 2);
  // Off-grid fits round down to a nice value that still fits.
  assert.deepStrictEqual(zoomSizeLegendScale(scale, 3).domain(), [0, 40]);
});

/**
    Runs the source `body` in the page, where it can call `scale(domain,
    range, sqrt?)` for a minimal radius scale and `layout(scale, extra?)` for
    `computeSizeLegend` with the base input, and returns its value.
*/
const inPage = body =>
  render("<div></div>", src => {
    const scale = (domain, range, sqrt) => {
      const f = sqrt ? Math.sqrt : v => v;
      const [d0, d1] = domain.map(f);
      const s = v => range[0] + ((f(v) - d0) / (d1 - d0 || 1)) * (range[1] - range[0]);
      s.domain = () => domain;
      return s;
    };
    const base = {
      tickFormat: v => `${v}`,
      fontFamily: "sans-serif",
      fontSize: 10,
      titleFontFamily: "sans-serif",
      titleFontSize: 11,
      titleFontWeight: 600,
      lineLength: 10,
      labelPadding: 4,
      padding: 5,
    };
    const layout = (s, extra = {}) => window.d3plus.computeSizeLegend({...base, scale: s, ...extra});
    return new Function("d3plus", "scale", "layout", src)(window.d3plus, scale, layout);
  }, body);

it("SizeLegend: circles share a bottom tangent and take their radii from the scale", async () => {
  const out = await inPage(`
    const s = scale([10, 1000], [4, 30], true);
    const {circles} = layout(s);
    return {circles, expected: circles.map(c => s(c.value))};
  `);
  assert.deepStrictEqual(out.circles.map(c => c.value), [1000, 500, 10]);
  out.circles.forEach((c, i) => assert.strictEqual(c.r, out.expected[i]));
  const bottoms = out.circles.map(c => c.cy + c.r);
  bottoms.forEach(b => assert.ok(Math.abs(b - bottoms[0]) < 1e-9, "circles share one base"));
  assert.ok(out.circles.every(c => c.cx === out.circles[0].cx), "circles are concentric");
});

it("SizeLegend: every label sits in a column right of the circles, on a leader line", async () => {
  const out = await inPage("return layout(scale([10, 1000], [4, 40], true));");
  const right = out.circles[0].cx + out.circles[0].r;
  out.labels.forEach(l => assert.ok(l.x > right, `${l.text} is right of the circles`));
  assert.strictEqual(out.lines.length, out.labels.length, "one leader line per label");
  out.lines.forEach(line => {
    const c = out.circles.find(circle => circle.value === line.value);
    assert.deepStrictEqual(line.points[0], [c.cx, c.cy - c.r], "leader starts at the circle's top");
  });
});

it("SizeLegend: labels never overlap, even when small circles crowd them", async () => {
  const labels = await inPage(
    "return layout(scale([1, 100], [2, 40]), {values: [100, 6, 5, 4, 3, 2, 1]}).labels;",
  );
  const box = l => ({x0: l.x, x1: l.x + l.width, y0: l.y - 6, y1: l.y + 6});
  for (let i = 0; i < labels.length; i++)
    for (let j = i + 1; j < labels.length; j++) {
      const a = box(labels[i]), b = box(labels[j]);
      const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 - 1e-9 && b.y0 < a.y1 - 1e-9;
      assert.ok(!overlap, `labels ${labels[i].text} and ${labels[j].text} don't overlap`);
    }
});

it("SizeLegend: the title is centered over the circles", async () => {
  const out = await inPage(`return {
    short: layout(scale([1, 100], [3, 30], true), {title: "Pop"}),
    long: layout(scale([1, 100], [3, 30], true), {title: "A considerably longer title than the circles"}),
  };`);
  assert.strictEqual(out.short.title.x, out.short.circles[0].cx);
  const {title, width, circles} = out.long;
  assert.ok(title.x - title.width / 2 >= 0 && title.x + title.width / 2 <= width, "a wide title stays in the box");
  assert.strictEqual(circles[0].cx, title.x, "and the circles center under it");
});

it("SizeLegend: honors explicit values and tickFormat, and sizes its box to fit", async () => {
  const out = await inPage(
    'return layout(scale([0, 50], [0, 20]), {values: [50, 25], tickFormat: v => v + " units", title: "Weight"});',
  );
  assert.deepStrictEqual(out.labels.map(l => l.text), ["50 units", "25 units"]);
  assert.strictEqual(out.title.text, "Weight");
  assert.ok(out.width >= Math.max(...out.labels.map(l => l.x + l.width)), "box spans the widest label");
  assert.ok(out.height >= Math.max(...out.circles.map(c => c.cy + c.r)), "box spans the largest circle");
});

it("SizeLegend: a single-value domain draws nothing; maxRadius drops outsized values", async () => {
  const out = await inPage(`return {
    single: layout(scale([7, 7], [10, 10])),
    capped: layout(scale([0, 100], [0, 40]), {values: [100, 50, 10], maxRadius: 20}),
  };`);
  assert.strictEqual(out.single.circles.length, 0);
  assert.strictEqual(out.single.width, 0);
  assert.deepStrictEqual(out.capped.circles.map(c => c.value), [50, 10]);
});

it("SizeLegend component: lays out from config and emits non-interactive scene nodes", async () => {
  const out = await inPage(`
    const legend = new d3plus.SizeLegend()
      .scale(scale([1, 100], [3, 24], true))
      .title("Value")
      .shapeConfig({stroke: "red"});
    const size = legend.layout();
    return {size, scene: legend.toScene(10, 20)};
  `);
  assert.ok(out.size.width > 48 && out.size.height > 48);
  assert.deepStrictEqual(out.scene.transform, {x: 10, y: 20});
  const count = type => out.scene.children.filter(c => c.type === type).length;
  assert.strictEqual(count("circle"), 3);
  assert.strictEqual(count("line"), 3);
  assert.strictEqual(count("text"), 4);
  assert.strictEqual(out.scene.children.find(c => c.type === "circle").paint.stroke, "red");
  assert.ok(out.scene.children.every(c => c.interactive === false), "legend chrome ignores pointer hits");
});

it("SizeLegend component: renders standalone into its container", async () => {
  const out = await render('<div id="legend"></div>', () => {
    const legend = new window.d3plus.SizeLegend()
      .scale(Object.assign(v => v / 5, {domain: () => [10, 100]}))
      .select("#legend")
      .render();
    const svg = document.querySelector("#legend svg");
    return {
      circles: svg ? svg.querySelectorAll("circle").length : 0,
      text: svg ? svg.textContent : "",
      width: legend.outerBounds().width,
    };
  });
  assert.strictEqual(out.circles, 3);
  assert.ok(out.text.includes("100") && out.text.includes("10"));
  assert.ok(out.width > 0);
});
