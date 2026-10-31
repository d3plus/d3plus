import {html} from "@codemirror/lang-html";
import {javascript} from "@codemirror/lang-javascript";
import {HighlightStyle, syntaxHighlighting} from "@codemirror/language";
import {EditorState} from "@codemirror/state";
import {EditorView} from "@codemirror/view";
import {tags as t} from "@lezer/highlight";
import {basicSetup, minimalSetup} from "codemirror";

export type Language = "javascript" | "jsx" | "typescript" | "html";

export interface EditorOptions {
  parent: HTMLElement;
  doc: string;
  language: Language;
  readOnly?: boolean;
  label: string;
  onChange?: (doc: string) => void;
}

export interface Editor {
  setDoc(doc: string): void;
  setLanguage(language: Language): void;
  destroy(): void;
}

const languageSupport = (language: Language) =>
  language === "html"
    ? html()
    : javascript({
        jsx: language === "jsx",
        typescript: language === "typescript",
      });

/** Colors from the page's Starlight theme, so the editor follows light/dark. */
const theme = EditorView.theme({
  "&": {
    fontSize: "0.8125rem",
    backgroundColor: "var(--sl-color-gray-7, var(--sl-color-black))",
    color: "var(--sl-color-white)",
  },
  ".cm-content": {
    fontFamily: "var(--__sl-font-mono)",
    caretColor: "var(--sl-color-white)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--sl-color-gray-3)",
    border: "none",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor:
      "color-mix(in srgb, var(--sl-color-gray-5) 25%, transparent)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor:
      "color-mix(in srgb, var(--sl-color-accent) 30%, transparent)",
  },
  "&.cm-focused": {outline: "none"},
});

/** Token colors from `--d3p-code-*`, which playground.css sets per theme. */
const highlight = HighlightStyle.define([
  {
    tag: [t.keyword, t.modifier, t.operatorKeyword],
    color: "var(--d3p-code-keyword)",
  },
  {
    tag: [t.string, t.special(t.string), t.regexp],
    color: "var(--d3p-code-string)",
  },
  {tag: [t.number, t.bool, t.null, t.atom], color: "var(--d3p-code-number)"},
  {tag: [t.propertyName, t.attributeName], color: "var(--d3p-code-property)"},
  {
    tag: [t.definition(t.variableName), t.typeName, t.className, t.tagName],
    color: "var(--d3p-code-definition)",
  },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: "var(--d3p-code-function)",
  },
  {tag: t.comment, color: "var(--d3p-code-comment)", fontStyle: "italic"},
  {
    tag: [t.punctuation, t.operator, t.bracket],
    color: "var(--d3p-code-punctuation)",
  },
]);

/** Mounts a CodeMirror editor; read-only editors show generated snippets. */
export function createEditor(options: EditorOptions): Editor {
  const {parent, doc, readOnly = false, label, onChange} = options;
  let language = options.language;
  const extensions = () => [
    readOnly ? minimalSetup : basicSetup,
    languageSupport(language),
    syntaxHighlighting(highlight),
    theme,
    EditorView.contentAttributes.of({"aria-label": label}),
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
    EditorView.updateListener.of(update => {
      if (update.docChanged && onChange) onChange(update.state.doc.toString());
    }),
  ];
  const view = new EditorView({
    parent,
    state: EditorState.create({doc, extensions: extensions()}),
  });
  return {
    setDoc(next) {
      if (next === view.state.doc.toString()) return;
      view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: next},
      });
    },
    setLanguage(next) {
      if (next === language) return;
      language = next;
      view.setState(
        EditorState.create({
          doc: view.state.doc.toString(),
          extensions: extensions(),
        }),
      );
    },
    destroy: () => view.destroy(),
  };
}
