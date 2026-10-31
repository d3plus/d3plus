import {useState} from "preact/hooks";

import CodeBlock from "./CodeBlock.js";
import Controls from "./Controls.js";
import Snippets from "./Snippets.js";
import Toolbar from "./Toolbar.js";
import type {Panel} from "./Toolbar.js";
import type {ControlSpec} from "./types.js";
import {useChart} from "./useChart.js";
import type {Renderer} from "./useChart.js";
import {useCode} from "./useCode.js";

export type {Panel} from "./Toolbar.js";

interface PlaygroundProps {
  /** A page-unique id, which prefixes the ids of the playground's elements. */
  id: string;
  /** The `@d3plus/core` class to render, e.g. `Treemap`. */
  name: string;
  /** The starting code: declarations ending in `const config = {…};`. */
  code: string;
  controls: ControlSpec[];
  /** The flavor ids this class can be shown in (see `FLAVORS`). */
  flavors: string[];
  height: number;
  /** The panel shown first; defaults to the controls, or the code without any. */
  panel?: Panel;
  /** `"split"` puts the code beside the chart, with no controls. */
  layout?: "stacked" | "split";
}

/**
 * A live d3plus chart with its config as editable code, a form of its simple
 * settings that rewrites that code, and the code for every framework wrapper.
 */
export default function PlaygroundIsland({
  id,
  name,
  code: initialCode,
  controls,
  flavors,
  height,
  panel: firstPanel,
  layout = "stacked",
}: PlaygroundProps) {
  const code = useCode(initialCode);
  const [renderer, setRenderer] = useState<Renderer>("svg");
  const host = useChart(name, code.config, renderer, {
    onError: code.setError,
    redraw: code.redraw,
  });
  const split = layout === "split";
  const panels: Panel[] =
    controls.length && !split
      ? ["controls", "code", "snippet"]
      : ["code", "snippet"];
  const [panel, setPanel] = useState<Panel>(firstPanel ?? panels[0]);

  const chart = (
    <div class="d3p-stage">
      <div class="d3p-chart" style={{height: `${height}px`}} ref={host} />
      {code.error && (
        <p class="d3p-error" role="alert">
          {code.error}
        </p>
      )}
    </div>
  );
  return (
    <div class={`d3p not-content${split ? " is-split" : ""}`}>
      {!split && chart}
      <div class="d3p-side">
        <Toolbar
          id={id}
          panels={panels}
          panel={panel}
          onPanel={setPanel}
          renderer={renderer}
          onRenderer={setRenderer}
          onReset={code.changed ? code.reset : null}
        />
        <div
          class="d3p-panel"
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${panel}`}
        >
          {panel === "controls" && (
            <Controls
              id={id}
              controls={controls}
              config={code.config}
              onChange={code.setControl}
              onEditCode={() => setPanel("code")}
            />
          )}
          {panel === "code" && (
            <CodeBlock
              doc={code.code}
              revision={code.revision}
              language="javascript"
              label={`${name} config`}
              onChange={code.edit}
            />
          )}
          {panel === "snippet" && (
            <Snippets
              name={name}
              code={code.code}
              flavors={flavors}
              height={height}
            />
          )}
        </div>
      </div>
      {split && chart}
    </div>
  );
}
