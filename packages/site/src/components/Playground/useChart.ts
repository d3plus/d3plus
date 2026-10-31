import * as core from "@d3plus/core";
import {applyConfig} from "@d3plus/dom";
import type {D3plusConstructor, D3plusInstance} from "@d3plus/dom";
import {useEffect, useRef} from "preact/hooks";

import {STAGES} from "./stages.js";

export type Renderer = "svg" | "canvas";

/**
 * The element a class draws into: the host itself for a chart, which makes
 * its own root `<svg>` (or `<canvas>`), or an `<svg>` filling the host for a
 * component or shape, as the framework wrappers give every class.
 */
function target(host: HTMLDivElement, renderer: Renderer | null): Element {
  if (renderer) return host;
  let svg = host.querySelector(":scope > svg.d3p-svg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "d3p-svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    host.append(svg);
  }
  return svg;
}

/**
 * Draws a `@d3plus/core` class into the returned element's ref. One instance
 * is reused across config changes so the chart tweens; it is rebuilt when a
 * key is removed (the instance would keep its old value) or the renderer
 * changes (`redraw` then draws the new one). `renderer` is null for a class
 * drawn in SVG only.
 */
export function useChart(
  name: string,
  config: Record<string, unknown>,
  renderer: Renderer | null,
  {onError, redraw}: {onError: (message: string) => void; redraw: () => void},
) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<D3plusInstance | null>(null);
  const keys = useRef<string[]>([]);
  const drawn = useRef<Renderer | null>(renderer);

  const stage = STAGES[name];

  const destroy = () => {
    if (instance.current && host.current)
      stage?.clear(instance.current, host.current);
    instance.current?.destroy?.();
    instance.current = null;
  };

  useEffect(() => {
    const Chart = (core as unknown as Record<string, D3plusConstructor>)[name];
    if (!host.current || !Chart) return;
    const next = Object.keys(config);
    if (keys.current.some(k => !next.includes(k))) destroy();
    keys.current = next;
    if (!instance.current) instance.current = new Chart();
    try {
      if (stage) stage.draw(instance.current, host.current, config);
      else {
        applyConfig(
          instance.current,
          target(host.current, renderer),
          config,
          renderer ? {renderer} : undefined,
        );
        instance.current.render?.();
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  }, [config]);

  useEffect(() => {
    if (!instance.current || drawn.current === renderer) return;
    drawn.current = renderer;
    destroy();
    redraw();
  }, [renderer]);

  useEffect(() => destroy, []);

  return host;
}
