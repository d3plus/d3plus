import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import textWidth from "../../../dom/src/textWidth.ts";
import {
  justifyWords,
  splitRunsAtWords,
} from "../../src/components/textBoxWords.ts";

useJsdom();

it("splitRunsAtWords — gives each word the runs that draw it", () => {
  const bold = {weight: "bold"};
  const runs = [
    {text: "Hello "},
    {text: "D3plus", style: bold},
    {text: ", please"},
  ];
  const words = ["Hello ", "<b>D3plus</b>, ", "please"];
  assert.deepStrictEqual(splitRunsAtWords(runs, words), [
    [{text: "Hello "}],
    [{text: "D3plus", style: bold}, {text: ", "}],
    [{text: "please"}],
  ]);
});

it("splitRunsAtWords — splits a run that spans several words", () => {
  const italic = {style: "italic"};
  const runs = [{text: "one two three", style: italic}];
  assert.deepStrictEqual(splitRunsAtWords(runs, ["one ", "two ", "three"]), [
    [{text: "one ", style: italic}],
    [{text: "two ", style: italic}],
    [{text: "three", style: italic}],
  ]);
});

it("splitRunsAtWords — null when runs and words spell different text", () => {
  assert.strictEqual(
    splitRunsAtWords([{text: "a &amp; b"}], ["a ", "& ", "b"]),
    null,
  );
});

const style = {
  "font-family": "DejaVu Sans",
  "font-size": 14,
  "font-weight": 400,
};

it("justifyWords — plain lines keep the wrap's words", () => {
  const lineWords = [
    [
      {text: "one ", width: 30},
      {text: "two", width: 28},
    ],
  ];
  assert.deepStrictEqual(justifyWords(lineWords, null, style), lineWords);
});

it("justifyWords — styled words are measured in their own weight", () => {
  const lineWords = [
    [
      {text: "plain ", width: 0},
      {text: "<b>bold</b>", width: 0},
    ],
  ];
  const lineRuns = [[{text: "plain "}, {text: "bold", style: {weight: 700}}]];
  const [line] = justifyWords(lineWords, lineRuns, style);
  assert.strictEqual(line[0].width, textWidth("plain", style));
  assert.strictEqual(
    line[1].width,
    textWidth("bold", {...style, "font-weight": 700}),
  );
  assert.ok(line[1].width > textWidth("bold", style), "bold is wider");
  assert.deepStrictEqual(line[1].runs, [{text: "bold", style: {weight: 700}}]);
});

it("justifyWords — a line whose runs don't match is left unjustified", () => {
  const lineWords = [
    [
      {text: "a ", width: 5},
      {text: "b", width: 5},
    ],
  ];
  const [line] = justifyWords(lineWords, [[{text: "x y"}]], style);
  assert.strictEqual(line, null);
});
