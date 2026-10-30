import {useRef, useState} from "preact/hooks";

import type {Evaluated} from "./evaluate.js";
import {evaluate} from "./evaluate.js";
import {patchConfig} from "./patch.js";

const EDIT_DELAY = 300;

/**
 * A playground's code and the config it evaluates to. Typing re-runs the code
 * after a pause; a control or a reset rewrites it and runs it at once, and
 * bumps `revision` so the editor shows the rewrite. A failed run keeps the
 * last good config, so the chart stays up while the code is mid-edit.
 */
export function useCode(initialCode: string) {
  const [code, setCode] = useState(initialCode);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Evaluated>(() => evaluate(initialCode));
  const [config, setConfig] = useState(result.config || {});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = (next: string) => {
    const evaluated = evaluate(next);
    setResult(evaluated);
    if (evaluated.config) setConfig(evaluated.config);
  };
  const replace = (next: string) => {
    clearTimeout(timer.current);
    setCode(next);
    setRevision(r => r + 1);
    run(next);
  };

  return {
    code,
    revision,
    config,
    error: result.error,
    setError: (error: string) => setResult({error}),
    /** Re-draws with the same config, e.g. after the renderer changes. */
    redraw: () => setConfig(c => ({...c})),
    edit(next: string) {
      setCode(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => run(next), EDIT_DELAY);
    },
    setControl: (key: string, value: unknown) =>
      replace(patchConfig(code, key, value)),
    reset: () => replace(initialCode),
    changed: code !== initialCode,
  };
}
