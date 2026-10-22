import {describe, it} from "vitest";
import assert from "node:assert";
import {changelogSection, releaseChangelog} from "../utils/changelog.js";

const text = `# Changelog

## Unreleased

### Added

- New thing.

## 4.8.0

4.8 notes.

## 4.7.0 (2026-01-01)

4.7 notes.
`;

describe("changelogSection", () => {
  it("returns a section's body up to the next heading", () => {
    assert.strictEqual(
      changelogSection(text, "Unreleased"),
      "### Added\n\n- New thing.",
    );
    assert.strictEqual(changelogSection(text, "4.8.0"), "4.8 notes.");
  });

  it("matches a heading by its first word, ignoring a date after it", () => {
    assert.strictEqual(changelogSection(text, "4.7.0"), "4.7 notes.");
  });

  it("returns null for a missing or empty section", () => {
    assert.strictEqual(changelogSection(text, "4.9.0"), null);
    assert.strictEqual(
      changelogSection("## 1.0.0\n\n## 0.9.0\n", "1.0.0"),
      null,
    );
  });
});

describe("releaseChangelog", () => {
  it("retitles the Unreleased section as the new version", () => {
    const out = releaseChangelog(text, "5.0.0");
    assert.ok(!out.includes("## Unreleased"));
    assert.strictEqual(
      changelogSection(out, "5.0.0"),
      "### Added\n\n- New thing.",
    );
    assert.strictEqual(changelogSection(out, "4.8.0"), "4.8 notes.");
  });

  it("leaves the CHANGELOG alone when the version already has a section", () => {
    assert.strictEqual(releaseChangelog(text, "4.8.0"), text);
  });

  it("leaves a CHANGELOG with no Unreleased section alone", () => {
    const released = text.replace("## Unreleased", "## 4.9.0");
    assert.strictEqual(releaseChangelog(released, "5.0.0"), released);
  });
});
