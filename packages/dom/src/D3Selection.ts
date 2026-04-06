import {select} from "d3-selection";
import {transition} from "d3-transition";

/**
    @type D3Selection
    A permissive D3 selection type that accepts any generic parameterisation.
    Uses `any` for the parent/datum generics because d3plus utility functions
    (attrize, stylize, elem) must work with every combination.
*/
 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type D3Selection = ReturnType<typeof select<any, any>>;

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
