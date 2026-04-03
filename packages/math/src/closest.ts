/**
    Finds the closest numeric value in an array.
    @param n The number value to use when searching the array.
    @param arr The array of values to test against.
*/
export default function (n: number, arr: number[] = []): number | undefined {
  if (!arr || !(arr instanceof Array) || !arr.length) return undefined;
  return arr.reduce((prev, curr) =>
    Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev,
  );
}
