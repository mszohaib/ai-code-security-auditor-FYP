import { useState } from "react";

export function FixedCodePanel({ fixedCode }) {
  const [copyState, setCopyState] = useState("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(fixedCode);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  return (
    <div className="card fixed-code-panel">
      <div className="card__head fixed-code-panel__head">
        <h2 className="panel-title">AI-fixed code</h2>
        <button type="button" className="btn btn-secondary btn--sm" onClick={copy}>
          {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy fixed code"}
        </button>
      </div>
      <p className="muted text-small card__lede">
        Gemini rewrite of your source with reported issues addressed. Review before use.
      </p>
      <textarea
        className="code-input code-input--readonly"
        readOnly
        spellCheck={false}
        value={fixedCode}
        aria-label="AI-fixed source code"
      />
    </div>
  );
}
