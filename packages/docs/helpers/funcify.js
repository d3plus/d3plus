/**
 * allows overwriting the default toString method of a function
 * in order for pretty doc printouts
 */
 export default function(fn, str) {

  /** A toString to render the function in storybook */
  // eslint-disable-next-line no-param-reassign
  fn.toString = () => str;
  fn.toJSON = () => str;

  return fn;

}
