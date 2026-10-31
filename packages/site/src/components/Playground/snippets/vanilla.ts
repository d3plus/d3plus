import type {SnippetInput} from "./shared.js";
import {DEFAULT_HEIGHT, helperImports, imports} from "./shared.js";

/**
 * Plain JavaScript: the class from `@d3plus/core`, rendered into `#chart`. A
 * Tooltip isn't rendered into a container: it shows beside an element.
 */
export default function vanilla({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  const head = imports(
    `import {${name}} from "@d3plus/core";`,
    helperImports(helpers),
  );
  if (name === "Tooltip")
    return `${head}

${code.trim()}

// Shows beside \`element\`; render with empty data to hide it.
new Tooltip()
  .parent(document.body)
  .config(config)
  .position(() => element)
  .render();
`;
  return `${head}

// Renders into <div id="chart" style="height: ${height}px"></div>
${code.trim()}

new ${name}()
  .select("#chart")
  .config(config)
  .render();
`;
}
