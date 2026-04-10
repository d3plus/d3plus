import {useContext, useEffect, useRef, useState} from "react";
import {assign} from "@d3plus/dom";
import type {D3plusConfig} from "@d3plus/core";

import D3plusContext from "./D3plusContext.jsx";

export type {D3plusConfig} from "@d3plus/core";

/** Minimal interface for d3plus class instances used by the Renderer. */
interface D3plusInstance {
  config(c: D3plusConfig): this;
  render?(callback?: () => void): this;
  destroy?(): this;
  [key: string]: unknown;
}

/** Constructor type for d3plus visualization classes. */
export type D3plusConstructor = new (...args: any[]) => any;

/** Props accepted by the Renderer component. */
export interface RendererProps {
  /** An object containing method/value pairs to be passed to the visualization's .config() method. */
  config?: D3plusConfig;
  /** The class attribute value used for the root/wrapper <div> element. */
  className?: string;
  /** A function to be invoked at the end of each render cycle (passed directly to the render method). */
  callback?: () => void;
  /** When true, the visualization re-renders on every React render cycle instead of only when config changes. */
  forceUpdate?: boolean;
  /** The d3plus visualization class to instantiate. */
  constructor: D3plusConstructor;
}

/**
    Stable hash that serializes functions by source, so function-valued config
    props trigger re-renders when they change.
    @private
*/
function hash(val: unknown): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(val, (_, v) => {
      if (typeof v === "function") return v.toString();
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    });
  }
  catch {
    return String(val);
  }
}

/**
 */
export default function Renderer({
  callback,
  className = "renderer",
  config,
  constructor: Constructor,
  forceUpdate,
}: RendererProps) {
  const globalConfig = useContext(D3plusContext);
  const container = useRef<SVGSVGElement>(null);
  const [instance] = useState<D3plusInstance>(() => new Constructor());

  useEffect(
    () => {
      if (container.current) {
        const c = assign(
          {select: container.current},
          globalConfig,
          config ?? {},
        ) as Record<string, unknown>;

        (["data", "links", "nodes", "topojson"] as const).forEach(method => {
          if (c[`${method}Format`] && c[method]) {
            (instance[method] as (data: unknown, format: unknown) => void)(
              c[method],
              c[`${method}Format`],
            );
            delete c[method];
            delete c[`${method}Format`];
          }
        });

        instance.config(c);

        instance.render?.(callback);
      }

      return () => {
        instance.destroy?.();
      };
    },
    forceUpdate ? undefined : [hash(globalConfig), hash(config)],
  );

  return (
    <div className={className} style={{height: "100%"}}>
      <svg ref={container} width="100%" height="100%"></svg>
    </div>
  );
}
