/**
 * Renders the small Markdown subset the source comments use (paragraphs,
 * fenced code, `code`, **bold**, *emphasis*, [links](url)) to HTML. The API
 * descriptions are short, so this stands in for a full Markdown pipeline.
 */

const escape = (s: string) =>
  s.replace(
    /[&<>"]/g,
    c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]!,
  );

/** Inline Markdown in one escaped line of text. */
export function inline(text: string): string {
  // Code spans are set aside behind private-use placeholders so the other
  // rules can't rewrite their contents.
  const code: string[] = [];
  return escape(text)
    .replace(/`([^`]+)`/g, (_, c) => `\uE000${code.push(c) - 1}\uE001`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) =>
      /^(https?:|\/|#)/.test(href) ? `<a href="${href}">${label}</a>` : label,
    )
    .replace(/\uE000(\d+)\uE001/g, (_, i) => `<code>${code[Number(i)]}</code>`);
}

/** Block Markdown: paragraphs and fenced code. */
export function markdown(text: string): string {
  if (!text) return "";
  const out: string[] = [];
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/^```[^\n]*\n([\s\S]*?)^```\s*$/m);
  blocks.forEach((block, i) => {
    if (i % 2) {
      out.push(`<pre><code>${escape(block.replace(/\n$/, ""))}</code></pre>`);
      return;
    }
    for (const para of block.split(/\n\s*\n/)) {
      const lines = para.trim();
      if (lines) out.push(`<p>${inline(lines.replace(/\s*\n\s*/g, " "))}</p>`);
    }
  });
  return out.join("\n");
}
