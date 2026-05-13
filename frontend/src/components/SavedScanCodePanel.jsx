export function SavedScanCodePanel({ code, language }) {
  const lang = language || "—";
  return (
    <div className="card">
      <div className="card__head">
        <h2 className="panel-title">Code input</h2>
      </div>
      <p className="muted text-small card__lede">
        Saved snapshot (read-only). Bandit runs on Python; Semgrep rules target multiple languages depending on
        your selection.
      </p>
      <textarea
        className="code-input code-input--readonly"
        readOnly
        spellCheck={false}
        value={code || ""}
        aria-label="Saved code sample"
      />
      <div className="toolbar toolbar--tight">
        <div className="field-inline">
          <span className="muted text-small">Language</span>
          <div className="lang-readonly">{lang}</div>
        </div>
      </div>
    </div>
  );
}
