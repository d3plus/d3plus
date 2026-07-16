import {applyConfig, hash} from "@d3plus/dom";
import type {D3plusConstructor, D3plusInstance} from "@d3plus/dom";
import type {Action} from "svelte/action";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Parameters for the {@link d3plus} Svelte action. */
export interface D3plusActionParams {
  /** The d3plus visualization class to instantiate. */
  constructor: D3plusConstructor;
  /** Config forwarded to the instance's `.config()` method. */
  config?: Record<string, unknown>;
  /** Config merged ahead of `config` — a shared/global baseline. */
  globalConfig?: Record<string, unknown>;
  /** A function invoked at the end of each render cycle. */
  callback?: () => void;
  /** Re-render on every update even when the merged config is unchanged. */
  forceUpdate?: boolean;
}

/**
    Svelte action that renders a d3plus visualization into an `<svg>` created
    inside the host node. A single instance is reused across parameter updates
    so the chart tweens between states, and is destroyed when the node unmounts.
    Swapping the `constructor` rebuilds from scratch.

    ```svelte
    <script>
      import {d3plus} from "@d3plus/svelte";
      import {Treemap} from "@d3plus/core";
      let config = {data, groupBy: "id", sum: "value"};
    </script>

    <div use:d3plus={{constructor: Treemap, config}} style="height: 400px"></div>
    ```
*/
export const d3plus: Action<HTMLElement, D3plusActionParams> = (node, params) => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  node.appendChild(svg);

  let instance: D3plusInstance | null = null;
  let lastHash: string | null = null;
  let current = params;

  /** Applies the params' config to the (reused) instance and renders it. */
  function render(p: D3plusActionParams): void {
    const {constructor: Ctor, config, globalConfig, callback, forceUpdate} = p;
    if (!Ctor) return;
    const h = hash([globalConfig, config]);
    if (!forceUpdate && instance && h === lastHash) return;
    lastHash = h;
    if (!instance) instance = new Ctor();
    applyConfig(instance, svg, globalConfig, config);
    instance.render?.(callback);
  }

  render(current);

  return {
    update(next: D3plusActionParams): void {
      // A different visualization class can't reuse the existing instance —
      // dispose it so the new class starts clean.
      if (instance && next.constructor !== current.constructor) {
        instance.destroy?.();
        instance = null;
        lastHash = null;
      }
      current = next;
      render(current);
    },
    destroy(): void {
      instance?.destroy?.();
      instance = null;
      svg.remove();
    },
  };
};
