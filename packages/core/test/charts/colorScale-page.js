import {openPage} from "~test/browser/page.js";
import assert from "~test/browser/assert.js";

/*
    Page helpers shared by the colorScale browser tests: render a chart in a
    fresh page, find a painted node, hover it with the real mouse, and read
    the tooltip.
*/

/**
    Opens a page and renders a chart built by `src` (`lib => viz`) into a
    720×420 #viz, kept as `window.__viz`.
*/
export async function chart(src, renderer) {
  const opened = await openPage(
    `<div id="viz" style="width:720px;height:420px;font-family:sans-serif"></div>`,
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
    The client point at the center of the first painted scene node matching
    `match` (a `node => boolean` source), or `null`.
*/
export function pointOf(page, match) {
  return page.evaluate(match => {
    const test = new Function("node", `return (${match})(node);`);
    const toClient = ([x, y]) => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      if (svg) {
        const m = svg.getScreenCTM();
        return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      }
      const r = document.querySelector("#viz canvas").getBoundingClientRect();
      return [r.left + x, r.top + y];
    };
    const box = node => {
      if (node.type === "rect")
        return [node.x, node.y, node.x + node.width, node.y + node.height];
      if (node.type === "circle")
        return [
          node.cx - node.r,
          node.cy - node.r,
          node.cx + node.r,
          node.cy + node.r,
        ];
      if (node.type === "path") {
        const n = (node.d.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number);
        const xs = n.filter((_, i) => i % 2 === 0);
        const ys = n.filter((_, i) => i % 2 === 1);
        return [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs),
          Math.max(...ys),
        ];
      }
      return null;
    };
    const apply = (chain, [x, y]) =>
      chain.reduceRight(
        ([px, py], t) => [
          px * (t.scale ?? 1) + (t.x ?? 0),
          py * (t.scale ?? 1) + (t.y ?? 0),
        ],
        [x, y],
      );
    let found = null;
    const walk = (node, chain) => {
      if (found) return;
      const next = node.transform ? [...chain, node.transform] : chain;
      if (
        node.type !== "group" &&
        !String(node.key).endsWith("::hit") &&
        node.datum &&
        test(node)
      ) {
        const b = box(node);
        if (b) found = apply(next, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
      }
      (node.children || []).forEach(c => walk(c, next));
    };
    walk(window.__viz._paintedScene.root, []);
    return found && toClient(found);
  }, match);
}

/** Moves the real mouse to `point` and waits for the hover repaint. */
export async function hover(page, point) {
  assert.ok(point, "found the node to hover");
  await page.mouse.move(point[0] - 3, point[1] - 3);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
}

/** The text of the visible tooltip's body rows. */
export const tooltipRows = page =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll(".d3plus-tooltip-tbody tr")).map(tr =>
      Array.from(tr.querySelectorAll("td")).map(td => td.textContent),
    ),
  );
