/**
    Constrains a number to the range from `min` to `max`, inclusive.
    @param value The number to constrain.
    @param min The lower bound.
    @param max The upper bound; when it is below `min`, `min` wins.
*/
export default function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
