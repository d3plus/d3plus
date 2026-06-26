import {select} from "d3-selection";
import {transition} from "d3-transition";

import {default as attrize} from "./attrize.js";
import type {D3Selection} from "./D3Selection.js";

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

/**
    Manages the enter/update/exit pattern for a single DOM element, applying enter, update, and exit attributes with optional transitions.
    @param selector A CSS selector string for the element tag and classes.
    @param p Configuration object with enter, exit, update, and parent options.
*/
export default function (selector: string, p?: ElemParams): D3Selection {
  // overrides default params
  const params = Object.assign(
    {},
    {
      condition: true,
      enter: {},
      exit: {},
      duration: 0,
      parent: select("body") as unknown as D3Selection,
      update: {},
    },
    p,
  );

  const className = /\.([^#]+)/g.exec(selector),
    id = /#([^.]+)/g.exec(selector),
    t = transition().duration(params.duration),
    tag = /^([^.^#]+)/g.exec(selector)![1];

  const elem = params.parent
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
