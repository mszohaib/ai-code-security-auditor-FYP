export function CodeEditor({ value, onChange, language, onLanguageChange, footer = null }) {
  return (
    <div className="card">
      <div className="card__head">
        <h2 className="panel-title">Code input</h2>
      </div>
      <p className="muted text-small card__lede">
        Paste a snippet or full file. Bandit runs on Python; Semgrep rules target multiple languages
        depending on your selection.
      </p>
      <textarea
        className="code-input"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# Paste code here&#10;def example():&#10;    pass"
      />
      {footer}
      <div className="toolbar toolbar--tight">
        <label className="field-inline">
          <span className="muted text-small">Language</span>
          <select className="lang-select" value={language} onChange={(e) => onLanguageChange(e.target.value)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="generic">Generic / auto</option>
          </select>
        </label>
      </div>
    </div>
  );
}
