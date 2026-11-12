/**
    Ends cut text with "...", first dropping its trailing periods, commas, and
    spaces, so a decimal or an abbreviation inside the text survives.
    @param text The text kept before the ellipsis.
*/
export function textEllipsis(text: string): string {
  return `${text.replace(/[.,\s]+$/, "")}...`;
}
