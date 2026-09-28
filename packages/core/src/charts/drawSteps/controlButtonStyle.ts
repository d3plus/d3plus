/**
    Shared mechanics for a chart-chrome button's base/active/hover inline
    styling — the resolve-and-paint algorithm zoom/search/back controls all
    use identically. Each control still owns its OWN default style VALUES
    and schema keys (`zoomControlStyle*` vs `searchControlStyle*` vs
    `backControlStyle`) in its own module, so restyling one doesn't affect
    another — only the mechanical part (which was three copy-pasted near-
    duplicates) lives here.

    @module
*/

export type StyleObject = Record<string, string | number | undefined | null | false>;
export type ControlStyleValue = StyleObject | false | null | undefined;

/** `alignItems` / `align-items` → `align-items`, for `style.setProperty`. */
export const kebab = (key: string): string => key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

/**
    Fallbacks for CSS system colors a browser may not support yet: an
    active-button default uses the OS accent color (Firefox, Safari), and
    Chromium falls back to the text-selection highlight.
*/
export const SYSTEM_COLOR_FALLBACKS: Record<string, string> = {
  AccentColor: "Highlight",
  AccentColorText: "HighlightText",
};

/** Sets one style property, swapping an unsupported system color for its fallback. */
export function setControlStyle(el: HTMLElement, key: string, value: string): void {
  const prop = kebab(key);
  el.style.setProperty(prop, value);
  const fallback = SYSTEM_COLOR_FALLBACKS[value];
  if (fallback && !el.style.getPropertyValue(prop)) el.style.setProperty(prop, fallback);
}

/**
    Resolves a `*ControlStyle`/`Active`/`Hover` value for painting. Setting
    the matching `*ControlClassName` auto-disables whichever of the three is
    still the untouched built-in default (identified by reference — the
    caller's own default constant) so a host page's own button styling can
    apply through the cascade without also requiring `.xControlStyle(false)`.
    An explicit custom style object (a different reference) always wins,
    className or not.
*/
export function resolveControlStyle(
  value: ControlStyleValue,
  defaultValue: ControlStyleValue,
  classNameSet: boolean,
): StyleObject {
  if (classNameSet && value === defaultValue) return {};
  return value || {};
}

/**
    Paints a control button's inline style for its current state: the base
    style, then the hover style while hovered, then the active style while
    its mode is on (so an active button reads as active even under the
    cursor). Every property any of the three styles sets is cleared first,
    so leaving a state fully undoes it.
*/
export function paintControlButton(
  btn: HTMLElement,
  styles: {base: StyleObject; active?: StyleObject; hover?: StyleObject},
  hovered: boolean,
  isActive: boolean,
): void {
  const {base, active = {}, hover = {}} = styles;
  for (const key of new Set([...Object.keys(base), ...Object.keys(active), ...Object.keys(hover)]))
    btn.style.removeProperty(kebab(key));
  for (const style of [base, hovered ? hover : {}, isActive ? active : {}])
    for (const key in style) {
      const v = style[key];
      if (v !== undefined && v !== null && v !== false) setControlStyle(btn, key, String(v));
    }
}
