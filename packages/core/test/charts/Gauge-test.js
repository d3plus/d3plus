import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Gauge renders in Chromium on both backends: the emitted scene (a static
    dial group, then each row's hit area and needle or progress arc), the
    painted labels, several rows sharing one dial, label fitting, the
    tooltip's value row, hover dimming, zoom being off, and Canvas painting +
    picking.
*/

after(async () => {
  await closeBrowser();
});

const bands = [
  {max: 60, color: "#2f9e44"},
  {max: 85, color: "#f59f00"},
  {color: "#e03131"},
];

it("Gauge emits a needle gauge with bands, ticks, and labels", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async b => {
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .data([{id: "Speed", value: 72}])
        .domain([0, 100])
        .bands(b);
      await new Promise(r => viz.render(r));
      const [gauge] = viz._chartScene;
      const kids = gauge.children;
      const dial = kids[0];
      const svg = document.querySelector("#viz svg");
      return {
        sceneLength: viz._chartScene.length,
        gaugeKey: gauge.key,
        kidKeys: kids.map(k => k.key),
        kidTypes: kids.map(k => k.type),
        hitFill: kids[1].paint.fill,
        hitDatum: kids[1].datum && kids[1].datum.id,
        dialHasDatum: "datum" in dial,
        dialInteractive: dial.interactive,
        dialKeys: dial.children.map(k => k.key),
        dialAllStatic: dial.children.every(
          k => k.interactive === false && !k.datum,
        ),
        rotate: kids[2].transform.rotate,
        needleDatum: kids[2].datum.id,
        needleFill: kids[2].paint.fill,
        hubFill: kids[3].paint.fill,
        texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
        nan: [...svg.querySelectorAll("*")].filter(n =>
          [...n.attributes].some(a => a.value.includes("NaN")),
        ).length,
        aria: [...svg.querySelectorAll("[aria-label]")].map(n =>
          n.getAttribute("aria-label"),
        ),
        legend: viz.schema.legend({}, viz._filteredData),
        zoom: viz.zoom(),
        zoomButtons: document.querySelectorAll("#viz .zoom-control").length,
        zoomOptIn: new window.d3plus.Gauge().zoom(true).zoom(),
      };
    },
    bands,
  );
  assert.strictEqual(out.sceneLength, 1, "one dial");
  assert.strictEqual(out.gaugeKey, "gauge");
  assert.deepStrictEqual(
    out.kidTypes,
    ["group", "path", "path", "circle"],
    "dial, hit, needle, hub",
  );
  assert.strictEqual(
    out.kidKeys[1],
    "gauge-Speed-indicator::hit",
    "hit area pairs with the needle",
  );
  assert.strictEqual(out.hitFill, "transparent");
  assert.strictEqual(out.hitDatum, "Speed");
  assert.strictEqual(
    out.dialHasDatum,
    false,
    "the dial is shared, so it never dims",
  );
  assert.strictEqual(out.dialInteractive, false);
  assert.ok(out.dialAllStatic, "dial parts are not hit targets");
  assert.deepStrictEqual(out.dialKeys.slice(0, 6), [
    "gauge-track-0",
    "gauge-band-0",
    "gauge-band-1",
    "gauge-band-2",
    "gauge-minor-ticks",
    "gauge-major-ticks",
  ]);
  assert.ok(
    Math.abs(out.rotate - 52.8) < 1e-6,
    `needle at 52.8° (got ${out.rotate})`,
  );
  assert.strictEqual(out.needleDatum, "Speed");
  assert.ok(/^#|^rgb/.test(out.needleFill), "needle painted from shapeConfig");
  assert.strictEqual(
    out.hubFill,
    out.needleFill,
    "a single needle's hub matches it",
  );
  for (const t of ["0", "20", "40", "60", "80", "100", "72", "Speed"])
    assert.ok(out.texts.includes(t), `renders "${t}"`);
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.ok(out.aria.includes("Speed, 72."), "needle aria label");
  assert.strictEqual(out.legend, false, "no legend for a single row");
  assert.strictEqual(out.zoom, false, "zoom is off by default");
  assert.strictEqual(out.zoomButtons, 0, "no zoom controls");
  assert.strictEqual(out.zoomOptIn, true, "zoom can still be turned on");
});

