import * as core from "@d3plus/core";
import {applyConfig} from "@d3plus/dom";
import type {D3plusConstructor, D3plusInstance} from "@d3plus/dom";
import type {ComponentChildren} from "preact";
import {useEffect, useRef, useState} from "preact/hooks";

import {DWELL, SCENES, nextScene} from "./scenes.js";

/** How long a chart takes to fade out under the next, in milliseconds. */
const FADE = 900;

interface ShowcaseProps {
  /** Each scene's chart page, by class name. */
  pages: Record<string, string>;
  /**
   * The first scene as static SVG (see `poster.ts`), shown from the first
   * paint until the loop moves on, so the live chart is never redrawn over it.
   */
  children?: ComponentChildren;
}

/** True while the element is on screen and the tab is visible. */
function useOnScreen(target: {current: HTMLElement | null}) {
  const [seen, setSeen] = useState(false);
  const [shown, setShown] = useState(
    typeof document === "undefined" || !document.hidden,
  );
  useEffect(() => {
    const el = target.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setSeen(entry.isIntersecting),
    );
    observer.observe(el);
    const onVisibility = () => setShown(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return seen && shown;
}

/**
 * The home page's backdrop: one d3plus chart after another, each fading in
 * over the last with its own entrance animation. It holds still on the first
 * chart for readers who prefer reduced motion, and pauses off screen.
 */
export default function HeroShowcase({pages, children}: ShowcaseProps) {
  const root = useRef<HTMLDivElement>(null);
  const layers = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const charts = useRef<(D3plusInstance | null)[]>([null, null]);
  // Each change draws into the other layer, so every change cross-fades.
  const [{index, front}, setShown] = useState({index: 0, front: 0});
  const show = (i: number) =>
    setShown(s => (s.index === i ? s : {index: i, front: 1 - s.front}));
  const [still] = useState(
    () =>
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const visible = useOnScreen(root);
  // Whether the poster still stands in for the first scene.
  const [posted, setPosted] = useState(Boolean(children));

  // Draws the scene into the front layer; the back one fades out, then goes.
  useEffect(() => {
    if (posted) {
      if (index === 0) return undefined;
      setPosted(false);
    }
    const host = layers[front].current;
    const scene = SCENES[index];
    const Chart = (core as unknown as Record<string, D3plusConstructor>)[
      scene.chart
    ];
    if (!host || !Chart) return undefined;
    charts.current[front]?.destroy?.();
    const chart = new Chart();
    charts.current[front] = chart;
    applyConfig(chart, host, scene.config, {renderer: "svg"});
    chart.render?.();
    const back = 1 - front;
    const timer = setTimeout(() => {
      charts.current[back]?.destroy?.();
      charts.current[back] = null;
    }, FADE);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (still || !visible) return undefined;
    const timer = setTimeout(() => show(nextScene(index)), DWELL);
    return () => clearTimeout(timer);
  }, [index, still, visible]);

  useEffect(
    () => () => charts.current.forEach(chart => chart?.destroy?.()),
    [],
  );

  const scene = SCENES[index];
  return (
    <div class="d3p-showcase" ref={root}>
      <div class="d3p-showcase-stage" aria-hidden="true" inert>
        {children && (
          <div
            class={`d3p-showcase-layer${posted && index === 0 ? " is-front" : ""}`}
          >
            {children}
          </div>
        )}
        {layers.map((ref, i) => (
          <div
            key={i}
            ref={ref}
            class={`d3p-showcase-layer${i === front ? " is-front" : ""}`}
          />
        ))}
      </div>
      <div class="d3p-showcase-caption">
        <a href={pages[scene.chart]}>
          {scene.chart.replace(/([a-z])([A-Z])/g, "$1 $2")}
          <span aria-hidden="true"> →</span>
        </a>
        <div class="d3p-showcase-dots" role="group" aria-label="Charts">
          {SCENES.map((s, i) => (
            <button
              key={s.chart}
              type="button"
              aria-label={`Show ${s.chart}`}
              aria-pressed={i === index}
              onClick={() => show(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
