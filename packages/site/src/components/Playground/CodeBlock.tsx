import {useEffect, useRef, useState} from "preact/hooks";

import type {Editor, Language} from "./editor.js";

interface CodeBlockProps {
  doc: string;
  /**
   * For an editable block, bumped when `doc` changes from outside the editor
   * (a control, a reset). The editor's own edits reach `doc` a render late,
   * so pushing every `doc` back into it would undo fast typing.
   */
  revision?: number;
  language: Language;
  label: string;
  readOnly?: boolean;
  onChange?: (doc: string) => void;
}

/**
 * A CodeMirror editor, loaded the first time a playground shows code so
 * pages that only look at charts never download it. Until it loads, the
 * code shows as plain text.
 */
export default function CodeBlock({
  doc,
  revision = 0,
  language,
  label,
  readOnly,
  onChange,
}: CodeBlockProps) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<Editor | null>(null);
  const changed = useRef(onChange);
  changed.current = onChange;
  const latest = useRef(doc);
  latest.current = doc;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    import("./editor.js").then(({createEditor}) => {
      if (!alive || !host.current) return;
      editor.current = createEditor({
        parent: host.current,
        doc: latest.current,
        language,
        label,
        readOnly,
        onChange: next => changed.current?.(next),
      });
      setReady(true);
    });
    return () => {
      alive = false;
      editor.current?.destroy();
      editor.current = null;
    };
  }, []);

  useEffect(
    () => editor.current?.setDoc(latest.current),
    [readOnly ? doc : revision],
  );
  useEffect(() => editor.current?.setLanguage(language), [language]);

  return (
    <div class="d3p-code">
      {!ready && <pre>{doc}</pre>}
      <div ref={host} />
    </div>
  );
}
