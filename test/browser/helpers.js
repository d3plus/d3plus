/**
    Helpers for browser tests' page functions. `render` runs a page function
    in the test's own window, so page functions can call these directly.
*/
import {render} from "./render.js";

/**
 * Every node of a scene (a root node or an array of nodes), depth first,
 * each parent before its children.
 * @param {Object|Object[]} scene
 * @returns {Object[]}
 */
export function sceneNodes(scene) {
  const out = [];
  const visit = node => {
    if (!node) return;
    out.push(node);
    (node.children || []).forEach(visit);
  };
  (Array.isArray(scene) ? scene : [scene]).forEach(visit);
  return out;
}

/**
 * The first node of a scene (see `sceneNodes`) that passes `test`.
 * @param {Object|Object[]} scene
 * @param {Function} test
 */
export function findNode(scene, test) {
  return sceneNodes(scene).find(test);
}

/**
 * Builds a chart from `src`, the source of a `(lib, data) => viz` function
 * (`lib` is d3plus), renders it into a 700×450 `#viz` with no transitions,
 * and resolves with `extract(viz)`.
 * @param {String} src
 * @param {Function} extract Called in the page once the chart renders; may
 *   return a Promise.
 * @param {Object} [options]
 * @param {*} [options.data] Passed to the builder as `data`.
 * @param {String} [options.renderer] "svg" or "canvas".
 * @param {String} [options.html] The page's body, holding a `#viz`.
 */
export function probeChart(
  src,
  extract,
  {
    data,
    renderer,
    html = '<div id="viz" style="width:700px;height:450px"></div>',
  } = {},
) {
  return render(
    html,
    ([src, data, renderer]) =>
      new Promise((resolve, reject) => {
        try {
          const viz = new Function(
            "lib",
            "data",
            `return (${src})(lib, data);`,
          )(window.d3plus, data)
            .duration(0)
            .select("#viz");
          if (renderer) viz.renderer(renderer);
          viz.render(async () => {
            try {
              resolve(await extract(viz));
            } catch (e) {
              reject(e);
            }
          });
        } catch (e) {
          reject(e);
        }
      }),
    [src, data, renderer],
  );
}
