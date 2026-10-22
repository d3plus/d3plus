const isHeading = line => /^##\s+/.test(line);
const headingName = line =>
  line
    .replace(/^##\s+/, "")
    .trim()
    .split(/\s+/)[0];

/**
 * The body of the CHANGELOG section whose `## ` heading starts with `name`
 * (a version, or "Unreleased"), or null when there is none or it is empty.
 * @param {string} text CHANGELOG.md
 * @param {string} name
 * @returns {string | null}
 */
export function changelogSection(text, name) {
  const lines = text.split("\n");
  const start = lines.findIndex(l => isHeading(l) && headingName(l) === name);
  if (start === -1) return null;
  const next = lines.findIndex((l, i) => i > start && isHeading(l));
  const end = next === -1 ? lines.length : next;
  return (
    lines
      .slice(start + 1, end)
      .join("\n")
      .trim() || null
  );
}

/**
 * The CHANGELOG with its "Unreleased" section retitled as `version`, unless
 * a section for `version` already exists.
 * @param {string} text CHANGELOG.md
 * @param {string} version
 * @returns {string}
 */
export function releaseChangelog(text, version) {
  if (changelogSection(text, version) !== null) return text;
  return text.replace(/^##\s+Unreleased\s*$/m, `## ${version}`);
}
