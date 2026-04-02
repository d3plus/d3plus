import {select} from "d3-selection";
import {transition} from "d3-transition";

import {default as attrize} from "./attrize.js";
import type {D3Selection} from "./D3Selection.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySelection = ReturnType<typeof select<any, any>>;

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
type AttrMap = Record<string, string | number | boolean | null>;

export interface ElemParams {
  condition?: boolean;
  enter?: AttrMap;
  exit?: AttrMap;
  duration?: number;
  parent?: D3Selection;
  transition?: D3Selection;
  update?: AttrMap;
}

export default function (selector: string, p?: ElemParams): D3Selection {
  // overrides default params
  const params = Object.assign(
    {},
    {
      condition: true,
      enter: {},
      exit: {},
      duration: 0,
      parent: select("body") as D3Selection,
      update: {},
    },
    p,
  );

  const className = /\.([^#]+)/g.exec(selector),
    id = /#([^.]+)/g.exec(selector),
    t = transition().duration(params.duration),
    tag = /^([^.^#]+)/g.exec(selector)![1];

  const elem = (params.parent as AnySelection)
    .selectAll(selector.includes(":") ? selector.split(":")[1] : selector)
    .data(params.condition ? [null] : []);

  const enter = elem.enter().append(tag).call(attrize, params.enter);

  if (id) enter.attr("id", id[1]);
  if (className) enter.attr("class", className[1]);

  if (params.duration)
    elem
      .exit()
      .transition(t)
      .call(attrize as never, params.exit)
      .remove();
  else elem.exit().call(attrize, params.exit).remove();

  const update = enter.merge(elem);
  if (params.duration)
    update.transition(t).call(attrize as never, params.update);
  else update.call(attrize, params.update);

  return update as unknown as D3Selection;
}
