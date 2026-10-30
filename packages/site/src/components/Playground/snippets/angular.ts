import type {SnippetInput} from "./shared.js";
import {DEFAULT_HEIGHT, helperImports, imports} from "./shared.js";

/**
 * Angular: a standalone component rendering `D3plusVizComponent`. The config
 * is declared at module level and exposed on the component.
 */
export default function angular({
  name,
  code,
  helpers,
  height = DEFAULT_HEIGHT,
}: SnippetInput): string {
  return `${imports(
    `import {Component} from "@angular/core";`,
    `import {D3plusVizComponent} from "@d3plus/angular";`,
    `import {${name}} from "@d3plus/core";`,
    helperImports(helpers),
  )}

${code.trim()}

@Component({
  selector: "app-chart",
  imports: [D3plusVizComponent],
  template: \`<d3plus-viz [viz]="${name}" [config]="config" style="height: ${height}px" />\`,
})
export class ChartComponent {
  readonly ${name} = ${name};
  readonly config = config;
}
`;
}
