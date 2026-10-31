import type {SnippetInput} from "./shared.js";
import {DEFAULT_HEIGHT, helperImports, imports} from "./shared.js";

/** Vue 3: the `@d3plus/vue` component in a `<script setup>` single-file component. */
export default function vue({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  return `<script setup>
${imports(`import {${name}} from "@d3plus/vue";`, helperImports(helpers))}

${code.trim()}
</script>

<template>
  <${name} :config="config" style="height: ${height}px" />
</template>
`;
}
