import React from "react";
import {SyntaxHighlighter} from "storybook/internal/components";
import {ThemeProvider, convert} from "storybook/theming";

// SyntaxHighlighter's styled wrapper reads from Storybook's theming context.
// Docs pages supply it, but the bare story canvas does not — provide it here so
// the blocks render in both views.
const theme = convert();

/**
 * Displays a utility-function demo as two syntax-highlighted code blocks sitting
 * side-by-side — the call/input on the left, the returned value on the right —
 * separated by an arrow. Used by the function docs (Data / Text / Format / Color)
 * to show input → output at a glance.
 */
export default function FunctionExample({input, output, language = "jsx"}) {
  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: 13,
        }}
      >
        <div style={{flex: "1 1 0", minWidth: 0}}>
          <SyntaxHighlighter language={language} copyable bordered padded>
            {input}
          </SyntaxHighlighter>
        </div>
        <div
          aria-hidden="true"
          style={{flex: "0 0 auto", fontSize: 18, lineHeight: 1, color: "#444", fontWeight: "bold"}}
        >
          →
        </div>
        <div style={{flex: "1 1 0", minWidth: 0}}>
          <SyntaxHighlighter language={language} copyable bordered padded>
            {output}
          </SyntaxHighlighter>
        </div>
      </div>
    </ThemeProvider>
  );
}
