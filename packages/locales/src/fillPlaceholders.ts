/**
    Fills a translated string's numbered placeholders (`{0}`, `{1}`, …) with
    `args`, so each language can put them where its word order needs them.
    A placeholder used more than once is filled each time; one without a
    matching argument (missing, `undefined`, or `null`) is left as written.
    @param text The translated string.
    @param args The values for `{0}`, `{1}`, and so on.
*/
export default function fillPlaceholders(
  text: string,
  args: readonly unknown[],
): string {
  if (!args.length) return text;
  return text.replace(/\{(\d+)\}/g, (match, index: string) => {
    const value = args[Number(index)];
    return value === undefined || value === null ? match : String(value);
  });
}
