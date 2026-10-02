import React from "react";

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "0.5rem 0.85rem",
  fontFamily: "ui-monospace, monospace",
  fontSize: 13,
  maxWidth: 760,
};

const chipStyle = {
  display: "inline-block",
  marginRight: 8,
  padding: "1px 5px",
  borderRadius: 4,
  background: "#eef2f7",
  color: "#5a6b7b",
  fontSize: 11,
};

const preStyle = {margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap"};

/**
 * Renders rows of live function calls: the call on the left, its result on the
 * right. It takes the same `calls` array that feeds `sourceSnippet`, so the
 * grid and the "Show code" panel can never disagree.
 *
 * Each row is `{call, result, chip?}`: `call` and `result` are display strings,
 * `chip` is an optional small tag (a locale, an option) shown before the call.
 * `renderResult(result, row)` replaces the default `<code>` result cell, e.g.
 * to draw a swatch next to a color string.
 */
export default function CallGrid({calls, renderResult}) {
  return (
    <div style={gridStyle}>
      {calls.map((row, i) => {
        const result = String(row.result);
        const cell = renderResult ? (
          renderResult(result, row)
        ) : result.includes("\n") ? (
          <pre style={preStyle}>{result}</pre>
        ) : (
          <code>{result}</code>
        );
        return (
          <React.Fragment key={`${row.call}-${i}`}>
            <div style={{textAlign: "right", color: "#666"}}>
              {row.chip ? <span style={chipStyle}>{row.chip}</span> : null}
              <code>{row.call}</code>
            </div>
            <div aria-hidden="true" style={{color: "#bbb"}}>→</div>
            <div><strong>{cell}</strong></div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
