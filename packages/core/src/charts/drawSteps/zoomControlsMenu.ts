/**
    The "More Controls" menu of the zoom controls: on a chart too narrow
    for all six buttons beside the top-left controls, the ones that don't fit
    move into it (see `zoomControlsHtml`). A menu button, as the download
    button's is: a click or Enter opens it, the arrow keys, Home, and End
    move between its items, Escape closes it and returns focus to the
    button, and a click outside or Tab away closes it. Picking an item runs
    its button's action (the panel's own delegated handlers match the item
    by the same class) and closes the menu.

    The menu's open state lives only in the DOM (its `display` and the
    button's `aria-expanded`), never in the generated html, so opening it
    neither changes the panel's measured size nor makes the next repaint
    rewrite the open menu.

    @module
*/

import type Viz from "../viz/Viz.js";
import {
  saveControlMenuItemStyleDefault,
  saveControlMenuItemStyleHoverDefault,
} from "../viz/vizDefaults.js";
import {paintControlButton} from "./controlButtonStyle.js";
import {ZOOM_MENU_ITEM_STYLE, paintZoomButton} from "./zoomControlsMarkup.js";

/** Removes an open menu's outside-click listener, keyed by its root element. */
const outsideListeners = new WeakMap<Element, () => void>();

/** The menu's root (its button and the menu) around an event target. */
function rootOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>(".zoom-more-root")
    : null;
}

function toggleOf(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(".zoom-more");
}

function menuItems(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".zoom-menu-item"));
}

/** Whether the menu inside `root` is open. */
export function isZoomMenuOpen(root: HTMLElement): boolean {
  return toggleOf(root)?.getAttribute("aria-expanded") === "true";
}

function setMenuOpen(viz: Viz, root: HTMLElement, open: boolean): void {
  const btn = toggleOf(root);
  const menu = root.querySelector<HTMLElement>(".d3plus-zoom-menu");
  if (!btn || !menu) return;
  btn.setAttribute("aria-expanded", String(open));
  paintZoomButton(viz, btn, btn.matches(":hover"));
  menu.style.setProperty("display", open ? "flex" : "none");
}

/** Closes the menu inside `root`, returning focus to its button when `refocus`. */
export function closeZoomMenu(
  viz: Viz,
  root: HTMLElement,
  refocus = false,
): void {
  outsideListeners.get(root)?.();
  outsideListeners.delete(root);
  setMenuOpen(viz, root, false);
  if (refocus) toggleOf(root)?.focus();
}

/** Opens the menu inside `root` and focuses its first (or last) item. */
export function openZoomMenu(
  viz: Viz,
  root: HTMLElement,
  focus: "first" | "last" = "first",
): void {
  setMenuOpen(viz, root, true);
  const doc = root.ownerDocument;
  const onPointerDown = (e: Event): void => {
    if (!root.isConnected || !root.contains(e.target as Node))
      closeZoomMenu(viz, root);
  };
  outsideListeners.get(root)?.();
  doc.addEventListener("pointerdown", onPointerDown, true);
  outsideListeners.set(root, () =>
    doc.removeEventListener("pointerdown", onPointerDown, true),
  );
  const items = menuItems(root);
  items[focus === "last" ? items.length - 1 : 0]?.focus();
}

function onToggleClick(viz: Viz, e: Event): void {
  const root = rootOf(e.target);
  if (!root) return;
  if (isZoomMenuOpen(root)) closeZoomMenu(viz, root, true);
  else openZoomMenu(viz, root);
}

function onToggleKeydown(viz: Viz, e: Event): void {
  const key = (e as KeyboardEvent).key;
  const root = rootOf(e.target);
  if (!root || (e.target as Element).closest(".d3plus-zoom-menu")) return;
  if (key === "ArrowDown" || key === "ArrowUp") {
    e.preventDefault();
    openZoomMenu(viz, root, key === "ArrowUp" ? "last" : "first");
  } else if (key === "Escape" && isZoomMenuOpen(root)) {
    e.preventDefault();
    e.stopPropagation();
    closeZoomMenu(viz, root, true);
  }
}

/** Moves focus between items with the arrow, Home, and End keys; Escape and Tab close the menu. */
function onMenuKeydown(viz: Viz, e: Event): void {
  const key = (e as KeyboardEvent).key;
  const root = rootOf(e.target);
  if (!root) return;
  const items = menuItems(root);
  const index = items.indexOf(e.target as HTMLElement);
  const focusAt = (i: number): void => {
    e.preventDefault();
    items[(i + items.length) % items.length]?.focus();
  };
  if (key === "ArrowDown") focusAt(index + 1);
  else if (key === "ArrowUp") focusAt(index - 1);
  else if (key === "Home") focusAt(0);
  else if (key === "End") focusAt(items.length - 1);
  else if (key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeZoomMenu(viz, root, true);
  } else if (key === "Tab") closeZoomMenu(viz, root);
}

/** Closes the menu when keyboard focus moves somewhere outside it. */
function onRootFocusout(viz: Viz, e: Event): void {
  const root = rootOf(e.target);
  const next = (e as FocusEvent).relatedTarget as Node | null;
  if (root && next && !root.contains(next) && isZoomMenuOpen(root))
    closeZoomMenu(viz, root);
}

/** Paints an item, with the hover style while it has focus. */
function paintItem(e: Event, focused: boolean): void {
  const item = (e.target as Element).closest<HTMLElement>(".zoom-menu-item");
  if (item)
    paintControlButton(
      item,
      {
        base: {...saveControlMenuItemStyleDefault, ...ZOOM_MENU_ITEM_STYLE},
        hover: saveControlMenuItemStyleHoverDefault,
      },
      focused,
      false,
    );
}

/**
    The menu's delegated event handlers, merged into the zoom panel's (after
    the buttons' own, so an item runs its action before the menu closes).
    @param viz The chart.
*/
export function zoomMenuEvents(
  viz: Viz,
): Record<string, Record<string, (e: Event) => void>> {
  return {
    ".zoom-more": {
      click: (e: Event) => onToggleClick(viz, e),
      keydown: (e: Event) => onToggleKeydown(viz, e),
    },
    ".d3plus-zoom-menu": {keydown: (e: Event) => onMenuKeydown(viz, e)},
    ".zoom-menu-item": {
      click: (e: Event) => {
        const root = rootOf(e.target);
        if (root) closeZoomMenu(viz, root, true);
      },
      // Hovering an item focuses it, so the pointer and the keyboard share one highlight.
      mouseover: (e: Event) =>
        (e.target as Element).closest<HTMLElement>(".zoom-menu-item")?.focus(),
      focusin: (e: Event) => paintItem(e, true),
      focusout: (e: Event) => paintItem(e, false),
    },
    ".zoom-more-root": {focusout: (e: Event) => onRootFocusout(viz, e)},
  };
}
