import assert from "assert";
import {default as titleCase} from "../es/src/titleCase.js";
import it from "./jsdom.js";

it("titleCase", () => {
  assert.strictEqual(
    titleCase("mcDonald"),
    "McDonald",
    "Preserves mid-word capitals",
  );

  assert.strictEqual(
    titleCase("Group A"),
    "Group A",
    "Preserves end-word lowercases",
  );

  assert.strictEqual(titleCase("this-that"), "This-That", "Non-space Break");

  assert.strictEqual(
    titleCase("this and that"),
    "This and That",
    "Lowercase Word",
  );

  assert.strictEqual(
    titleCase("CEOs on TV"),
    "CEOs on TV",
    "Uppercase Words (plural and singular)",
  );

  assert.strictEqual(
    titleCase("contribution"),
    "Contribution",
    "Hyphenated syllables are treated as one word",
  );

  assert.strictEqual(
    titleCase("the contribution of technology"),
    "The Contribution of Technology",
    "Hyphenated syllables in a sentence context",
  );

  assert.strictEqual(
    titleCase("SOUTH BY SOUTHWEST"),
    "South by Southwest",
    "All-caps input is normalized to title case",
  );

  assert.strictEqual(
    titleCase("jack smith, ceo"),
    "Jack Smith, CEO",
    "Lowercase acronyms are forced uppercase",
  );

  assert.strictEqual(
    titleCase("OF MICE AND MEN"),
    "Of Mice and Men",
    "First/last words capitalized, middle minor words lowered",
  );

  assert.strictEqual(
    titleCase("what to look for"),
    "What to Look For",
    "Last word is capitalized even when it's a minor word",
  );

  assert.strictEqual(
    titleCase("meeting with NASA"),
    "Meeting with NASA",
    "All-caps token in mixed text is left intact (likely an acronym)",
  );

  assert.strictEqual(
    titleCase("this is a test"),
    "This Is a Test",
    "Lowercase minor word stays lowered mid-title",
  );

  assert.strictEqual(
    titleCase("roe v. wade"),
    "Roe v. Wade",
    "Minor word matches even with trailing punctuation",
  );

  assert.strictEqual(
    titleCase("this is it"),
    "This Is It",
    "Words that are also dictionary words (it/id) are no longer forced uppercase",
  );

  assert.strictEqual(
    titleCase("le sud par le sud-ouest", "fr-FR"),
    "Le Sud par le Sud-Ouest",
    "Title-cases using the locale's minor-word list",
  );

  assert.strictEqual(
    titleCase("LE SUD PAR LE SUD-OUEST", "fr-FR"),
    "Le Sud par le Sud-Ouest",
    "Normalizes an all-caps string in a non-English locale",
  );

  assert.strictEqual(
    titleCase("le sud par le sud-ouest", {style: "sentence"}),
    "Le sud par le sud-ouest",
    "An explicit sentence-style rules object capitalizes only the first word",
  );

  assert.strictEqual(
    titleCase("south by southwest", {style: "title", lowercase: ["by"]}),
    "South by Southwest",
    "Accepts an explicit rules object",
  );

  assert.strictEqual(
    titleCase("the ios app and saas platform"),
    "The iOS App and SaaS Platform",
    "Mixed-case acronyms keep their canonical casing",
  );

  assert.strictEqual(
    titleCase("le pdg du groupe", "fr-FR"),
    "Le PDG du Groupe",
    "Per-language acronyms are forced uppercase",
  );

  assert.strictEqual(
    titleCase("die gmbh und ihre mwst", "de-DE"),
    "Die GmbH und Ihre MwSt",
    "German mixed-case acronyms with minor words lowered",
  );
});
