/**
 * Builds the d3plus `config` object from a story's Storybook args.
 *
 * Drops `undefined` values (Storybook seeds an arg per argType, many with no
 * value) so they don't override d3plus defaults or pollute the "Code" view.
 *
 * Every key a story author puts in `args` is a real d3plus config method, so
 * all defined args are passed through. We intentionally do NOT filter by
 * `argTypes`: in v4 most component config (width, height, x, domain, title, …)
 * is defined via schema-field accessors rather than JSDoc methods, so it never
 * lands in the generated `argTypes` — filtering against it silently dropped
 * valid config and left components rendering at their defaults.
 */
export default function (args) {
  return Object.keys(args).reduce((acc, key) => {
    if (args[key] !== undefined) acc[key] = args[key];
    return acc;
  }, {});
}
