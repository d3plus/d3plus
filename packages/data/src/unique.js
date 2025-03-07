/**
    @function unique
    @desc ES5 implementation to reduce an Array of values to unique instances.
    @param {Array} arr The Array of objects to be filtered.
    @param {Function} [accessor] An optional accessor function used to extract data points from an Array of Objects.
    @example <caption>this</caption>
unique(["apple", "banana", "apple"]);
    @example <caption>returns this</caption>
["apple", "banana"]
*/
export default function(arr, accessor = d => d) {

  const values = arr
    .map(accessor)
    .map(d => d instanceof Date ? +d : d);

  return arr.filter((obj, i) => {
    const d = accessor(obj);
    return values.indexOf(d instanceof Date ? +d : d) === i;
  });

}
