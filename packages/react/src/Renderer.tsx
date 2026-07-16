import {useContext, useEffect, useRef, useState} from "react";
import {applyConfig, hash} from "@d3plus/dom";
import type {D3plusInstance} from "@d3plus/dom";
import type {D3plusConfig} from "@d3plus/core";

import D3plusContext from "./D3plusContext.jsx";

export type {D3plusConfig} from "@d3plus/core";

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

  // Apply config + render on mount and whenever the config changes. The
  // instance (and its scene renderer) PERSISTS across these updates, so the
  // chart tweens between states instead of starting over each time.
  // `applyConfig` (from @d3plus/dom) merges the global + local config onto the
  // container's <svg> and routes the data/links/nodes/topojson loader fields.
  useEffect(
    () => {
      if (container.current) {
        applyConfig(instance, container.current, globalConfig, config);
        instance.render?.(callback);
      }
    },
    forceUpdate ? undefined : [hash(globalConfig), hash(config)],
  );

  // Tear down ONLY on unmount — not on every config change. `destroy()`
  // disposes the scene renderer and clears the rendered DOM, so running it
  // between frames would make each config change start from scratch (shapes
  // exit/enter — a flash — instead of tweening). Empty deps = unmount only.
  useEffect(
    () => () => {
      instance.destroy?.();
    },
    [],
  );

  return (
    <div className={className} style={{height: "100%"}}>
      <svg ref={container} width="100%" height="100%"></svg>
    </div>
  );
}
