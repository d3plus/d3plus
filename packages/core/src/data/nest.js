import {nest} from "d3-collection";

/**
    @function nest
    @summary Extends the base behavior of d3.nest to allow for multiple depth levels.
    @param {Array} *data* The data array to be nested.
    @param {Array} *keys* An array of key accessors that signify each nest level.
    @private
*/
export default function(data, keys) {

  if (!(keys instanceof Array)) keys = [keys];

  const dataNest = nest();
  for (let i = 0; i < keys.length; i++) dataNest.key(keys[i]);
  const nestedData = dataNest.entries(data);

  return bubble(nestedData);

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
