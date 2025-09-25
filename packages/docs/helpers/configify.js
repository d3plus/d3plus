/**
 * removes undefined config keys, which may cause issues with d3plus
 * and also pollute the "Code" view in Docs
 */
export default function(args, argTypes) {
  return Object.keys(args).reduce((acc, key) => {
   if (args[key] !== undefined && argTypes[key] !== undefined) acc[key] = args[key];
   return acc;
 }, {});
}
