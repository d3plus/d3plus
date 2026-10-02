/**
 * allows overwriting the default toString method of a function
 * in order for pretty doc printouts
 */
export default function (fn, str) {
  /** A toString to render the function in storybook */
  fn.toString = () => str;
  fn.toJSON = () => str;

  return fn;
}
