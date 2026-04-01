import {group} from "d3-array";

/**
    @function nest
    @summary Extends the base behavior of d3.nest to allow for multiple depth levels.
    @param {Array} *data* The data array to be nested.
    @param {Array} *keys* An array of key accessors that signify each nest level.
    @private
*/
export default function(data, keys) {

  if (!(keys instanceof Array)) keys = [keys];

  const nestedData = nestGroups(data, keys);

  return bubble(nestedData);

}

/**
    @function nestGroups
    @desc Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy.
    @param {Array} data The data array to group.
    @param {Array} fns An array of key accessor functions, one per nesting level.
    @returns {Array}
*/
export function nestGroups(data, fns) {
  if (!fns.length) return data;
  return [...group(data, fns[0])].map(([key, values]) => ({
    key,
    values: nestGroups(values, fns.slice(1))
  }));
}

/**
    Bubbles up values that do not nest to the furthest key.
    @param {Array} *values* The "values" of a nest object.
    @private
*/
function bubble(values) {

  return values.map(d => {

    if (d.key && d.values) {
      if (d.values[0].key === "undefined") return d.values[0].values[0];
      else d.values = bubble(d.values);
    }

    return d;

  });

}
