import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {openPage} from "~test/browser/page.js";

/**
    Callout annotations and reference lines and bands in a real browser, on
    both renderers: each lands at its data value's pixel position (linear,
    category, and time axes, and the secondary y axis), follows a zoom,
    reads on a dark theme, takes the user's styles, and stays out of the
    pointer's and keyboard's way.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

// Page-side helpers: drawing, and the painted scene's nodes with their
// surface offsets (`x`/`y` include the node's own transform; `px`/`py` are
// its parent's).
const PRELUDE = `
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const nodes = chart => {
    const out = [];
    const walk = (list, ox, oy) => list.forEach(n => {
      const t = n.transform || {};
      const x = ox + (t.x || 0), y = oy + (t.y || 0);
      out.push({n, x, y, px: ox, py: oy});
      if (n.children) walk(n.children, x, y);
    });
    walk(chart._sceneRenderer._scene.root.children, 0, 0);
    return out;
  };
  const byKey = (chart, suffix) => nodes(chart).find(e => String(e.n.key).endsWith(suffix));
  const rect = e => e && {x: e.x + e.n.x, y: e.y + e.n.y, width: e.n.width, height: e.n.height};
  const linePoints = e => e && e.n.points.map(([x, y]) => [e.x + x, e.y + y]);
  const tip = e => e && (e.n.type === "circle"
    ? [e.x + e.n.cx, e.y + e.n.cy]
    : e.n.d.slice(1).split("L")[0].split(",").map((v, i) => +v + (i ? e.y : e.x)));
  // The surface offset of content space (where the axis functions map to).
  const origin = chart => {
    const e = nodes(chart).find(e => /^annotation-(back|front)-\\d+$/.test(e.n.key));
    return [e.px, e.py];
  };
  const annotationEntries = chart => nodes(chart).filter(e => String(e.n.key).startsWith("annotation-"));
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

const near = (a, b, msg, tol = 0.5) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

const series = `const data = [];
  for (let i = 0; i <= 20; i++) data.push({id: "s", x: i * 5, y: 20 + i * 3});
  // The same points as a scatter, on linear x and y axes.
  const points = data.map((d, i) => ({...d, id: "p" + i}));`;

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] LinePlot: a callout anchors on its point; a reference line and band land at their values`, async () => {
    const r = await page(
      `${series}
      const chart = new d3plus.LinePlot()
        .data(data).groupBy("id").legend(false).renderer(arg)
        .referenceLines([{y: 50, label: "Target", dash: true}])
        .referenceBands([{x: [20, 40], label: "Recession"}])
        .annotations([{shape: "Callout", data: [{x: 50, y: 50, label: "Midpoint"}], dx: 60, dy: 40}]);
      await done(chart);
      const [ox, oy] = origin(chart);
      const line = nodes(chart).find(e => e.n.shapeType === "Line" && e.n.interactionPoints);
      const point = line.n.interactionPoints.find(p => p.datum && p.datum.data && p.datum.data.x === 50);
      const area = chart._plotArea;
      return {
        expected: {
          anchor: [ox + chart._xFunc(50), oy + chart._yFunc(50)],
          target: oy + chart._yFunc(50),
          band: [ox + chart._xFunc(20), ox + chart._xFunc(40)],
          plot: [ox + area.x, oy + area.y, area.width, area.height],
        },
        point: [line.px + point.x, line.py + point.y],
        tip: tip(byKey(chart, "-0-marker")),
        box: rect(byKey(chart, "-0-box")),
        rule: linePoints(byKey(chart, "back-1-line")),
        band: rect(byKey(chart, "back-0-band")),
        labels: annotationEntries(chart).filter(e => e.n.type === "text").map(e => e.n.lines.map(l => l.text).join(" ")),
        // Paint order: the band and line behind the series, their labels above it.
        order: (() => {
          const keys = nodes(chart).map(e => String(e.n.key));
          const at = k => keys.indexOf(k);
          return {
            band: at("annotation-back-0-band"),
            rule: at("annotation-back-1-line"),
            series: nodes(chart).findIndex(e => e.n.shapeType === "Line"),
            label: at("annotation-back-1-label"),
            callout: at("annotation-front-0-0-box"),
          };
        })(),
        dom: arg === "svg" ? Array.from(document.querySelectorAll("#viz text")).map(t => t.textContent) : null,
      };
      `,
      renderer,
    );
    const {expected} = r;
    near(r.point[0], expected.anchor[0], "the series point's x");
    near(r.tip[0], expected.anchor[0], "the arrow tip's x is the anchor's");
    near(r.tip[1], expected.anchor[1], "the arrow tip's y is the anchor's");
    near(r.tip[1], r.point[1], "the anchor is on the series point");
    near(
      r.box.x + r.box.width / 2,
      r.tip[0] + 60,
      "the box sits dx from the anchor",
    );
    near(
      r.box.y + r.box.height / 2,
      r.tip[1] + 40,
      "the box sits dy from the anchor",
    );
    const [px, py, pw, ph] = expected.plot;
    near(r.rule[0][1], expected.target, "the reference line at y = 50");
    near(r.rule[1][1], expected.target, "it runs level");
    near(r.rule[0][0], px, "from the plot's left edge");
    near(r.rule[1][0], px + pw, "to its right edge");
    near(r.band.x, expected.band[0], "the band starts at x = 20");
    near(r.band.x + r.band.width, expected.band[1], "and ends at x = 40");
    near(r.band.y, py, "the band spans the plot's height");
    near(r.band.height, ph, "the band spans the plot's height");
    const {order} = r;
    assert.ok(order.band < order.series, "the band paints behind the series");
    assert.ok(order.rule < order.series, "the line paints behind the series");
    assert.ok(order.label > order.series, "the line's label paints above it");
    assert.ok(order.callout > order.series, "the callout paints in front");
    assert.deepStrictEqual(r.labels.sort(), [
      "Midpoint",
      "Recession",
      "Target",
    ]);
    if (r.dom)
      ["Midpoint", "Recession", "Target"].forEach(t =>
        assert.ok(r.dom.includes(t), `${t} is painted in the SVG`),
      );
  });

  it(`[${renderer}] BarChart: a reference line at a category and a band across categories cover their bars`, async () => {
    const r = await page(
      `
      const chart = new d3plus.BarChart()
        .data([
          {id: "A", v: 20}, {id: "B", v: 40}, {id: "C", v: 30}, {id: "D", v: 50},
        ])
        .groupBy("id").x("id").y("v").legend(false).renderer(arg)
        .referenceLines([{x: "B", label: "Pick"}, {y: 40, label: "Goal"}])
        .referenceBands([{x: ["B", "C"], label: "Span"}]);
      await done(chart);
      const bars = {};
      nodes(chart).forEach(e => {
        if (e.n.shapeType === "Bar" && e.n.type === "rect" && !String(e.n.key).endsWith("::hit"))
          bars[e.n.datum.data.id] = rect(e);
      });
      return {
        bars,
        band: rect(byKey(chart, "back-0-band")),
        pick: linePoints(byKey(chart, "back-1-line")),
        goal: linePoints(byKey(chart, "back-2-line")),
      };
      `,
      renderer,
    );
    const {B, C} = r.bars;
    assert.ok(
      r.band.x <= B.x + 0.5 && r.band.x + r.band.width >= C.x + C.width - 0.5,
      `the band covers bars B and C (${JSON.stringify(r.band)})`,
    );
    assert.ok(r.band.x > r.bars.A.x + r.bars.A.width - 0.5, "but not A");
    assert.ok(r.band.x + r.band.width < r.bars.D.x + 0.5, "nor D");
    near(
      r.pick[0][0],
      B.x + B.width / 2,
      "the category line crosses B's center",
    );
    near(r.goal[0][1], B.y, "the y = 40 line meets B's top", 1);
  });

  it(`[${renderer}] time axis and y2: reference positions parse dates and use the secondary scale`, async () => {
    const r = await page(
      `
      const data = [];
      for (let i = 0; i < 24; i++)
        data.push({id: "s", date: new Date(2021, i, 1), value: 10 + i, other: 100 - i * 2});
      const chart = new d3plus.LinePlot()
        .data(data).groupBy("id").x("date").time("date").y("value").y2("other")
        .legend(false).timeline(false).renderer(arg)
        .referenceLines([{x: "2021-06-01", label: "Launch"}, {y2: 80, label: "Y2"}])
        .referenceBands([{x: ["2022-01-01", "2022-06-01"]}])
        .annotations([{shape: "Callout", data: [{x: "2021-07-01", y: 16, label: "July"}]}]);
      await done(chart);
      const [ox, oy] = origin(chart);
      return {
        launch: linePoints(byKey(chart, "back-1-line"))[0][0] - ox,
        launchAt: chart._xFunc(new Date(2021, 5, 1)),
        y2: linePoints(byKey(chart, "back-2-line"))[0][1] - oy,
        y2At: chart._yFunc(80, "y2"),
        band: rect(byKey(chart, "back-0-band")),
        bandAt: [ox + chart._xFunc(new Date(2022, 0, 1)), ox + chart._xFunc(new Date(2022, 5, 1))],
        tip: tip(byKey(chart, "-0-marker")),
        tipAt: [ox + chart._xFunc(new Date(2021, 6, 1)), oy + chart._yFunc(16)],
      };
      `,
      renderer,
    );
    // Date strings parse to their day (within a pixel on a two-year axis).
    near(r.launch, r.launchAt, "the launch line at its date", 1);
    near(r.y2, r.y2At, "the y2 line on the secondary axis");
    near(r.band.x, r.bandAt[0], "the band's start date", 1);
    near(r.band.x + r.band.width, r.bandAt[1], "the band's end date", 1);
    near(r.tip[0], r.tipAt[0], "the callout's date", 1);
    near(r.tip[1], r.tipAt[1], "the callout's value");
  });

  it(`[${renderer}] zoom: callouts, lines, and bands follow the axes`, async () => {
    const r = await page(
      `${series}
      const chart = new d3plus.Plot()
        .data(points).groupBy("id").legend(false).renderer(arg)
        .referenceLines([{y: 50}])
        .referenceBands([{x: [45, 55]}])
        .annotations([{shape: "Callout", data: [{x: 50, y: 50, label: "Mid"}]}]);
      await done(chart);
      const state = () => {
        const [ox, oy] = origin(chart);
        return {
          rule: linePoints(byKey(chart, "back-1-line"))[0][1],
          ruleAt: oy + chart._yFunc(50),
          band: rect(byKey(chart, "back-0-band")),
          bandAt: [ox + chart._xFunc(45), ox + chart._xFunc(55)],
          tip: tip(byKey(chart, "-0-marker")),
          tipAt: [ox + chart._xFunc(50), oy + chart._yFunc(50)],
        };
      };
      const base = state();
      for (let i = 0; i < 2; i++) document.querySelector("#viz .zoom-in").click();
      await frames();
      await new Promise(r => setTimeout(r, 50));
      const zoomed = state();
      return {base, zoomed, zoomedDomain: chart._xAxis._d3Scale.domain().map(Number)};
      `,
      renderer,
    );
    const {base, zoomed} = r;
    assert.ok(
      zoomed.band.width > base.band.width * 2,
      `the band widens with the zoom (${base.band.width} → ${zoomed.band.width})`,
    );
    for (const s of [base, zoomed]) {
      near(s.rule, s.ruleAt, "the line stays at y = 50");
      near(s.band.x, s.bandAt[0], "the band starts at x = 45");
      near(s.band.x + s.band.width, s.bandAt[1], "and ends at x = 55");
      near(s.tip[0], s.tipAt[0], "the callout stays on its point (x)");
      near(s.tip[1], s.tipAt[1], "the callout stays on its point (y)");
    }
  });

  it(`[${renderer}] reference lines and bands widen their axes; explicit domains and callouts do not`, async () => {
    const r = await page(
      `${series}
      const draw = async config => {
        const chart = new d3plus.LinePlot()
          .data(data).groupBy("id").legend(false).renderer(arg).config(config);
        await done(chart);
        const line = byKey(chart, "back-0-line");
        const [, oy] = line ? origin(chart) : [0, 0];
        return {
          y: chart._yAxis._d3Scale.domain().map(Number),
          line: line ? linePoints(line)[0][1] - oy : null,
          lineAt: chart._yFunc(100),
          area: chart._plotArea,
        };
      };
      const time = [];
      for (let i = 0; i < 12; i++) time.push({id: "s", date: new Date(2021, i, 1), value: i});
      const timeChart = new d3plus.LinePlot()
        .data(time).groupBy("id").x("date").time("date").y("value")
        .legend(false).timeline(false).renderer(arg)
        .referenceLines([{x: "2022-06-01", label: "Later"}]);
      await done(timeChart);
      return {
        base: await draw({}),
        above: await draw({referenceLines: [{y: 100, label: "Target"}]}),
        below: await draw({referenceBands: [{y: [0, 10]}]}),
        explicit: await draw({referenceLines: [{y: 100}], yDomain: [0, 90]}),
        callout: await draw({annotations: [{shape: "Callout", data: [{x: 50, y: 150, label: "High"}]}]}),
        time: timeChart._xAxis._d3Scale.domain().map(d => new Date(d).getFullYear()),
      };
      `,
      renderer,
    );
    const max = d => Math.max(...d),
      min = d => Math.min(...d);
    assert.ok(max(r.base.y) < 100, `the data alone stops short (${r.base.y})`);
    assert.ok(
      max(r.above.y) >= 100,
      `a line above the data widens y (${r.above.y})`,
    );
    near(r.above.line, r.above.lineAt, "and is drawn at its value");
    assert.ok(
      r.above.line >= r.above.area.y - 0.5 &&
        r.above.line <= r.above.area.y + r.above.area.height + 0.5,
      "inside the plot",
    );
    assert.ok(
      min(r.below.y) <= 0,
      `a band below the data widens y (${r.below.y})`,
    );
    assert.deepStrictEqual(
      [min(r.explicit.y), max(r.explicit.y)],
      [0, 90],
      "an explicit yDomain is not widened",
    );
    assert.strictEqual(
      r.explicit.line,
      null,
      "so the line out of range is not drawn",
    );
    assert.ok(
      max(r.callout.y) < 150,
      `a callout does not widen y (${r.callout.y})`,
    );
    assert.ok(
      Math.max(...r.time) >= 2022,
      `a date line widens the time axis (${r.time})`,
    );
  });

  it(`[${renderer}] themes: defaults read on light and dark; user styles win`, async () => {
    const r = await page(
      `${series}
      const draw = async (theme, own = {}) => {
        const chart = new d3plus.LinePlot()
          .data(data).groupBy("id").legend(false).renderer(arg).theme(theme)
          .referenceLines([{y: 50, label: "Target", ...own.line}])
          .referenceBands([{x: [20, 40], label: "Band", ...own.band}])
          .annotations([{shape: "Callout", data: [{x: 50, y: 50, label: "Note"}], ...own.callout}]);
        await done(chart);
        const paint = suffix => byKey(chart, suffix).n.paint;
        return {
          theme: {text: chart._theme.text, background: chart._theme.background},
          label: paint("front-0-0-label").fill,
          box: paint("-0-box"),
          connector: paint("-0-connector").stroke,
          line: paint("back-1-line"),
          lineLabel: paint("back-1-label").fill,
          band: paint("back-0-band"),
        };
      };
      return {
        light: await draw("light"),
        dark: await draw("dark"),
        own: await draw("dark", {
          callout: {fill: "navy", stroke: "gold", fontColor: "white", connectorStroke: "lime", strokeOpacity: 1},
          line: {stroke: "red", strokeWidth: 3, dash: "2 2", fontColor: "pink"},
          band: {fill: "teal", fillOpacity: 0.3},
        }),
      };
      `,
      renderer,
    );
    for (const name of ["light", "dark"]) {
      const s = r[name];
      assert.strictEqual(
        s.label,
        s.theme.text,
        `${name}: callout text in the theme's text color`,
      );
      assert.strictEqual(
        s.box.fill,
        s.theme.background,
        `${name}: box in the theme's background`,
      );
      assert.strictEqual(
        s.box.stroke,
        s.theme.text,
        `${name}: a border in the text color`,
      );
      assert.ok(s.box.strokeOpacity < 0.5, `${name}: a subtle border`);
      assert.strictEqual(
        s.connector,
        s.theme.text,
        `${name}: connector in the text color`,
      );
      assert.strictEqual(
        s.line.stroke,
        s.theme.text,
        `${name}: reference line in the text color`,
      );
      assert.strictEqual(
        s.lineLabel,
        s.theme.text,
        `${name}: reference label in the text color`,
      );
      assert.strictEqual(
        s.band.fill,
        s.theme.text,
        `${name}: band in the text color`,
      );
      assert.ok(s.band.fillOpacity < 0.2, `${name}: a translucent band`);
    }
    assert.notStrictEqual(
      r.dark.label,
      r.light.label,
      "dark text differs from light",
    );
    const {own} = r;
    assert.strictEqual(own.box.fill, "navy");
    assert.strictEqual(own.box.stroke, "gold");
    assert.strictEqual(own.box.strokeOpacity, 1);
    assert.strictEqual(own.label, "white");
    assert.strictEqual(own.connector, "lime");
    assert.strictEqual(own.line.stroke, "red");
    assert.strictEqual(own.line.strokeWidth, 3);
    assert.deepStrictEqual(own.line.strokeDasharray, [2, 2]);
    assert.strictEqual(own.lineLabel, "pink");
    assert.strictEqual(own.band.fill, "teal");
    assert.strictEqual(own.band.fillOpacity, 0.3);
  });

  it(`[${renderer}] AreaPlot and a scatter Plot draw callouts and reference lines`, async () => {
    const r = await page(
      `${series}
      const config = groupBy => ({
        groupBy, legend: false,
        referenceLines: [{y: 50, label: "Target"}],
        referenceBands: [{y: [30, 40]}],
        annotations: [{shape: "Callout", data: [{x: 50, y: 50, label: "Here"}]}],
      });
      const out = {};
      for (const [name, make] of [
        ["area", () => new d3plus.AreaPlot().data(data).config(config("id"))],
        ["scatter", () => new d3plus.Plot().shape("Circle").data(points).config(config("id"))],
      ]) {
        const chart = make().renderer(arg);
        await done(chart);
        const [ox, oy] = origin(chart);
        out[name] = {
          rule: linePoints(byKey(chart, "back-1-line"))[0][1] - oy,
          ruleAt: chart._yFunc(50),
          band: rect(byKey(chart, "back-0-band")),
          bandAt: [oy + chart._yFunc(40), oy + chart._yFunc(30)],
          tip: tip(byKey(chart, "-0-marker")),
          tipAt: [ox + chart._xFunc(50), oy + chart._yFunc(50)],
        };
      }
      return out;
      `,
      renderer,
    );
    for (const name of ["area", "scatter"]) {
      const s = r[name];
      near(s.rule, s.ruleAt, `${name}: the line at y = 50`);
      near(s.band.y, s.bandAt[0], `${name}: the band's top at y = 40`);
      near(
        s.band.y + s.band.height,
        s.bandAt[1],
        `${name}: its bottom at y = 30`,
      );
      near(s.tip[0], s.tipAt[0], `${name}: the callout's x`);
      near(s.tip[1], s.tipAt[1], `${name}: the callout's y`);
    }
  });

  it(`[${renderer}] annotations are inert: no keyboard focus, no pick, no tooltip`, async () => {
    const {page: p, errors, close} = await openPage(box);
    try {
      const r = await p.evaluate(
        new Function(
          "arg",
          `return (async () => { ${PRELUDE}
          ${series}
          const chart = new d3plus.Plot()
            .data(points).groupBy("id").legend(false).renderer(arg)
            .referenceLines([{y: 90, label: "Target"}])
            .referenceBands([{x: [10, 30], label: "Band"}])
            .annotations([{shape: "Callout", data: [{x: 70, y: 40, label: "An empty corner"}], dx: 0, dy: 60}]);
          await done(chart);
          window.__chart = chart;
          const entries = annotationEntries(chart);
          const targets = d3plus.focusTargets(chart._sceneRenderer._scene.root.children);
          const b = rect(byKey(chart, "-0-box"));
          const center = [b.x + b.width / 2, b.y + b.height / 2];
          const picked = chart._sceneRenderer.pick(center);
          const host = document.querySelector("#viz svg, #viz canvas").getBoundingClientRect();
          const mark = nodes(chart).find(e => e.n.type === "circle" && e.n.datum && e.n.datum.data && e.n.datum.data.id === "p4");
          return {
            count: entries.length,
            inert: entries.every(e => e.n.interactive === false),
            targets: targets.length,
            annotationTargets: targets.filter(t => String(t.node.key).startsWith("annotation")).length,
            picked: picked && picked.node ? String(picked.node.key) : null,
            point: [host.left + center[0], host.top + center[1]],
            mark: [host.left + mark.x + mark.n.cx, host.top + mark.y + mark.n.cy],
          };
          })()`,
        ),
        renderer,
      );
      assert.ok(r.count > 6, "the annotations are painted");
      assert.ok(r.inert, "every annotation node is marked inert");
      assert.ok(r.targets > 0, "the data marks take keyboard focus");
      assert.strictEqual(r.annotationTargets, 0, "no annotation takes focus");
      assert.ok(
        !r.picked || !r.picked.startsWith("annotation"),
        `the callout box is not hit (${r.picked})`,
      );
      await p.mouse.move(r.point[0] - 6, r.point[1] - 6);
      await p.mouse.move(...r.point, {steps: 3});
      await p.waitForTimeout(150);
      const tips = await p.evaluate(() =>
        Array.from(document.querySelectorAll(".d3plus-tooltip"))
          .filter(el => getComputedStyle(el).opacity !== "0")
          .map(el => el.textContent),
      );
      assert.deepStrictEqual(tips, [], "hovering the callout shows no tooltip");
      // The data beneath an annotation still answers the pointer.
      await p.mouse.move(...r.mark, {steps: 3});
      await p.waitForTimeout(150);
      const markTips = await p.evaluate(() =>
        Array.from(document.querySelectorAll(".d3plus-tooltip"))
          .filter(el => getComputedStyle(el).opacity !== "0")
          .map(el => el.textContent),
      );
      assert.ok(
        markTips.some(t => t.includes("p4")),
        `a point inside the band shows its tooltip (${JSON.stringify(markTips)})`,
      );
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  });
}
