import angular from "./angular.js";
import element from "./element.js";
import react from "./react.js";
import type {SnippetInput} from "./shared.js";
import svelte from "./svelte.js";
import vanilla from "./vanilla.js";
import vue from "./vue.js";

export type {SnippetInput} from "./shared.js";
export {usedHelpers} from "./shared.js";

/** A code-panel flavor: its tab label, editor language, and template. */
export interface Flavor {
  id: string;
  label: string;
  /** A shorter label for the playground's buttons, when the label is long. */
  short?: string;
  language: "javascript" | "jsx" | "typescript" | "html";
  render: (input: SnippetInput) => string;
}

/**
 * Every flavor, in tab order. Labels match the install tabs' so a choice
 * made in either carries over (see `flavorStore`).
 */
export const FLAVORS: Flavor[] = [
  {
    id: "javascript",
    label: "JavaScript",
    short: "JS",
    language: "javascript",
    render: vanilla,
  },
  {id: "react", label: "React", language: "jsx", render: react},
  {id: "vue", label: "Vue", language: "html", render: vue},
  {id: "svelte", label: "Svelte", language: "html", render: svelte},
  {
    id: "element",
    label: "Web Components",
    short: "Elements",
    language: "html",
    render: element,
  },
  {id: "angular", label: "Angular", language: "typescript", render: angular},
];
