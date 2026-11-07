/** How a Timeline draws its periods: tick marks along an axis, or a row of buttons. */
export type TimelineMode = "ticks" | "buttons";

const MODES: TimelineMode[] = ["ticks", "buttons"];

/**
    The class naming how a Timeline is drawn, `<prefix>-ticks` or
    `<prefix>-buttons`, or none before it resolves a mode.
    @param prefix The element's own class, such as `d3plus-viz-timeline`.
    @param mode The Timeline's resolved `buttonBehavior`.
*/
export function timelineModeClass(prefix: string, mode: string): string | null {
  return (MODES as string[]).includes(mode) ? `${prefix}-${mode}` : null;
}

/**
    Adds `timelineModeClass(prefix, mode)` to `el` and removes the other
    mode's class, so the element names the presentation drawn last.
    @param el The element to mark.
    @param prefix The element's own class.
    @param mode The Timeline's resolved `buttonBehavior`.
*/
export function classTimelineMode(
  el: Element | null | undefined,
  prefix: string,
  mode: string,
): void {
  if (!el) return;
  const current = timelineModeClass(prefix, mode);
  for (const m of MODES) {
    const name = `${prefix}-${m}`;
    el.classList.toggle(name, name === current);
  }
}
