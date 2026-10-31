import type {SnippetInput} from "./shared.js";
import {
  DEFAULT_HEIGHT,
  helperImports,
  imports,
  indent,
  kebab,
} from "./shared.js";

/** Web Components: the `@d3plus/element` custom element, configured by property. */
export default function element({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  const tag = `d3plus-${kebab(name)}`;
  const head = imports(
    `import {defineElements} from "@d3plus/element";`,
    helperImports(helpers),
  );
  const body = `${head}
defineElements();

${code.trim()}

document.getElementById("chart").config = config;`;
  return `<${tag} id="chart" style="height: ${height}px"></${tag}>
<script type="module">
${indent(body, 2)}
</script>
`;
}
