import React, {useState} from "react";
import {SyntaxHighlighter} from "storybook/internal/components";
import {ThemeProvider, convert} from "storybook/theming";

import sourceSnippet from "./sourceSnippet.js";

const theme = convert();

/**
 * The "Show code" parameters for a dictionary lookup, e.g.
 * `formatLocale["en-US"]` followed by the entry it returns.
 */
export function dictionaryParams(pkg, name, key, entry) {
  return sourceSnippet(pkg, name, [
    {call: `${name}[${JSON.stringify(key)}]`, result: JSON.stringify(entry, null, 2)},
  ]);
}

/**
 * Explores a locale dictionary from @d3plus/locales: a `<select>` of its keys,
 * the chosen entry as highlighted JSON, and an optional live `preview(entry,
 * key)` showing the entry in use.
 */
export default function DictionaryExample({dictionary, initial, preview, language = "json"}) {
  const keys = Object.keys(dictionary);
  const [key, setKey] = useState(initial ?? keys[0]);
  const entry = dictionary[key];
  return (
    <ThemeProvider theme={theme}>
      <div style={{display: "grid", gap: 12, fontSize: 13, maxWidth: 760}}>
        <label style={{display: "flex", alignItems: "center", gap: 8, fontFamily: "ui-monospace, monospace"}}>
          key
          <select value={key} onChange={e => setKey(e.target.value)} style={{fontSize: 13}}>
            {keys.map(k => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {preview ? <div>{preview(entry, key)}</div> : null}
        <SyntaxHighlighter language={language} copyable bordered padded>
          {JSON.stringify(entry, null, 2)}
        </SyntaxHighlighter>
      </div>
    </ThemeProvider>
  );
}
