/** One control the playground draws, from the API manifest. */
export interface ControlSpec {
  key: string;
  control: "boolean" | "number" | "text" | "radio" | "select" | "color";
  options?: unknown[];
  defaultValue?: unknown;
  /** The full description, as HTML. */
  description?: string;
}

/** The control types the playground can draw; the rest are edited as code. */
export const SCALAR_CONTROLS = new Set([
  "boolean",
  "number",
  "text",
  "radio",
  "select",
  "color",
]);
