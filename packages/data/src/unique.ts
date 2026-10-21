/**
    Reduces an Array of values to unique instances, keeping the first of each.
    Dates compare by time.
    @param arr The Array of objects to be filtered.
    @param accessor An optional accessor function used to extract data points from an Array of Objects.
    @example <caption>this</caption>
unique(["apple", "banana", "apple"]);
    @example <caption>returns this</caption>
["apple", "banana"]
*/
export default function <T>(arr: T[], accessor: (d: T) => unknown = d => d): T[] {
  const seen = new Set<unknown>();
  return arr.filter(obj => {
    const d = accessor(obj);
    const key = d instanceof Date ? +d : d;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
