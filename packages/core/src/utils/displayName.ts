/**
    The class name of a d3plus instance as written in the source, for messages
    that name it: a minifier renames classes, so each class states its name in
    a static `_displayName` (a chart made with `makeChart` is named after its
    definition). Only the class's own `_displayName` counts, so a subclass that
    doesn't state one goes by its own name rather than its parent's.
    @param instance A chart, component, or shape.
    @private
*/
export function displayName(instance: object): string {
  const ctor = instance.constructor as {name: string; _displayName?: string};
  return Object.prototype.hasOwnProperty.call(ctor, "_displayName")
    ? (ctor._displayName as string)
    : ctor.name;
}
