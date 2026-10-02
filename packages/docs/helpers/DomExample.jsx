import React, {useLayoutEffect, useRef, useState} from "react";
import {SyntaxHighlighter} from "storybook/internal/components";
import {ThemeProvider, convert} from "storybook/theming";

const theme = convert();

/** One tag per line, indented by nesting depth, for readable markup dumps. */
export function prettyHtml(html) {
  let depth = 0;
  return html
    .replace(/>\s*</g, ">\n<")
    .split("\n")
    .map(line => {
      const closing = /^<\//.test(line);
      const selfClosing = /\/>$/.test(line) || /^<(br|hr|img|input|path|circle|rect|line)\b[^>]*>$/.test(line);
      const opening = /^<[^/!]/.test(line) && !selfClosing && !/<\/[a-z]+>$/i.test(line);
      if (closing) depth = Math.max(0, depth - 1);
      const out = "  ".repeat(depth) + line;
      if (opening) depth += 1;
      return out;
    })
    .join("\n");
}

/**
 * Mounts `initial` markup in a dashed container, runs `setup(node)` against
 * it after layout (a d3-selection mutation, a measurement…), and prints
 * `output(node)` as a syntax-highlighted block underneath: the live DOM on
 * top, what it became below. `output` defaults to the container's pretty
 * printed innerHTML. `setup` may return a cleanup function and re-runs when
 * `deps` change, so a story can wire a toggle to it.
 */
export default function DomExample({
  initial = null,
  setup,
  deps = [],
  output,
  language = "html",
  minHeight = 48,
}) {
  const ref = useRef(null);
  const [text, setText] = useState("");

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const cleanup = setup ? setup(node) : undefined;
    setText(output ? String(output(node)) : prettyHtml(node.innerHTML));
    return typeof cleanup === "function" ? cleanup : undefined;
  }, deps);

  return (
    <ThemeProvider theme={theme}>
      <div style={{display: "grid", gap: 12, fontSize: 13}}>
        <div
          ref={ref}
          style={{border: "1px dashed #bbb", borderRadius: 6, padding: 12, minHeight}}
        >
          {initial}
        </div>
        <SyntaxHighlighter language={language} copyable bordered padded>
          {text}
        </SyntaxHighlighter>
      </div>
    </ThemeProvider>
  );
}
