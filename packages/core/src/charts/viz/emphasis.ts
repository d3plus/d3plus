/**
    How hover and active emphasize a matched mark (see
    `applyInteractionOpacity`): its stroke darkened by `darken` and drawn
    `width` times as wide.
*/
export const STROKE_EMPHASIS = {
  hover: {darken: 0.5, width: 2},
  active: {darken: 1, width: 3},
} as const;

/** The two emphasized states. */
export type EmphasisKind = keyof typeof STROKE_EMPHASIS;
