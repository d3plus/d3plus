/**
 * The code flavor a reader picked, shared by every playground on the page and
 * remembered across pages. It uses the key Starlight's `<Tabs syncKey="flavor">`
 * stores its label under, so a framework picked in the install tabs is the
 * one the playgrounds show, and the other way around.
 */
const STORAGE_KEY = "starlight-synced-tabs__flavor";
const EVENT = "d3plus-flavor";

/** The remembered flavor label, or null when there is none (or no storage). */
export function readFlavor(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remembers a flavor label and tells the page's other playgrounds. */
export function writeFlavor(label: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, label);
  } catch {
    // Storage is unavailable (a private window, say); the choice lasts this page.
  }
  window.dispatchEvent(new CustomEvent(EVENT, {detail: label}));
}

/** Calls `listener` whenever any playground picks a flavor; returns an unsubscribe. */
export function onFlavor(listener: (label: string) => void): () => void {
  const handler = (event: Event) =>
    listener((event as CustomEvent<string>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
