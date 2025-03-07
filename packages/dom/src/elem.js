import {select} from "d3-selection";
import {transition} from "d3-transition";

import {default as attrize} from "./attrize.js";

/**
    @function elem
    @desc Manages the enter/update/exit pattern for a single DOM element.
    @param {String} selector A D3 selector, which must include the tagname and a class and/or ID.
    @param {Object} params Additional parameters.
    @param {Boolean} [params.condition = true] Whether or not the element should be rendered (or removed).
    @param {Object} [params.enter = {}] A collection of key/value pairs that map to attributes to be given on enter.
    @param {Object} [params.exit = {}] A collection of key/value pairs that map to attributes to be given on exit.
    @param {D3Selection} [params.parent = d3.select("body")] The parent element for this new element to be appended to.
    @param {Number} [params.duration = 0] The duration for the d3 transition.
    @param {Object} [params.update = {}] A collection of key/value pairs that map to attributes to be given on update.
*/
export default function(selector, p) {

  // overrides default params
  p = Object.assign({}, {
    condition: true,
    enter: {},
    exit: {},
    duration: 0,
    parent: select("body"),
    update: {}
  }, p);

  const className = (/\.([^#]+)/g).exec(selector),
        id = (/#([^.]+)/g).exec(selector),
        t = transition().duration(p.duration),
        tag = (/^([^.^#]+)/g).exec(selector)[1];

  const elem = p.parent.selectAll(selector.includes(":") ? selector.split(":")[1] : selector)
    .data(p.condition ? [null] : []);

  const enter = elem.enter().append(tag).call(attrize, p.enter);

  if (id) enter.attr("id", id[1]);
  if (className) enter.attr("class", className[1]);

  if (p.duration) elem.exit().transition(t).call(attrize, p.exit).remove();
  else elem.exit().call(attrize, p.exit).remove();

  const update = enter.merge(elem);
  if (p.duration) update.transition(t).call(attrize, p.update);
  else update.call(attrize, p.update);

  return update;

}
