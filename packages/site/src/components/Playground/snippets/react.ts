import type {SnippetInput} from "./shared.js";
import {DEFAULT_HEIGHT, helperImports, imports} from "./shared.js";

/** React: the `@d3plus/react` component, sized by a wrapping div. */
export default function react({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  return `${imports(`import {${name}} from "@d3plus/react";`, helperImports(helpers))}

${code.trim()}

export default function Chart() {
  return (
    <div style={{height: ${height}}}>
      <${name} config={config} />
    </div>
  );
}
`;
}
