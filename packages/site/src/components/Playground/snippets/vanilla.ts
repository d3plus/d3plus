import type {SnippetInput} from "./shared.js";
import {DEFAULT_HEIGHT, helperImports, imports} from "./shared.js";

/** Plain JavaScript: the class from `@d3plus/core`, rendered into `#chart`. */
export default function vanilla({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  return `${imports(`import {${name}} from "@d3plus/core";`, helperImports(helpers))}

// Renders into <div id="chart" style="height: ${height}px"></div>
${code.trim()}

new ${name}()
  .select("#chart")
  .config(config)
  .render();
`;
}
