import isObject from "./isObject.js";

/**
    @function validObject
    @desc Determines if the object passed is the document or window.
    @param {Object} obj
    @private
*/
function validObject(obj) {
  if (typeof window === "undefined") return true;
  else return obj !== window && obj !== document;
}

/**
    @function assign
    @desc A deeply recursive version of `Object.assign`.
    @param {...Object} objects
    @example <caption>this</caption>
assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}}));
    @example <caption>returns this</caption>
{id: "bar", deep: {group: "A", value: 20}}
*/
function assign(...objects) {

  const target = objects[0];
  for (let i = 1; i < objects.length; i++) {

    const source = objects[i];
    if (!isObject(source)) continue;

    Object.keys(source).forEach(prop => {

      const value = source[prop];

      if (isObject(value) && validObject(value)) {
        if (Object.prototype.hasOwnProperty.call(target, prop) && isObject(target[prop])) target[prop] = assign({}, target[prop], value);
        else target[prop] = assign({}, value);
      }
      else if (Array.isArray(value)) target[prop] = value.slice();
      else target[prop] = value;

    });
  }

  return target;

}

export default assign;
