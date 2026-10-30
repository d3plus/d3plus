import type {SnippetInput} from "./shared.js";
import {DEFAULT_HEIGHT, helperImports, imports, indent} from "./shared.js";

/** Svelte: the `@d3plus/svelte` action, given the class from `@d3plus/core`. */
export default function svelte({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  const head = imports(
    `import {d3plus} from "@d3plus/svelte";`,
    `import {${name}} from "@d3plus/core";`,
    helperImports(helpers),
  );
  return `<script>
${indent(`${head}\n\n${code.trim()}`, 2)}
</script>

<div use:d3plus={{constructor: ${name}, config}} style="height: ${height}px"></div>
`;
}
