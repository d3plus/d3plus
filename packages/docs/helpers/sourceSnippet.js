/**
 * Builds the Storybook "Show code" parameters for a utility-function demo: an
 * import line followed by the actual function calls a user would write, each
 * with its live result shown as a comment (inline for single-line results, a
 * `// →` block for multi-line ones). Generating it from the same values the
 * demo renders keeps the snippet from drifting out of sync.
 *
 * @param {string} pkg d3plus package name, e.g. "text" -> "@d3plus/text".
 * @param {string} names named import(s), e.g. "titleCase".
 * @param {{call: string, result: string}[]} calls call source strings paired with their display results.
 */
export default function sourceSnippet(pkg, names, calls) {
  const lines = calls.map(({call, result}) => {
    const r = String(result);
    if (!r.includes("\n")) return `${call}; // ${r}`;
    const block = r
      .split("\n")
      .map((line, i) => (i === 0 ? `// → ${line}` : `//   ${line}`))
      .join("\n");
    return `${call};\n${block}`;
  });
  const code = `import {${names}} from "@d3plus/${pkg}";\n\n${lines.join("\n")}`;
  return {docs: {source: {code, language: "jsx"}}};
}