it("Gauge progress indicator fills an arc and insets the bands", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async b => {
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .data([{id: "CPU", value: 72}])
        .domain([0, 100])
        .bands(b)
        .indicator("progress")
        .valueFormat(v => `${v}%`)
        .tickFormat(v => `${v}°`)
        .axisConfig({
          shapeConfig: {
            fill: "rgb(1, 2, 3)",
            stroke: "rgb(4, 5, 6)",
            labelConfig: {fontColor: "rgb(7, 8, 9)"},
          },
        });
      await new Promise(r => viz.render(r));
      const kids = viz._chartScene[0].children;
      const dial = kids[0].children;
      const track = dial.find(k => k.key === "gauge-track-0");
      const band = dial.find(k => k.key === "gauge-band-0");
      const ticks = dial.find(k => k.key === "gauge-major-ticks");
      const value = dial.find(k => k.key === "gauge-value");
      return {
        types: kids.map(k => k.type),
        arc: kids[2].arc,
        track: track.arc,
        trackFill: track.paint.fill,
        band: band.arc,
        tickStroke: ticks.paint.stroke,
        value: value.lines[0].text,
        valueColor: value.paint.fill,
        tickLabels: dial
          .filter(k => k.type === "text" && k.key.includes("-tick-"))
          .map(k => k.lines[0].text),
      };
    },
    bands,
  );
  assert.deepStrictEqual(
    out.types,
    ["group", "path", "path"],
    "dial, hit, progress arc (no hub)",
  );
  assert.ok(
    Math.abs(out.arc.endAngle - (52.8 * Math.PI) / 180) < 1e-9,
    "arc ends at the value",
  );
  assert.strictEqual(
    out.arc.startAngle,
    out.track.startAngle,
    "arc starts at the minimum",
  );
  assert.strictEqual(
    out.arc.outerRadius,
    out.track.outerRadius,
    "arc fills the track",
  );
  assert.ok(
    out.band.outerRadius < out.track.innerRadius,
    "bands sit inside the track",
  );
  assert.strictEqual(out.trackFill, "rgb(1, 2, 3)");
  assert.strictEqual(out.tickStroke, "rgb(4, 5, 6)");
  assert.strictEqual(out.valueColor, "rgb(7, 8, 9)");
  assert.strictEqual(out.value, "72%", "valueFormat");
  assert.deepStrictEqual(
    out.tickLabels.slice(0, 2),
    ["0°", "20°"],
    "tickFormat",
  );
});

it("Gauge draws one needle per row on a shared dial, clamped to the domain", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async () => {
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .data([
          {id: "North", value: 42},
          {id: "South", value: 77},
          {id: "East", value: 120},
          {id: "West", value: -5},
        ])
        .domain([0, 100]);
      await new Promise(r => viz.render(r));
      const scene = viz._chartScene;
      const kids = scene[0].children;
      const needles = kids.filter(k => k.key.endsWith("-indicator"));
      const hits = kids.filter(k => k.key.endsWith("::hit"));
      const hub = kids[kids.length - 1];
      const svg = document.querySelector("#viz svg");
      return {
        groups: scene.length,
        needleKeys: needles.map(k => k.key),
        rotations: needles.map(k => Math.round(k.transform.rotate)),
        fills: new Set(needles.map(k => k.paint.fill)).size,
        hitRotations: hits.map(k => Math.round(k.transform.rotate)),
        hub: {
          key: hub.key,
          type: hub.type,
          datum: "datum" in hub,
          interactive: hub.interactive,
        },
        labels: kids[0].children.filter(
          k => k.key === "gauge-value" || k.key === "gauge-name",
        ).length,
        texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
        legend: viz.schema.legend({}, viz._filteredData),
      };
    },
  );
  assert.strictEqual(out.groups, 1, "one dial for every row");
  assert.deepStrictEqual(out.needleKeys, [
    "gauge-North-indicator",
    "gauge-South-indicator",
    "gauge-East-indicator",
    "gauge-West-indicator",
  ]);
  assert.deepStrictEqual(
    out.rotations,
    [-19, 65, 120, -120],
    "120 and -5 clamp to the ends",
  );
  assert.strictEqual(out.fills, 4, "each needle takes its row's color");
  assert.deepStrictEqual(
    out.hitRotations,
    out.rotations,
    "each needle has its own hit area",
  );
  assert.deepStrictEqual(
    out.hub,
    {key: "gauge-hub", type: "circle", datum: false, interactive: false},
    "one shared, neutral hub",
  );
  assert.strictEqual(out.labels, 0, "no value or name label with several rows");
  assert.ok(out.texts.includes("North"), "the legend names the needles");
  assert.notStrictEqual(out.legend, false, "legend shows for several rows");
});

