import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

// Charts that emit their labels as scene data (rather than through a Shape)
// must still honor the user's label config: `fontFamily()`, and
// `shapeConfig.labelConfig` including per-datum accessors.
after(async () => {
  await closeBrowser();
});

const CHARTS = ["Treemap", "Pie", "Donut", "Tree", "Network", "Rings", "Chord", "Priestley"];

it("emitted chart labels honor fontFamily and shapeConfig.labelConfig", async function () {
  this.timeout(120000);

  const out = await render(
    '<div id="s" style="width:600px;height:400px;"></div>',
    async charts => {
      const flat = [
        {id: "alpha", value: 10},
        {id: "beta", value: 20},
        {id: "gamma", value: 15},
      ];
      const links = [
        {source: "alpha", target: "beta", value: 3},
        {source: "beta", target: "gamma", value: 2},
        {source: "gamma", target: "alpha", value: 4},
      ];
      const setup = {
        Treemap: v => v.data(flat),
        Pie: v => v.data(flat),
        Donut: v => v.data(flat),
        Tree: v =>
          v
            .data([
              {p: "A", id: "alpha"},
              {p: "A", id: "beta"},
              {p: "B", id: "gamma"},
            ])
            .groupBy(["p", "id"]),
        Network: v =>
          v
            .nodes([
              {id: "alpha", x: 0, y: 0},
              {id: "beta", x: 10, y: 5},
              {id: "gamma", x: 5, y: 10},
            ])
            .links(links),
        Rings: v => v.links(links).center("alpha"),
        Chord: v => v.links(links).value("value"),
        Priestley: v =>
          v.data([
            {id: "alpha", start: 1, end: 5},
            {id: "beta", start: 3, end: 8},
          ]),
      };
      // Chart-body text only: skips the legend, title, and other chrome.
      const labels = () =>
        [...document.querySelectorAll("#s svg text")].filter(t => {
          for (let n = t.parentElement; n && n.tagName !== "svg"; n = n.parentElement)
            if ((n.getAttribute("data-key") || n.id || "").includes("viz-chart-body"))
              return true;
          return false;
        });
      const draw = async (name, configure) => {
        document.querySelector("#s").innerHTML = "";
        const viz = setup[name](new window.d3plus[name]().select("#s").duration(0));
        configure(viz);
        await new Promise(resolve => viz.render(resolve));
        return labels();
      };

      const results = {};
      for (const name of charts) {
        // A generic family, so the result doesn't depend on installed fonts
        // (TextBox only uses a family that fontExists finds on the machine).
        const family = await draw(name, v => v.fontFamily("monospace"));
        const styled = await draw(name, v =>
          v.shapeConfig({
            labelConfig: {
              fontColor: d => (d && d.id === "alpha" ? "rgb(1, 1, 1)" : "rgb(2, 2, 2)"),
              fontWeight: 700,
            },
          }),
        );
        const alpha = styled.find(t => t.textContent === "alpha");
        results[name] = {
          count: family.length,
          families: [...new Set(family.map(t => t.getAttribute("font-family")))],
          weights: [...new Set(styled.map(t => t.getAttribute("font-weight")))],
          alphaFill: alpha && alpha.getAttribute("fill"),
        };
      }
      return results;
    },
    CHARTS,
  );

  for (const name of CHARTS) {
    const r = out[name];
    assert.ok(r.count > 0, `${name}: draws labels`);
    // Priestley's time axis is chart-body text too; it takes fontFamily but
    // not shapeConfig, so only the family is asserted across all of it.
    assert.deepStrictEqual(r.families, ["monospace"], `${name}: fontFamily()`);
    assert.ok(r.weights.includes("700"), `${name}: labelConfig.fontWeight`);
  }
  // A per-datum fontColor accessor receives the source row. Rings colors its
  // outer labels against the background itself, so it's excluded.
  for (const name of CHARTS.filter(c => c !== "Rings"))
    assert.strictEqual(out[name].alphaFill, "rgb(1, 1, 1)", `${name}: fontColor accessor`);
});

it("emitted chart labels keep the chart's own label colors by default", async function () {
  this.timeout(60000);

  const out = await render('<div id="s" style="width:600px;height:400px;"></div>', async () => {
    const viz = new window.d3plus.Chord()
      .select("#s")
      .duration(0)
      .links([
        {source: "alpha", target: "beta", value: 3},
        {source: "beta", target: "alpha", value: 2},
      ])
      .value("value");
    await new Promise(resolve => viz.render(resolve));
    const alpha = [...document.querySelectorAll("#s svg text")].find(
      t => t.textContent === "alpha",
    );
    return alpha.getAttribute("fill");
  });

  // Chord labels sit outside their arcs on the page background, so they must
  // not take the Viz's generic fill-contrast color (which would be white-ish
  // against dark arcs).
  assert.strictEqual(out, "black");
});
