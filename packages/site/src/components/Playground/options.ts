/**
 * A choice control's options: the documented ones, after `false` and `true`
 * when the key's type also takes a boolean (as `swarm` takes `true` besides
 * `"x"`, `"y"`, and `"auto"`), so a boolean value is one of the choices.
 * @param type The key's type, e.g. `boolean | "x" | "y"`.
 * @param options The options the docs list for it.
 */
export function choiceOptions(type: string, options: unknown[]): unknown[] {
  const takesBoolean = type.split("|").some(t => t.trim() === "boolean");
  if (!takesBoolean) return options;
  return [false, true, ...options.filter(o => typeof o !== "boolean")];
}