it("Gauge draws one concentric progress track per row", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async b => {
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .indicator("progress")
        .bands(b)
        .data([
          {id: "Memory", value: 48},
          {id: "CPU", value: 72},
          {id: "Disk", value: 91},
        ])
        .domain([0, 100]);
      await new Promise(r => viz.render(r));
      const kids = viz._chartScene[0].children;
      const tracks = kids[0].children
        .filter(k => k.key.startsWith("gauge-track-"))
        .map(k => k.arc);
      const arcs = kids
        .filter(k => k.key.endsWith("-indicator"))
        .map(k => k.arc);
      const hits = kids.filter(k => k.key.endsWith("::hit")).map(k => k.d);
      const band = kids[0].children.find(k => k.key === "gauge-band-0").arc;
      return {tracks, arcs, hitCount: hits.length, band};
    },
    bands,
  );
  assert.strictEqual(out.tracks.length, 3, "one track per row");
  for (let i = 0; i < 3; i++) {
    assert.strictEqual(
      out.arcs[i].outerRadius,
      out.tracks[i].outerRadius,
      `row ${i} fills its own track`,
    );
    assert.strictEqual(out.arcs[i].innerRadius, out.tracks[i].innerRadius);
    if (i)
      assert.ok(
        out.tracks[i].outerRadius < out.tracks[i - 1].innerRadius,
        "tracks step inward",
      );
  }
  assert.deepStrictEqual(
    out.arcs.map(a => Math.round((a.endAngle * 180) / Math.PI)),
    [-5, 53, 98],
    "each arc ends at its row's value",
  );
  assert.strictEqual(out.hitCount, 3);
  assert.ok(
    out.band.outerRadius < out.tracks[2].innerRadius,
    "bands sit inside the innermost track",
  );
});

it("Gauge fits a long name and exposes a tooltip value row", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    async () => {
      const longName =
        "A very long region name that cannot possibly fit under the dial, however small the font gets";
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .data([{id: longName, value: 30}]);
      await new Promise(r => viz.render(r));
      const dial = viz._chartScene[0].children[0].children;
      const name = dial.find(k => k.key === "gauge-name");
      const value = dial.find(k => k.key === "gauge-value");
      const track = dial.find(k => k.key === "gauge-track-0").arc;
      const tooltip = viz.schema.tooltipConfig.tbody[0];
      return {
        text: name.lines[0].text,
        width: name.lines[0].width,
        size: name.font.size,
        valueSize: value.font.size,
        outer: track.outerRadius,
        header: tooltip[0](),
        value: tooltip[1]({id: "x", value: 120}, 0),
        missing: tooltip[1]({id: "x"}, 0),
      };
    },
  );
  assert.ok(out.text.endsWith("…"), `long name is truncated (${out.text})`);
  assert.ok(
    out.size <= 9,
    "long name shrinks to the minimum before truncating",
  );
  assert.ok(out.width <= out.outer * 1.2 + 0.5, "long name fits its width");
  assert.ok(out.valueSize > out.size, "the value stays prominent");
  assert.strictEqual(out.header, "Value");
  assert.strictEqual(out.value, "120");
  assert.strictEqual(out.missing, "", "no value, no tooltip value");
});

it("Gauge dims the other rows' needles on hover, not the dial", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:600px;height:300px'></div>",
    async () => {
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .data([
          {id: "North", value: 42},
          {id: "South", value: 77},
        ]);
      await new Promise(r => viz.render(r));
      viz.hover(d => d.id === "North");
      await new Promise(r => setTimeout(r, 50));
      const opacity = key => {
        const el = document.querySelector(`#viz [data-key='${key}']`);
        return el && el.getAttribute("opacity");
      };
      return {
        dial: opacity("gauge-dial"),
        hub: opacity("gauge-hub"),
        southNeedle: opacity("gauge-South-indicator"),
        northNeedle: opacity("gauge-North-indicator"),
      };
    },
  );
  assert.ok(
    !out.dial || Number(out.dial) === 1,
    "the shared dial stays opaque",
  );
  assert.ok(!out.hub || Number(out.hub) === 1, "the shared hub stays opaque");
  assert.strictEqual(Number(out.southNeedle), 0.5, "other needle dims");
  assert.ok(
    !out.northNeedle || Number(out.northNeedle) === 1,
    "hovered needle stays opaque",
  );
});

it("Gauge paints on Canvas and picks the row under the pointer", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async () => {
      const viz = new window.d3plus.Gauge()
        .select("#viz")
        .duration(0)
        .renderer("canvas")
        .data([{id: "Canvas", value: 55}])
        .domain([0, 100])
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

      // Click the middle of the track at 12 o'clock — a static part of the
      // dial, so the pick lands on the row's hit area.
      const g = viz._chartScene[0];
      const track = g.children[0].children[0].arc;
      const x = viz._chartTransform.x + g.transform.x;
      const y =
        viz._chartTransform.y +
        g.transform.y -
        (track.innerRadius + track.outerRadius) / 2;
      const rect = canvas.getBoundingClientRect();
      window.__clicked = undefined;
      canvas.dispatchEvent(
        new MouseEvent("click", {
          clientX: rect.left + x,
          clientY: rect.top + y,
          bubbles: true,
        }),
      );
      return {
        hasCanvas: true,
        colors: colors.size,
        clicked: window.__clicked && window.__clicked.id,
      };
    },
  );
  assert.ok(out.hasCanvas, "a <canvas> is mounted");
  assert.ok(out.colors >= 3, `canvas paints the dial (${out.colors} colors)`);
  assert.strictEqual(out.clicked, "Canvas", "clicking the dial picks its row");
});
