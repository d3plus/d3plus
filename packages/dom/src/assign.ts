import isObject from "./isObject.js";

/**
    Determines if the object passed is the document or window.
    @param obj @private
*/
function validObject(obj: Record<string, unknown>): boolean {
  if (typeof window === "undefined") return true;
  else return (obj as unknown) !== window && (obj as unknown) !== document;
}

/**
    A deeply recursive version of `Object.assign`.

@example <caption>this</caption>
assign({id: "foo", deep: {group: "A"}}, {id: "bar", deep: {value: 20}}));
    @example <caption>returns this</caption>
{id: "bar", deep: {group: "A", value: 20}}
    @param objects The source objects to merge into the target.
*/
function assign(...objects: Record<string, unknown>[]): Record<string, unknown> {
  const target = objects[0];
  for (let i = 1; i < objects.length; i++) {
    const source = objects[i];
    if (!isObject(source)) continue;

    Object.keys(source).forEach(prop => {
      const value = source[prop];

      if (isObject(value) && validObject(value as Record<string, unknown>)) {
        if (
          Object.prototype.hasOwnProperty.call(target, prop) &&
          isObject(target[prop])
        )
          target[prop] = assign({}, target[prop] as Record<string, unknown>, value as Record<string, unknown>);
        else target[prop] = assign({}, value as Record<string, unknown>);
      } else if (Array.isArray(value)) target[prop] = value.slice();
      else target[prop] = value;
    });
  }

  return target;
}

export default assign;
