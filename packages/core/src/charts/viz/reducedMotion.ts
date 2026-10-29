/** The `reducedMotion` setting: follow the OS (`"auto"`), or force it on or off. */
export type ReducedMotionSetting = "auto" | boolean;

/** Anything with a `duration` and an optional `reducedMotion` in its schema. */
export interface MotionHost {
  schema: {duration?: number; reducedMotion?: ReducedMotionSetting};
}

/**
    Whether the viewer's OS asks for reduced motion, read from the
    `(prefers-reduced-motion: reduce)` media query. False without a `window`
    or `matchMedia` (server-side rendering, older runtimes).
*/
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  try {
    return !!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
    Whether a chart draws without motion: `reducedMotion` `true` always,
    `false` never, and `"auto"` (or unset) when the OS asks for it.
*/
export function motionReduced(host: MotionHost): boolean {
  const setting = host.schema.reducedMotion;
  if (setting === true) return true;
  if (setting === false) return false;
  return prefersReducedMotion();
}

/**
    The transition duration a chart animates with: 0 when motion is reduced,
    otherwise its `duration` (the stored `duration` is left as the user set it).
*/
export function effectiveDuration(host: MotionHost): number {
  return motionReduced(host) ? 0 : Number(host.schema.duration) || 0;
}
