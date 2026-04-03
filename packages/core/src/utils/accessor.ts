import type {DataPoint} from "@d3plus/data";

/**
    Wraps an object key in a simple accessor function.
    @param key The key to be returned from each Object passed to the function.
    @param def A default value to be returned if the key is not present.
    @example <caption>this</caption>
accessor("id");
    @example <caption>returns this</caption>
function(d) {
  return d["id"];
}
*/
export default function accessor(
  key: string,
  def?: DataPoint[keyof DataPoint],
): (d: DataPoint) => DataPoint[keyof DataPoint] {
  if (def === undefined) return (d: DataPoint) => d[key];
  return (d: DataPoint) => (d[key] === undefined ? def : d[key]);
}
