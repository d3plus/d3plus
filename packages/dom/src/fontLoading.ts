const listeners = new Set<() => void>();
const measured = new Set<string>();
const seen = new Set<string>();
const watched = new WeakSet<FontFaceSet>();

/** Normalizes a font-family name for comparison: unquoted and lowercase. */
const normalize = (family: string): string =>
  family.trim().replace(/^["']|["']$/g, "").toLowerCase();

/**
 * Records the families in a CSS font-family string as used for measurement, so
 * only loads of those families notify {@link onFontsLoaded} listeners.
 * @private
 */
export function noteMeasured(families: string): void {
  watchFonts();
  if (seen.has(families)) return;
  seen.add(families);
  families.split(",").forEach(f => measured.add(normalize(f)));
}

/**
 * Starts listening for web font loads on the current document, once per
 * `FontFaceSet`. A no-op where `document.fonts` is unavailable (e.g. Node).
 * @private
 */
export function watchFonts(): FontFaceSet | undefined {
  const fonts = typeof document !== "undefined" ? document.fonts : undefined;
  if (fonts && !watched.has(fonts)) {
    watched.add(fonts);
    fonts.addEventListener("loadingdone", event => {
      const {fontfaces = []} = event as FontFaceSetLoadEvent;
      if (fontfaces.some(face => measured.has(normalize(face.family))))
        listeners.forEach(fn => fn());
    });
  }
  return fonts;
}

/**
    Registers a callback to run whenever the browser finishes loading a web font that d3plus has already measured text with — the moment any text laid out with that font's fallback becomes stale. Returns a function that removes the callback.
    @param callback The function to run after the font loads.
*/
export function onFontsLoaded(callback: () => void): () => void {
  watchFonts();
  listeners.add(callback);
  return () => listeners.delete(callback);
}
