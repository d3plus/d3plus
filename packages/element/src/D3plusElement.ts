import {applyConfig, hash} from "@d3plus/dom";
import type {D3plusConstructor, D3plusInstance} from "@d3plus/dom";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
    Global config merged into every d3plus custom element before its own
    per-element config — the web-component analogue of React's D3plusContext.
    Reassign via {@link setGlobalConfig}. Already-connected elements pick it up
    on their next render (set `.config` again, or re-append them, to refresh).
*/
export let globalConfig: Record<string, unknown> = {};

/**
    Replaces the {@link globalConfig} object merged into every d3plus element.
    @param config The new global config (nullish resets it to `{}`).
*/
export function setGlobalConfig(config?: Record<string, unknown>): void {
  globalConfig = config ?? {};
}

/**
    Base class for every d3plus custom element. Instantiates the d3plus class
    named by its static `viz` property, renders it into an internal `<svg>`, and
    keeps the instance alive across config changes so it tweens between states
    (destroying only on disconnect). Subclasses set `viz`; register them with
    `defineElements()` from the package entry point.

    Config is supplied via the `.config` property (an object, so it can carry
    accessor functions and nested options — unlike string attributes):

    ```js
    const el = document.createElement("d3plus-treemap");
    el.config = {data: [...], groupBy: "id", sum: "value"};
    document.body.appendChild(el);
    ```
*/
export class D3plusElement extends HTMLElement {

  /** The d3plus class this element instantiates; set per registered subclass. */
  static viz?: D3plusConstructor;

  private _instance: D3plusInstance | null = null;
  private _svg: SVGElement | null = null;
  private _config: Record<string, unknown> = {};
  private _callback?: () => void;
  private _lastHash: string | null = null;

  /** When true, re-renders even when the merged config is structurally unchanged. */
  forceUpdate = false;

  /** Config object forwarded to the visualization's `.config()` method. */
  get config(): Record<string, unknown> {
    return this._config;
  }
  set config(value: Record<string, unknown>) {
    this._config = value ?? {};
    this.render();
  }

  /** A function invoked at the end of each render cycle. */
  get callback(): (() => void) | undefined {
    return this._callback;
  }
  set callback(fn: (() => void) | undefined) {
    this._callback = fn;
  }

  connectedCallback(): void {
    if (!this._svg) {
      this._svg = document.createElementNS(SVG_NS, "svg");
      this._svg.setAttribute("width", "100%");
      this._svg.setAttribute("height", "100%");
      if (!this.style.display) this.style.display = "block";
      this.appendChild(this._svg);
    }
    // Force a render on (re)connect regardless of the config hash: a
    // reconnected element has a fresh, empty <svg> that must be redrawn.
    this.render(true);
  }

  disconnectedCallback(): void {
    // Dispose the instance and drop the <svg> so a later reconnect starts
    // clean. Mirrors the React wrapper's unmount teardown.
    this._instance?.destroy?.();
    this._instance = null;
    this._lastHash = null;
    if (this._svg) {
      this._svg.remove();
      this._svg = null;
    }
  }

  /**
      Applies the merged global + element config to the underlying d3plus
      instance and renders it. Skipped when the element is disconnected (no
      target `<svg>`) and, unless forced, when the config is unchanged.
      @param force Render even if the config hash matches the last render.
  */
  render(force = false): void {
    if (!this._svg || !this.isConnected) return;
    const Ctor = (this.constructor as typeof D3plusElement).viz;
    if (!Ctor) return;

    const h = hash([globalConfig, this._config]);
    if (!force && !this.forceUpdate && h === this._lastHash) return;
    this._lastHash = h;

    if (!this._instance) this._instance = new Ctor();
    applyConfig(this._instance, this._svg, globalConfig, this._config);
    this._instance.render?.(this._callback);
  }

}
