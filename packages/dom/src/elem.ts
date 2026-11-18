import {select} from "d3-selection";
import "d3-transition";

import {default as attrize} from "./attrize.js";
import type {D3Selection} from "./D3Selection.js";

type AttrMap = Record<string, string | number | boolean | null>;

export interface ElemParams {
  condition?: boolean;
  enter?: AttrMap;
  exit?: AttrMap;
  duration?: number;
  parent?: D3Selection;
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
    tag = /^([^.^#]+)/g.exec(selector)![1];

  const elem = params.parent
    .selectAll(selector.includes(":") ? selector.split(":")[1] : selector)
    .data(params.condition ? [null] : []);

  const enter = elem.enter().append(tag).call(attrize, params.enter);

  if (id) enter.attr("id", id[1]);
  if (className) enter.attr("class", className[1]);

  // Each element is given its own transition rather than one inherited from a
  // shared transition: d3 finds an inherited one by walking up the element's
  // ancestors, which never reach <html> (where a bare `transition()` lives)
  // when the parent is off the page. Created in the same task, they all share
  // one start time.
  if (params.duration)
    elem
      .exit()
      .transition()
      .duration(params.duration)
      .call(attrize as never, params.exit)
      .remove();
  else elem.exit().call(attrize, params.exit).remove();

  const update = enter.merge(elem);
  if (params.duration)
    update
      .transition()
      .duration(params.duration)
      .call(attrize as never, params.update);
  else update.call(attrize, params.update);

  return update as unknown as D3Selection;
}
