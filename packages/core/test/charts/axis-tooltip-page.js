import {openPage} from "~test/browser/page.js";

/*
    Page helpers shared by the axis tooltip browser tests: render a chart in
    a fresh page, find an axis label's painted text, hover it with the real
    mouse, and read the tooltip.
*/

/**
    Opens a page and renders a chart built by `src` (`lib => viz`) into a
    #viz of `size`, kept as `window.__viz`.
*/
export async function chart(src, renderer, size = [600, 400]) {
  const opened = await openPage(
    `<div id="viz" style="width:${size[0]}px;height:${size[1]}px;font-family:sans-serif"></div>`,
  );
  await opened.page.evaluate(
    ([src, renderer]) =>
      new Promise(resolve => {
        const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [src, renderer],
  );
  return opened;
}

/**
    The client point at the middle of the first painted node matching `match`
    (a `(node, drawn) => boolean` source, `drawn` being a text node's lines
    joined): the middle of a text node's first line, a rect's center, or the
    point halfway between a line's ends. `null` when nothing matches.
*/
export function nodePoint(page, match) {
  return page.evaluate(match => {
    const test = new Function(
      "node",
      "drawn",
      `return (${match})(node, drawn);`,
    );
    const multiply = (m, n) => [
      m[0] * n[0] + m[2] * n[1],
      m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3],
      m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4],
      m[1] * n[4] + m[3] * n[5] + m[5],
    ];
    const matrix = tr => {
      let m = [1, 0, 0, 1, tr.x ?? 0, tr.y ?? 0];
      if (tr.scale !== undefined)
        m = multiply(m, [tr.scale, 0, 0, tr.scale, 0, 0]);
      if (tr.rotate) {
        const rad = (tr.rotate * Math.PI) / 180;
        const rot = [
          Math.cos(rad),
          Math.sin(rad),
          -Math.sin(rad),
          Math.cos(rad),
          0,
          0,
        ];
        const [ax, ay] = tr.rotateAnchor || [0, 0];
        m = multiply(
          m,
          multiply([1, 0, 0, 1, ax, ay], multiply(rot, [1, 0, 0, 1, -ax, -ay])),
        );
      }
      return m;
    };
    let found = null;
    const walk = (node, m) => {
      if (found) return;
      const next = node.transform ? multiply(m, matrix(node.transform)) : m;
      const at = (x, y) => [
        next[0] * x + next[2] * y + next[4],
        next[1] * x + next[3] * y + next[5],
      ];
      if (node.type === "text" && node.lines.length) {
        const drawn = node.lines.map(l => l.text).join(" ");
        if (test(node, drawn)) {
          const line = node.lines[0];
          const anchor = node.font?.anchor;
          const left =
            anchor === "middle"
              ? line.x - line.width / 2
              : anchor === "end"
                ? line.x - line.width
                : line.x;
          found = at(
            left + line.width / 2,
            line.y - (node.font?.size ?? 12) * 0.35,
          );
        }
      } else if (node.type === "rect" && test(node, "")) {
        found = at(node.x + node.width / 2, node.y + node.height / 2);
      } else if (node.type === "line" && test(node, "")) {
        const [a, b] = [node.points[0], node.points.at(-1)];
        found = at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      }
      (node.children || []).forEach(c => walk(c, next));
    };
    walk(window.__viz._paintedScene.root, [1, 0, 0, 1, 0, 0]);
    if (!found) return null;
    const svg = document.querySelector("#viz svg.d3plus-render-svg");
    if (svg) {
      const m = svg.getScreenCTM();
      return [
        m.a * found[0] + m.c * found[1] + m.e,
        m.b * found[0] + m.d * found[1] + m.f,
      ];
    }
    const r = document.querySelector("#viz canvas").getBoundingClientRect();
    return [r.left + found[0], r.top + found[1]];
  }, match);
}

/** The matcher for an axis's title. */
export const title = `node => node.axisTooltip ? node.axisTooltip.part === "title" : false`;

/** The matcher for the text node drawing exactly, or starting with, `text`. */
export const label = text =>
  `(node, drawn) => drawn === ${JSON.stringify(text)} || drawn.startsWith(${JSON.stringify(text)})`;

/** The matcher for the tick label, with a tooltip, drawing exactly `text`. */
export const tickLabel = text =>
  `(node, drawn) => !!node.axisTooltip && node.axisTooltip.part === "tick" && drawn === ${JSON.stringify(text)}`;

/** The matcher for the bar drawn for the data point with `id`. */
export const bar = id =>
  `node => node.type === "rect" && String(node.key).startsWith(${JSON.stringify(`${id}_`)}) && !String(node.key).endsWith("::hit")`;

/** The matcher for the rect keyed exactly `key`. */
export const shape = key =>
  `node => node.type === "rect" && node.key === ${JSON.stringify(key)}`;

/** The matcher for the bar a Gantt draws for the task with `id`. */
export const task = id => shape(`gantt-task-${id}`);

/** The matcher for the grid line a Gantt's axis draws at `date` (a `Date` source). */
export const gridLine = date =>
  `node => node.type === "line" && String(node.key).startsWith("grid-") && Math.abs(window.__viz.ctx.gantt.column + node.points[0][0] - window.__viz.ctx.gantt.x(${date})) < 1`;

/** Moves the real mouse onto `point` and waits for the hover repaint. */
export async function hover(page, point) {
  await page.mouse.move(point[0] - 2, point[1] - 2);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
}

/** The visible tooltip's title, body, table rows and background, or `null` when none shows. */
export const tooltip = page =>
  page.evaluate(() => {
    const tip = document.querySelector(".d3plus-tooltip");
    if (!tip || getComputedStyle(tip).display === "none") return null;
    const text = cls => {
      const el = tip.querySelector(cls);
      return el && getComputedStyle(el).display !== "none"
        ? el.textContent
        : "";
    };
    return {
      title: text(".d3plus-tooltip-title"),
      body: text(".d3plus-tooltip-body"),
      rows: Array.from(tip.querySelectorAll(".d3plus-tooltip-tbody tr")).map(
        tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
      ),
      background: getComputedStyle(tip).backgroundColor,
    };
  });
