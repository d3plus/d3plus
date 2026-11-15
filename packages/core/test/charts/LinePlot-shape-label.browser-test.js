import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    A LinePlot's `shapeConfig.Line.label` names its line labels, in a real
    browser on both renderers: along the lines (the default), at their ends,
    or not at all, and a line `lineLabels` leaves unlabeled draws no label.
*/

const data = ["A", "B", "C"].flatMap((id, k) =>
  [1, 2, 3, 4].map(x => ({id, x, y: x * (k + 1) + k * 3})),
);

/** Every text the chart painted, keyed by its scene key, plus any draw error. */
const texts = viz => {
  const out = [];
  const walk = n => {
    if (n.type === "text")
      out.push({
        key: `${n.key}`,
        text: (n.lines || []).map(l => l.text).join(" "),
      });
    (n.children || []).forEach(walk);
  };
  const scene = viz._paintedScene;
  if (scene) walk(scene.root || scene);
  return out;
};

/** Draws a LinePlot with `config` and returns its painted texts. */
async function draw(config, renderer, rows = data) {
  const out = await probeChart(
    `(lib, data) => {
      const errors = [];
      const error = console.error;
      console.error = (...args) => errors.push(args.map(String).join(" "));
      const viz = new lib.LinePlot()
        .data(data)
        .groupBy("id")
        .x("x")
        .y("y")
        .config(${config});
      const render = viz.render.bind(viz);
      viz.render = cb => render(() => {
        console.error = error;
        window.__drawErrors = errors;
        return cb();
      });
      return viz;
    }`,
    viz => ({texts: texts(viz), errors: window.__drawErrors}),
    {data: rows, renderer},
  );
  assert.deepStrictEqual(out.errors, [], "draws without an error");
  return out.texts;
}

const along = list => list.filter(t => t.key.startsWith("line-label-along-"));
// End labels are keyed by the series id and label index.
const ends = list => list.filter(t => /^[ABC]_\d+$/.test(t.key));

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot ${renderer} — a Line label function names the labels along the lines`, async () => {
    const out = await draw(
      `{shapeConfig: {Line: {label: d => d.id + "!"}}}`,
      renderer,
    );
    assert.ok(along(out).length > 0, "labels run along the lines");
    for (const t of along(out)) assert.match(t.text, /^[ABC]!$/);
  });

  it(`LinePlot ${renderer} — a constant Line label draws`, async () => {
    const out = await draw(
      `{shapeConfig: {Line: {label: "Series"}}}`,
      renderer,
    );
    // Each series gets its own label, though they share the text.
    assert.deepStrictEqual(
      along(out)
        .map(t => t.key)
        .sort(),
      ["line-label-along-A", "line-label-along-B", "line-label-along-C"],
    );
    for (const t of along(out)) assert.strictEqual(t.text, "Series");
  });

  it(`LinePlot ${renderer} — a series drawn as several lines is named once`, async () => {
    // B misses a value, so a dashed bridge draws across its gap as a line of its own.
    const gapped = data.map(d =>
      d.id === "B" && d.x === 2 ? {...d, y: null} : d,
    );
    const out = await draw(
      `{connectGaps: "dashed", shapeConfig: {Line: {label: d => d.id + "!"}}}`,
      renderer,
      gapped,
    );
    assert.deepStrictEqual(
      along(out)
        .map(t => t.text)
        .sort(),
      ["A!", "B!", "C!"],
    );
  });

  it(`LinePlot ${renderer} — a Line label names the labels at the lines' ends`, async () => {
    const out = await draw(
      `{lineLabels: "both", shapeConfig: {Line: {label: d => d.id + "!"}}}`,
      renderer,
    );
    const labels = ends(out);
    assert.strictEqual(labels.length, 6, "each line is named at both ends");
    for (const t of labels) assert.match(t.text, /^[ABC]!$/);
  });

  it(`LinePlot ${renderer} — a line lineLabels skips takes no Line label`, async () => {
    const out = await draw(
      `{lineLabels: d => d.id === "A", shapeConfig: {Line: {label: "Hi"}}}`,
      renderer,
    );
    assert.deepStrictEqual(
      ends(out).map(t => t.text),
      ["Hi"],
      "only line A is labeled",
    );
  });

  it(`LinePlot ${renderer} — a Line label of false leaves the lines unlabeled`, async () => {
    for (const lineLabels of ["true", `"along"`]) {
      const out = await draw(
        `{lineLabels: ${lineLabels}, shapeConfig: {Line: {label: false}}}`,
        renderer,
      );
      assert.strictEqual(ends(out).length + along(out).length, 0);
    }
  });
}
