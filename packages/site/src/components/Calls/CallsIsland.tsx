import {useEffect, useRef, useState} from "preact/hooks";

import CodeBlock from "../Playground/CodeBlock.js";
import {display} from "./display.js";
import {load} from "./modules.js";
import {prepare, run} from "./prepare.js";
import type {Call, Logged, Outcome} from "./prepare.js";

interface CallsProps {
  /** The example: imports, then calls whose values are shown. */
  code: string;
  /** What the code is, for the editor's accessible name. */
  label: string;
}

/** How long typing pauses before the code runs again, in milliseconds. */
const DEBOUNCE = 300;

function Result({outcome}: {outcome: Outcome | undefined}) {
  if (!outcome) return <output class="d3p-value is-pending">…</output>;
  if ("error" in outcome)
    return <output class="d3p-value is-error">{outcome.error}</output>;
  const shown = display(outcome.value);
  return (
    <output class="d3p-value">
      {shown.swatches && (
        <span class="d3p-swatches" aria-hidden="true">
          {shown.swatches.map((color, i) => (
            <span key={i} class="d3p-swatch" style={{background: color}} />
          ))}
        </span>
      )}
      {shown.text.includes("\n") ? <pre>{shown.text}</pre> : shown.text}
    </output>
  );
}

/**
 * Editable example code for a function: each top-level call's value shows
 * beneath it, and updates as the code is edited. Code that draws into
 * `container` gets a box to draw in.
 */
export default function CallsIsland({code: initial, label}: CallsProps) {
  const [code, setCode] = useState(initial);
  const [revision, setRevision] = useState(0);
  const [calls, setCalls] = useState<Call[]>([]);
  const [outcomes, setOutcomes] = useState<(Outcome | undefined)[]>([]);
  const [error, setError] = useState<string>();
  const [logs, setLogs] = useState<Logged[]>([]);
  const [usesContainer, setUsesContainer] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      let prepared;
      try {
        prepared = prepare(code);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return;
      }
      setCalls(prepared.calls);
      setUsesContainer(prepared.usesContainer);
      const out: (Outcome | undefined)[] = prepared.calls.map(() => undefined);
      setOutcomes(out);
      const logged: Logged[] = [];
      setLogs(logged);
      try {
        const modules = await load(Object.keys(prepared.imports));
        if (cancelled) return;
        container.current?.replaceChildren();
        const failed = await run(
          prepared,
          modules,
          container.current,
          (i, outcome) => {
            out[i] = outcome;
            if (!cancelled) setOutcomes([...out]);
          },
          entry => {
            logged.push(entry);
            if (!cancelled) setLogs([...logged]);
          },
        );
        if (!cancelled) setError(failed);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    };
    const timer = setTimeout(go, first.current ? 0 : DEBOUNCE);
    first.current = false;
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  const reset = () => {
    setCode(initial);
    setRevision(r => r + 1);
  };

  return (
    <div class="d3p d3p-calls not-content">
      <CodeBlock
        doc={code}
        revision={revision}
        language="javascript"
        label={label}
        onChange={setCode}
      />
      <div class="d3p-results" aria-live="polite">
        {calls.map((call, i) => (
          <div class="d3p-result" key={`${i}-${call.source}`}>
            <code class="d3p-call">{call.source}</code>
            <span class="d3p-arrow" aria-hidden="true">
              →
            </span>
            <Result outcome={outcomes[i]} />
          </div>
        ))}
        {logs.map((entry, i) => (
          <p class={`d3p-log is-${entry.level}`} key={i}>
            <span aria-hidden="true">⚠</span> {entry.message}
          </p>
        ))}
        {error && (
          <p class="d3p-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div class="d3p-container" ref={container} hidden={!usesContainer} />
      {code !== initial && (
        <div class="d3p-calls-actions">
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
