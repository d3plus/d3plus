import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Polar category labels follow the hover: a PolarArea's or circular
    RadialBar's slot names, a RadialMatrix's column names, and a Radar's
    metric names keep full opacity for the hovered marks and dim with the
    rest, curved or straight.
*/

/** Each label's text and opacity under the group keyed `group`. */
const labelOpacity = group => {
  const out = {};
  const walk = (node, inside) => {
    const here = inside || node.key === group;
    if (node.type === "text" && here)
      out[node.lines.map(l => l.text).join(" ")] = node.paint?.opacity ?? 1;
    (node.children || []).forEach(c => walk(c, here));
  };
  const scene = window.__viz.toScene();
  (scene.root ? [scene.root] : scene.children).forEach(n => walk(n));
  return out;
};

const months = ["Jan", "Feb", "Mar", "Apr"];
const rose = ["Disease", "Wounds"].flatMap(cause =>
  months.map((month, m) => ({cause, month, deaths: 10 + m * 5})),
);

const polarProbe = async ([data, position, src]) => {
  const viz = new window.d3plus.PolarArea()
    .select("#viz")
    .duration(0)
    .data(data)
    .groupBy("cause")
    .metric("month")
    .value("deaths")
    .legend(false)
    .labelPosition(position);
  await new Promise(r => viz.render(r));
  window.__viz = viz;
  const probe = () => new Function(`return (${src})("polararea-labels")`)();
  const before = probe();
  viz.hover(d => d.month === "Feb");
  const month = probe();
  viz.hover(d => d.cause === "Disease");
  const group = probe();
  viz.hover(false);
  return {before, month, group, after: probe()};
};

const box = "<div id='viz' style='width:600px;height:500px'></div>";

for (const position of ["auto", "inside"])
  it(`PolarArea keeps the hovered slot's ${position === "auto" ? "curved" : "straight"} name bright`, async function () {
    const out = await render(box, polarProbe, [
      rose,
      position,
      labelOpacity.toString(),
    ]);
    assert.deepStrictEqual(
      Object.keys(out.before).sort(),
      months.slice().sort(),
    );
    for (const m of months) {
      assert.strictEqual(out.before[m], 1, `${m} before`);
      assert.strictEqual(out.month[m], m === "Feb" ? 1 : 0.5, `${m} on Feb`);
      assert.strictEqual(out.group[m], 1, `${m}: every slot holds Disease`);
      assert.strictEqual(out.after[m], 1, `${m} after`);
    }
  });

it("a circular RadialBar keeps the hovered bar's name bright", async function () {
  const out = await render(
    box,
    async src => {
      const viz = new window.d3plus.RadialBar()
        .select("#viz")
        .duration(0)
        .discrete("angle")
        .data([
          {id: "Chrome", value: 64},
          {id: "Safari", value: 20},
          {id: "Firefox", value: 15},
        ]);
      await new Promise(r => viz.render(r));
      window.__viz = viz;
      viz.hover(d => d.id === "Safari");
      return new Function(`return (${src})("radialbar-labels")`)();
    },
    labelOpacity.toString(),
  );
  assert.deepStrictEqual(out, {Chrome: 0.5, Safari: 1, Firefox: 0.5});
});

it("RadialMatrix keeps the hovered cell's column name bright", async function () {
  const columns = ["Mon", "Tue", "Wed"];
  const out = await render(
    box,
    async ([cols, src]) => {
      const viz = new window.d3plus.RadialMatrix()
        .select("#viz")
        .duration(0)
        .groupBy(["row", "column"])
        .data(
          ["AM", "PM"].flatMap(row =>
            cols.map((column, c) => ({row, column, value: c})),
          ),
        );
      await new Promise(r => viz.render(r));
      window.__viz = viz;
      const probe = () =>
        new Function(`return (${src})("radialmatrix-columns")`)();
      const cell = viz._filteredData.find(
        d => d.row === "AM" && d.column === "Tue",
      );
      viz.schema.on["mousemove.shape"](
        cell,
        0,
        cell,
        new MouseEvent("mousemove"),
      );
      const crosshair = probe();
      viz.hover(d => d.column === "Wed");
      return {crosshair, column: probe()};
    },
    [columns, labelOpacity.toString()],
  );
  assert.deepStrictEqual(out.crosshair, {Mon: 0.5, Tue: 1, Wed: 0.5});
  assert.deepStrictEqual(out.column, {Mon: 0.5, Tue: 0.5, Wed: 1});
});

for (const position of ["auto", "inside"])
  it(`Radar keeps the ${position === "auto" ? "curved" : "straight"} names of the hovered polygon's metrics bright`, async function () {
    const out = await render(
      box,
      async ([pos, src]) => {
        const viz = new window.d3plus.Radar()
          .select("#viz")
          .duration(0)
          .labelPosition(pos)
          .groupBy("id")
          .metric("axis")
          .value("value")
          .data([
            {id: "A", axis: "Speed", value: 3},
            {id: "A", axis: "Power", value: 5},
            {id: "A", axis: "Range", value: 2},
            {id: "B", axis: "Speed", value: 4},
            {id: "B", axis: "Power", value: 2},
          ]);
        await new Promise(r => viz.render(r));
        window.__viz = viz;
        const probe = () =>
          new Function(`return (${src})("radar-axis-labels")`)();
        viz.hover(d => d.id === "A");
        const a = probe();
        viz.hover(d => d.id === "B");
        return {a, b: probe()};
      },
      [position, labelOpacity.toString()],
    );
    assert.deepStrictEqual(out.a, {Speed: 1, Power: 1, Range: 1});
    assert.deepStrictEqual(
      out.b,
      {Speed: 1, Power: 1, Range: 0.5},
      "B has no Range",
    );
  });
