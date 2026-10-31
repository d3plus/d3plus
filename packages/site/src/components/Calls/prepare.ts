import {parse} from "acorn";
import type {ImportDeclaration} from "acorn";

/** One top-level call in an example, whose value is shown beside it. */
export interface Call {
  /** The expression as written. */
  source: string;
}

/** An example's code, ready to run. */
export interface Prepared {
  /** Each imported module's bindings: local name → exported name (`*` for a namespace). */
  imports: Record<string, Record<string, string>>;
  /** The top-level expressions, in order. */
  calls: Call[];
  /** The code without its imports, each call wrapped in `__show(index, () => …)`. */
  body: string;
  /** Whether the code draws into the `container` element it is given. */
  usesContainer: boolean;
}

/** An import's bindings: local name → exported name, `default`, or `*`. */
function bindings(node: ImportDeclaration): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of node.specifiers) {
    if (s.type === "ImportNamespaceSpecifier") out[s.local.name] = "*";
    else if (s.type === "ImportDefaultSpecifier") out[s.local.name] = "default";
    else
      out[s.local.name] =
        s.imported.type === "Identifier"
          ? s.imported.name
          : String(s.imported.value);
  }
  return out;
}

/**
 * Splits an example's code into its imports and a runnable body in which
 * each top-level expression reports its value. Throws on a syntax error.
 */
export function prepare(code: string): Prepared {
  const program = parse(code, {ecmaVersion: "latest", sourceType: "module"});
  const imports: Prepared["imports"] = {};
  const calls: Call[] = [];
  const edits: [number, number, string][] = [];
  program.body.forEach(node => {
    if (node.type === "ImportDeclaration") {
      const from = String(node.source.value);
      imports[from] = {...imports[from], ...bindings(node)};
      edits.push([node.start, node.end, ""]);
    } else if (node.type === "ExpressionStatement") {
      const source = code.slice(node.expression.start, node.expression.end);
      edits.push([
        node.start,
        node.end,
        `__show(${calls.length}, () => (${source}));`,
      ]);
      calls.push({source});
    }
  });
  let body = "";
  let at = 0;
  for (const [start, end, text] of edits) {
    body += code.slice(at, start) + text;
    at = end;
  }
  body += code.slice(at);
  return {
    imports,
    calls,
    body,
    usesContainer: /\bcontainer\b/.test(body),
  };
}

/** A call's outcome: its value, or the error it threw. */
export type Outcome = {value: unknown} | {error: string};

/** A warning or error the code logged while it ran. */
export interface Logged {
  level: "warn" | "error";
  message: string;
}

/**
 * Sends `console.warn` and `console.error` to `onLog` instead of the console
 * until the returned function restores them, so what example code logs (a
 * config warning, say) shows beside it.
 */
function capture(onLog: (logged: Logged) => void): () => void {
  const {warn, error} = console;
  const to =
    (level: Logged["level"]) =>
    (...args: unknown[]) =>
      onLog({level, message: args.map(String).join(" ")});
  console.warn = to("warn");
  console.error = to("error");
  return () => {
    console.warn = warn;
    console.error = error;
  };
}

/**
 * Runs prepared code with its imports resolved from `modules` (module name →
 * loaded module) and `container` in scope, reporting each call's outcome in
 * order. Promises settle into their value. What it logs while running goes to
 * `onLog`. An error outside a call stops the run and is returned.
 */
export async function run(
  prepared: Prepared,
  modules: Record<string, Record<string, unknown>>,
  container: HTMLElement | null,
  onOutcome: (index: number, outcome: Outcome) => void,
  onLog: (logged: Logged) => void = () => {},
): Promise<string | undefined> {
  const names: string[] = [];
  const values: unknown[] = [];
  for (const [from, binds] of Object.entries(prepared.imports))
    for (const [local, imported] of Object.entries(binds)) {
      const mod = modules[from];
      if (!mod) return `Can't load ${from} here.`;
      names.push(local);
      values.push(imported === "*" ? mod : mod[imported]);
    }
  const pending: Promise<void>[] = [];
  const show = (index: number, fn: () => unknown) => {
    let value: unknown;
    try {
      value = fn();
    } catch (e) {
      onOutcome(index, {error: e instanceof Error ? e.message : String(e)});
      return;
    }
    if (value instanceof Promise)
      pending.push(
        value.then(
          v => onOutcome(index, {value: v}),
          e =>
            onOutcome(index, {
              error: e instanceof Error ? e.message : String(e),
            }),
        ),
      );
    else onOutcome(index, {value});
  };
  const restore = capture(onLog);
  try {
    new Function(...names, "__show", "container", `{\n${prepared.body}\n}`)(
      ...values,
      show,
      container,
    );
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  } finally {
    restore();
  }
  await Promise.all(pending);
  return undefined;
}
