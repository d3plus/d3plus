import {useEffect, useState} from "preact/hooks";

import CodeBlock from "./CodeBlock.js";
import {HELPERS} from "./evaluate.js";
import {onFlavor, readFlavor, writeFlavor} from "./flavorStore.js";
import {FLAVORS, usedHelpers} from "./snippets/index.js";

interface SnippetsProps {
  name: string;
  code: string;
  /** The flavor ids this class can be shown in. */
  flavors: string[];
  height: number;
}

/**
 * The playground's code in every framework that can render the class, with a
 * copy button. The flavor shown is the reader's remembered choice, shared by
 * every playground on the page.
 */
export default function Snippets({name, code, flavors, height}: SnippetsProps) {
  const available = FLAVORS.filter(f => flavors.includes(f.id));
  const [flavor, setFlavor] = useState(available[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const pick = (label: string | null) => {
      const match = available.find(f => f.label === label);
      if (match) setFlavor(match);
    };
    pick(readFlavor());
    return onFlavor(pick);
  }, []);

  const snippet = flavor.render({
    name,
    code,
    helpers: usedHelpers(code, HELPERS),
    height,
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div class="d3p-snippet">
      <div class="d3p-flavors" role="group" aria-label="Framework">
        {available.map(f => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === flavor.id}
            title={f.short ? f.label : undefined}
            onClick={() => {
              setFlavor(f);
              writeFlavor(f.label);
            }}
          >
            {f.short ?? f.label}
          </button>
        ))}
        <button type="button" class="d3p-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <CodeBlock
        doc={snippet}
        language={flavor.language}
        label={`${name} in ${flavor.label}`}
        readOnly
      />
    </div>
  );
}
