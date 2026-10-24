/**
    @name saveContribution
    The download button's contribution to the shared top-left controls panel
    (`topLeftControls.ts`). With several formats it opens a menu of them
    (a menu button: arrow keys move between items, Escape closes and returns
    focus to the button, a click outside closes it); with one format it
    saves in one click. Saving runs through `saveChart`.

    @module
*/
import type {SaveFormat} from "../../utils/D3plusConfig.js";
import type Viz from "../viz/Viz.js";
import {saveChart} from "./saveChart.js";
import {
  paintSaveButton,
  paintSaveMenuItem,
  SAVE_MENU_OPEN_STYLE,
  SAVE_MENU_STYLE,
  saveButtonStyles,
  saveControlHtml,
  showsSaveControl,
} from "./saveControlMarkup.js";
import type {Contribution} from "./topLeftControlsMarkup.js";

/** Removes an open menu's outside-click listener, keyed by its root element. */
const outsideListeners = new WeakMap<Element, () => void>();

function rootOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>(".save-root")
    : null;
}

function toggleOf(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(".save-toggle");
}

function menuItems(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".save-menu-item"));
}

/** Whether the menu inside `root` is open. */
export function isSaveMenuOpen(root: HTMLElement): boolean {
  return toggleOf(root)?.getAttribute("aria-expanded") === "true";
}

function setMenuOpen(viz: Viz, root: HTMLElement, open: boolean): void {
  const btn = toggleOf(root);
  const menu = root.querySelector<HTMLElement>(".d3plus-save-menu");
  if (!btn || !menu) return;
  btn.setAttribute("aria-expanded", String(open));
  btn.classList.toggle("active", open);
  paintSaveButton(viz, btn, btn.matches(":hover"));
  const style = open ? SAVE_MENU_OPEN_STYLE : SAVE_MENU_STYLE;
  menu.style.setProperty("display", String(style.display));
}

/** Closes the menu inside `root`, returning focus to its button when `refocus`. */
export function closeSaveMenu(
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
export function openSaveMenu(
  viz: Viz,
  root: HTMLElement,
  focus: "first" | "last" = "first",
): void {
  setMenuOpen(viz, root, true);
  const doc = root.ownerDocument;
  const onPointerDown = (e: Event): void => {
    if (!root.isConnected || !root.contains(e.target as Node))
      closeSaveMenu(viz, root);
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
  const btn = root && toggleOf(root);
  if (!root || !btn) return;
  const format = btn.dataset.format as SaveFormat | undefined;
  if (format) saveChart(viz, format);
  else if (isSaveMenuOpen(root)) closeSaveMenu(viz, root, true);
  else openSaveMenu(viz, root);
}

function onToggleKeydown(viz: Viz, e: Event): void {
  const key = (e as KeyboardEvent).key;
  const root = rootOf(e.target);
  if (!root || !root.querySelector(".d3plus-save-menu")) return;
  if (key === "ArrowDown" || key === "ArrowUp") {
    e.preventDefault();
    openSaveMenu(viz, root, key === "ArrowUp" ? "last" : "first");
  } else if (key === "Escape" && isSaveMenuOpen(root)) {
    e.stopPropagation();
    closeSaveMenu(viz, root, true);
  }
}

/** Moves focus between menu items with the arrow, Home, and End keys; Escape and Tab close the menu. */
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
    closeSaveMenu(viz, root, true);
  } else if (key === "Tab") closeSaveMenu(viz, root);
}

function onItemClick(viz: Viz, e: Event): void {
  const root = rootOf(e.target);
  const item = (e.target as Element).closest<HTMLElement>(".save-menu-item");
  if (!root || !item) return;
  closeSaveMenu(viz, root, true);
  saveChart(viz, item.dataset.format as SaveFormat);
}

/** Closes the menu when keyboard focus moves somewhere outside it. */
function onRootFocusout(viz: Viz, e: Event): void {
  const root = rootOf(e.target);
  const next = (e as FocusEvent).relatedTarget as Node | null;
  if (root && next && !root.contains(next) && isSaveMenuOpen(root))
    closeSaveMenu(viz, root);
}

/** Hovering an item focuses it, so the pointer and the keyboard share one highlight. */
function focusItem(e: Event): void {
  (e.target as Element).closest<HTMLElement>(".save-menu-item")?.focus();
}

function paintItem(viz: Viz, e: Event, focused: boolean): void {
  const item = (e.target as Element).closest<HTMLElement>(".save-menu-item");
  if (item) paintSaveMenuItem(viz, item, focused);
}

export function saveContribution(viz: Viz): Contribution | null {
  if (!showsSaveControl(viz)) return null;
  return {
    key: "save",
    html: saveControlHtml(viz),
    styleSignature: JSON.stringify(saveButtonStyles(viz)),
    events: {
      ".save-toggle": {
        click: (e: Event) => onToggleClick(viz, e),
        keydown: (e: Event) => onToggleKeydown(viz, e),
      },
      ".d3plus-save-menu": {keydown: (e: Event) => onMenuKeydown(viz, e)},
      ".save-menu-item": {
        click: (e: Event) => onItemClick(viz, e),
        mouseover: (e: Event) => focusItem(e),
        focusin: (e: Event) => paintItem(viz, e, true),
        focusout: (e: Event) => paintItem(viz, e, false),
      },
      ".save-root": {focusout: (e: Event) => onRootFocusout(viz, e)},
    },
    // Hover can't be delegated (mouseenter/mouseleave don't bubble), so bind
    // it once per button, as the other top-left controls do.
    onUpdate: (host: HTMLElement) => {
      const btn = host.querySelector<HTMLElement>(".save-toggle");
      if (!btn || btn.dataset.saveBound) return;
      btn.dataset.saveBound = "1";
      paintSaveButton(viz, btn);
      btn.addEventListener("mouseenter", () => paintSaveButton(viz, btn, true));
      btn.addEventListener("mouseleave", () => paintSaveButton(viz, btn));
    },
  };
}
