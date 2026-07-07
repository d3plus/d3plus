import {type BaseType, select} from "d3-selection";
import {transition} from "d3-transition";

/**
    @type D3Selection
    A permissive D3 selection type that accepts any element/datum combination.
    The datum is `unknown` and the element is `BaseType` (the widest element
    type d3-selection allows) so d3plus utility functions (attrize, stylize,
    elem) work against every selection without committing to a datum shape.
*/
export type D3Selection = ReturnType<typeof select<BaseType, unknown>>;

/**
    @type D3Transition
    A D3 transition type derived from the return type of d3-transition's transition function.
*/
export type D3Transition = ReturnType<typeof transition>;

/**
    @interface Attrable
    Anything that supports `.attr(name, value)` — both Selection and Transition.
*/
export interface Attrable {
  attr(name: string, value: string | number | boolean | null): this;
}

/**
    @interface Stylable
    Anything that supports `.style(name, value)` — both Selection and Transition.
*/
export interface Stylable {
  style(name: string, value: string | number | boolean | null): this;
}
