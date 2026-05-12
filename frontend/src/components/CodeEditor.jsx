export function CodeEditor({ value, onChange, language, onLanguageChange }) {
  return (
    <div className="card">
      <h2 className="panel-title">Code input</h2>
      <p className="muted inline-note" style={{ marginTop: 0 }}>
        Paste a snippet or full file. Bandit runs on Python; Semgrep rules target
        multiple languages depending on your selection.
      </p>
      <textarea
        className="code-input"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# Paste code here&#10;def example():&#10;    pass"
      />
      <div className="toolbar">
        <label className="muted" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          Language
          <select
            className="lang-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
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
