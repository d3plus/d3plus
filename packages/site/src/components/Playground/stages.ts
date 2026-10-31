import type {D3plusInstance} from "@d3plus/dom";

/**
 * How the playground shows a class that isn't drawn into a container the way
 * charts, components, and shapes are: `draw` applies the config and shows it
 * in `host`, and `clear` removes what it showed.
 */
export interface Stage {
  draw(
    instance: D3plusInstance,
    host: HTMLElement,
    config: Record<string, unknown>,
  ): void;
  clear(instance: D3plusInstance, host: HTMLElement): void;
}

/** The element a Tooltip points at: a box in the middle of the playground. */
function anchor(host: HTMLElement): HTMLElement {
  let box = host.querySelector<HTMLElement>(".d3p-anchor");
  if (!box) {
    box = document.createElement("div");
    box.className = "d3p-anchor";
    box.textContent = "anchor";
    host.append(box);
  }
  return box;
}

/** Each drawn tooltip's scroll and resize listener, by host. */
const followers = new WeakMap<HTMLElement, () => void>();

/**
 * Re-renders a tooltip as the page scrolls or resizes, once a frame: it is
 * placed in viewport coordinates, so it would otherwise stay put while its
 * anchor moves.
 */
function follow(instance: D3plusInstance, host: HTMLElement): void {
  if (followers.has(host)) return;
  let frame = 0;
  const update = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      instance.render?.();
    });
  };
  window.addEventListener("scroll", update, {passive: true});
  window.addEventListener("resize", update);
  followers.set(host, () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  });
}

/**
 * A Tooltip shows its `data` beside an anchor box, or wherever the config's
 * own `position` puts it, and follows the anchor as the page scrolls.
 */
const tooltip: Stage = {
  draw(instance, host, config) {
    const {data = [], position, ...rest} = config;
    const target = anchor(host);
    (instance.parent as (el: HTMLElement) => D3plusInstance)(host);
    instance.config(rest);
    (instance.data as (d: unknown) => D3plusInstance)(data);
    (instance.position as (p: unknown) => D3plusInstance)(
      position ?? (() => target),
    );
    instance.render?.();
    follow(instance, host);
  },
  clear(instance, host) {
    followers.get(host)?.();
    followers.delete(host);
    (instance.data as (d: unknown) => D3plusInstance)([]);
    instance.render?.();
    (instance._portalEl as HTMLElement | undefined)?.remove();
    host.querySelector(".d3p-anchor")?.remove();
  },
};

/** Classes with their own stage, by name; every other class draws into its host. */
export const STAGES: Record<string, Stage> = {Tooltip: tooltip};
