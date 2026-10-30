import type {Renderer} from "./useChart.js";

export type Panel = "controls" | "code" | "snippet";

const LABELS: Record<Panel, string> = {
  controls: "Controls",
  code: "Edit code",
  snippet: "Get the code",
};

interface ToolbarProps {
  id: string;
  panels: Panel[];
  panel: Panel;
  onPanel: (panel: Panel) => void;
  renderer: Renderer;
  onRenderer: (renderer: Renderer) => void;
  /** Resets the code, or null when it is unchanged. */
  onReset: (() => void) | null;
}

/** The playground's panel tabs, renderer switch, and reset button. */
export default function Toolbar(props: ToolbarProps) {
  const {id, panels, panel, onPanel, renderer, onRenderer, onReset} = props;
  return (
    <div class="d3p-toolbar">
      <div class="d3p-tabs" role="tablist" aria-label="Playground panels">
        {panels.map(key => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-tab-${key}`}
            aria-controls={`${id}-panel`}
            aria-selected={panel === key}
            onClick={() => onPanel(key)}
          >
            {LABELS[key]}
          </button>
        ))}
      </div>
      <div class="d3p-actions">
        <div class="d3p-segment" role="group" aria-label="Renderer">
          {(["svg", "canvas"] as Renderer[]).map(r => (
            <button
              key={r}
              type="button"
              aria-pressed={renderer === r}
              onClick={() => onRenderer(r)}
            >
              {r === "svg" ? "SVG" : "Canvas"}
            </button>
          ))}
        </div>
        <button
          type="button"
          class="d3p-reset"
          onClick={() => onReset?.()}
          disabled={!onReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
