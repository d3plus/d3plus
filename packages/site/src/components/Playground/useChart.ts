import * as core from "@d3plus/core";
import {applyConfig} from "@d3plus/dom";
import type {D3plusConstructor, D3plusInstance} from "@d3plus/dom";
import {useEffect, useRef} from "preact/hooks";

export type Renderer = "svg" | "canvas";

/**
 * Draws a `@d3plus/core` class into the returned element's ref. One instance
 * is reused across config changes so the chart tweens; it is rebuilt when a
 * key is removed (the instance would keep its old value) or the renderer
 * changes (`redraw` then draws the new one).
 */
export function useChart(
  name: string,
  config: Record<string, unknown>,
  renderer: Renderer,
  {onError, redraw}: {onError: (message: string) => void; redraw: () => void},
) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<D3plusInstance | null>(null);
  const keys = useRef<string[]>([]);
  const drawn = useRef<Renderer>(renderer);

  const destroy = () => {
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
      applyConfig(instance.current, host.current, config, {renderer});
      instance.current.render?.();
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
