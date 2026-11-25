/**
    Shared steps for the draggable reference annotation browser tests: a
    page with one chart, its events logged, and readers for its handles,
    reference lines, labels, grips, and marks.
*/
import assert from "~test/browser/assert.js";

export const box = "<div id='viz' style='width:640px;height:400px'></div>";

/** Runs in the page: draws a chart of `type` with `config`, logging its drag events. */
export const start = ([type, json, renderer]) => {
  window.__drawn = false;
  window.__events = [];
  window.__clicks = 0;
  const viz = new window.d3plus[type]()
    .select("#viz")
    .renderer(renderer)
    .duration(0)
    .legend(false)
    .config(JSON.parse(json))
    .on("click.shape", () => window.__clicks++);
  for (const what of ["referenceLine", "referenceBand", "quadrants"])
    for (const kind of ["drag", "end"])
      viz.on(`${kind}.${what}`, (value, entry, index, event, series) => {
        if (series !== undefined) window.__seriesEvents = series;
        window.__events.push({
          kind,
          what,
          value: value instanceof Date ? +value : value,
          id: entry.id,
          index,
        });
      });
  window.__viz = viz.render(() => (window.__drawn = true));
  return true;
};

/** Waits until the chart has drawn. */
export async function painted(page) {
  for (let i = 0; i < 100 && !(await page.evaluate(() => window.__drawn)); i++)
    await page.waitForTimeout(16);
  assert.ok(await page.evaluate(() => window.__drawn), "drawn");
  await page.waitForTimeout(32);
}

/** Runs in the page: the handles, reference lines, labels, grips, bar fills, and point fills. */
export const state = () => {
  const viz = window.__viz;
  const handles = [...document.querySelectorAll(".d3plus-reference-drag")].map(
    el => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        focused: document.activeElement === el,
        now: el.getAttribute("aria-valuenow"),
        text: el.getAttribute("aria-valuetext"),
        label: el.getAttribute("aria-label"),
        max: el.getAttribute("aria-valuemax"),
      };
    },
  );
  const lines = [];
  const texts = [];
  const bars = {};
  const fills = {};
  let grips = 0;
  const walk = (n, inAnnotation) => {
    const key = String(n.key);
    const annotation = inAnnotation || key.includes("annotation-");
    if (key.endsWith("-grip")) grips++;
    if (annotation && n.type === "line" && !key.includes("-ridge-"))
      lines.push({
        x: n.points[0][0],
        y: n.points[0][1],
        width: n.paint.strokeWidth,
      });
    if (annotation && n.type === "text")
      texts.push(...n.lines.map(l => l.text));
    const d = n.datum && (n.datum.data || n.datum);
    if (n.type === "rect" && d && d.month && !key.endsWith("::hit"))
      bars[d.month] = n.paint.fill;
    if (n.type === "circle" && d && d.id) fills[d.id] = n.paint.fill;
    (n.children || []).forEach(c => walk(c, annotation));
  };
  walk(viz._paintedScene.root, false);
  return {
    handles,
    lines,
    texts,
    bars,
    fills,
    grips,
    value:
      typeof viz.referenceLines === "function"
        ? (viz.referenceLines()[0] || {}).y
        : undefined,
    events: window.__events,
    clicks: window.__clicks,
  };
};

/** Runs in the page: pixels per unit on the y axis. */
export const yUnit = () => {
  const y = window.__viz._yAxis;
  return Math.abs(y._getPosition(0) - y._getPosition(1));
};

/** Presses at `[x, y]` and moves `dx`, `dy` in `steps`, leaving the button down. */
export async function press(page, [x, y], [dx, dy], steps = 6) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dx * i) / steps, y + (dy * i) / steps);
    await page.waitForTimeout(20);
  }
}

/** Drags from `[x, y]` by `dy` (or `[dx, dy]`) and lets go. */
export async function drag(page, at, by, steps = 6) {
  await press(page, at, Array.isArray(by) ? by : [0, by], steps);
  await page.mouse.up();
  await page.waitForTimeout(60);
}

/** Focuses handle `i` and presses and lets go of `key`. */
export const key = (page, name, i = 0) =>
  page.evaluate(
    ([k, n]) => {
      const el = document.querySelectorAll(".d3plus-reference-drag")[n];
      el.focus();
      for (const type of ["keydown", "keyup"])
        el.dispatchEvent(
          new KeyboardEvent(type, {key: k, bubbles: true, cancelable: true}),
        );
    },
    [name, i],
  );
