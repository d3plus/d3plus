import {merge, sum} from "d3-array";
import unique from "./unique.js";

/**
    @function merge
    @desc Combines an Array of Objects together and returns a new Object.
    @param {Array} objects The Array of objects to be merged together.
    @param {Object} aggs An object containing specific aggregation methods (functions) for each key type. By default, numbers are summed and strings are returned as an array of unique values.
    @example <caption>this</caption>
merge([
  {id: "foo", group: "A", value: 10, links: [1, 2]},
  {id: "bar", group: "A", value: 20, links: [1, 3]}
]);
    @example <caption>returns this</caption>
{id: ["bar", "foo"], group: "A", value: 30, links: [1, 2, 3]}
*/
function objectMerge(objects, aggs = {}) {

  const availableKeys = unique(merge(objects.map(o => Object.keys(o)))),
        newObject = {};

  availableKeys.forEach(k => {
    let value;
    if (aggs[k]) value = aggs[k](objects, o => o[k]);
    else {
      const values = objects.map(o => o[k]);
      const types = values.map(v => v || v === false ? v.constructor : v).filter(v => v !== void 0);
      if (!types.length) value = undefined;
      else if (types.indexOf(Array) >= 0) {
        value = merge(values.map(v => v instanceof Array ? v : [v]));
        value = unique(value);
        if (value.length === 1) value = value[0];
      }
      else if (types.indexOf(String) >= 0) {
        value = unique(values);
        if (value.length === 1) value = value[0];
      }
      else if (types.indexOf(Number) >= 0) value = sum(values);
      else if (types.indexOf(Object) >= 0) {
        value = unique(values.filter(v => v));
        if (value.length === 1) value = value[0];
        else value = objectMerge(value);

      }
      else {
        value = unique(values.filter(v => v !== void 0));
        if (value.length === 1) value = value[0];
      }
    }
    newObject[k] = value;
  });

  return newObject;

}

export default objectMerge;
