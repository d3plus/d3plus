import {describe, it, vi} from "vitest";
import assert from "node:assert/strict";

vi.mock("../src/lib/api.ts", async original => ({
  ...(await original()),
  loadApi: () => [
    {
      name: "Treemap",
      package: "core",
      category: "charts",
      kind: "class",
      description: "",
      flavors: [],
    },
    {
      name: "formatAbbreviate",
      package: "format",
      category: "",
      kind: "function",
      description: "",
      flavors: [],
    },
    {
      name: "formatLocale",
      package: "locales",
      category: "dictionaries",
      kind: "member",
      description: "",
      flavors: [],
    },
  ],
}));

const {legacyPages, legacyTarget} = await import("../src/lib/legacy.ts");

describe("legacyPages", () => {
  it("maps each Storybook page id to its page here", () => {
    const pages = legacyPages();
    assert.equal(pages.introduction, "/");
    assert.equal(pages["guides-legends"], "/guides/legends/");
    assert.equal(pages["core-charts-treemap"], "/core/charts/treemap/");
    assert.equal(
      pages["format-formatabbreviate"],
      "/format/format-abbreviate/",
    );
    assert.equal(
      pages["locales-dictionaries-formatlocale"],
      "/locales/dictionaries/format-locale/",
    );
  });
});

describe("legacyTarget", () => {
  const pages = {
    "core-charts-treemap": "/core/charts/treemap/",
    "guides-migration-v3-→-v4": "/guides/migration/",
  };

  it("sends a docs page to its page", () => {
    assert.equal(
      legacyTarget("?path=/docs/core-charts-treemap--docs", pages),
      "/core/charts/treemap/",
    );
    assert.equal(
      legacyTarget("?path=/docs/core-charts-treemap--d3plus", pages),
      "/core/charts/treemap/",
    );
  });

  it("sends a story to its example on the page", () => {
    assert.equal(
      legacyTarget("?path=/story/core-charts-treemap--basic-example", pages),
      "/core/charts/treemap/#basic-example",
    );
    assert.equal(
      legacyTarget(
        "?id=core-charts-treemap--basic-example&viewMode=story",
        pages,
      ),
      "/core/charts/treemap/#basic-example",
    );
  });

  it("reads an id with the characters Storybook kept, encoded or not", () => {
    assert.equal(
      legacyTarget("?path=/docs/guides-migration-v3-%E2%86%92-v4--docs", pages),
      "/guides/migration/",
    );
  });

  it("leaves any other query alone", () => {
    assert.equal(legacyTarget("", pages), undefined);
    assert.equal(legacyTarget("?q=treemap", pages), undefined);
    assert.equal(
      legacyTarget("?path=/docs/nothing-here--docs", pages),
      undefined,
    );
  });
});
