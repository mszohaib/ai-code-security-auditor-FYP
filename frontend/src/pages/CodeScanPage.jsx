import { useEffect, useState } from "react";
import { CodeEditor } from "../components/CodeEditor.jsx";
import { FixedCodePanel } from "../components/FixedCodePanel.jsx";
import { ScanResultsView } from "../components/ScanResultsView.jsx";
import { postJson } from "../services/api.js";

const SAMPLE = String.raw`import sqlite3

def unsafe_login(username, password):
    conn = sqlite3.connect("app.db")
    query = "SELECT * FROM users WHERE name = '" + username + "' AND pass = '" + password + "'"
    return conn.execute(query).fetchone()
`;

const AI_WARN_CHARS = 3000;
const AI_MAX_CHARS = 5000;

export function CodeScanPage() {
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState("python");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [resultsReady, setResultsReady] = useState(false);
  const [savePayload, setSavePayload] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [fixedCode, setFixedCode] = useState(null);
  const [autofixLoading, setAutofixLoading] = useState(false);
  const [autofixError, setAutofixError] = useState("");

  const saveStale =
    savePayload &&
    (savePayload.code !== code || savePayload.language !== language);

  useEffect(() => {
    if (saveStale) {
      setFixedCode(null);
      setAutofixError("");
    }
  }, [saveStale]);

  async function runScan() {
    setScanning(true);
    setError("");
    setResultsReady(false);
    setSaveStatus("idle");
    setSaveMessage("");
    setSavePayload(null);
    setFixedCode(null);
    setAutofixError("");
    try {
      const data = await postJson("/api/scans", { code, language });
      const items = data.vulnerabilities || [];
      const meta = data.meta && typeof data.meta === "object" ? data.meta : {};
      setVulnerabilities(items);
      setSavePayload({
        code,
        language,
        vulnerabilities: items,
        meta,
      });
      setResultsReady(true);
    } catch (e) {
      setError(e.message || "Scan failed");
      setVulnerabilities([]);
      setSavePayload(null);
      setResultsReady(false);
    } finally {
      setScanning(false);
    }
  }

  async function saveScan() {
    if (!savePayload) {
      setSaveMessage("Run a scan before saving.");
      setSaveStatus("error");
      return;
    }
    if (savePayload.code !== code || savePayload.language !== language) {
      setSaveMessage("Code or language changed since this scan. Run scan again before saving.");
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    setSaveMessage("");
    try {
      await postJson("/api/scans/save", {
        code: savePayload.code,
        language: savePayload.language,
        vulnerabilities: savePayload.vulnerabilities,
        meta: savePayload.meta,
      });
      setSaveStatus("saved");
      setSaveMessage("Scan saved to your history.");
    } catch (e) {
      setSaveStatus("error");
      setSaveMessage(e.message || "Could not save scan");
    }
  }

  async function autoFixAll() {
    setAutofixLoading(true);
    setAutofixError("");
    try {
      const data = await postJson("/api/scans/autofix", {
        code,
        language,
        vulnerabilities,
      });
      const next = data.fixed_code;
      if (typeof next !== "string" || !next.trim()) {
        throw new Error("Server returned no fixed code");
      }
      setFixedCode(next);
    } catch (e) {
      setAutofixError(e.message || "Auto fix failed");
      setFixedCode(null);
    } finally {
      setAutofixLoading(false);
    }
  }

  const charCount = code.length;
  const codeTooLargeForAi = charCount > AI_MAX_CHARS;
  const codeWarnAi = charCount > AI_WARN_CHARS && charCount <= AI_MAX_CHARS;

  const codeEditorFooter = (
    <div className="code-editor-footer">
      <div className="code-char-counter text-small">
        <span
          className={
            charCount > AI_MAX_CHARS
              ? "code-char-counter--critical"
              : charCount > AI_WARN_CHARS
                ? "code-char-counter--high"
                : "muted"
          }
        >
          {charCount.toLocaleString()} characters
        </span>
      </div>
      {codeTooLargeForAi && (
        <div className="code-warn-banner code-warn-banner--red" role="alert">
          🚫 Code too large for AI features. Please paste a smaller section under 3000 characters.
        </div>
      )}
      {codeWarnAi && (
        <div className="code-warn-banner code-warn-banner--yellow" role="status">
          ⚠️ Code exceeds 3000 characters. Auto Fix All may not work. Try a smaller snippet.
        </div>
      )}
    </div>
  );

  const toolbar = (
    <div className="toolbar toolbar--actions">
      <div className="toolbar__primary">
        <button type="button" className="btn btn-primary" onClick={runScan} disabled={scanning}>
          {scanning ? "Scanning…" : "Run scan"}
        </button>
        {resultsReady && !scanning && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={saveScan}
            disabled={saveStatus === "saving" || saveStale}
            title={
              saveStale
                ? "Re-run scan after editing code or changing language"
                : undefined
            }
          >
            {saveStatus === "saving" ? "Saving…" : "Save scan"}
          </button>
        )}
        {resultsReady && !scanning && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={autoFixAll}
            disabled={autofixLoading || saveStale || codeTooLargeForAi}
            title={
              saveStale
                ? "Re-run scan after editing code or changing language"
                : codeTooLargeForAi
                  ? "Code must be 5000 characters or fewer to use Auto Fix All"
                  : undefined
            }
          >
            {autofixLoading ? "Fixing…" : "Auto fix all"}
          </button>
        )}
      </div>
      <div className="toolbar__meta">
        {saveMessage && (
          <span className={saveStatus === "error" ? "error-text text-small" : "muted text-small"}>
            {saveMessage}
          </span>
        )}
        {autofixError && <span className="error-text text-small">{autofixError}</span>}
        {saveStale && (
          <span className="muted text-small">Code or language changed — run scan again to save.</span>
        )}
        <span className="muted text-small">Bandit (Python) · Semgrep rules</span>
      </div>
    </div>
  );

  const codeColumn = (
    <div className={`scan-code-pair${fixedCode != null ? " scan-code-pair--split" : ""}`}>
      <CodeEditor
        value={code}
        onChange={setCode}
        language={language}
        onLanguageChange={setLanguage}
        footer={codeEditorFooter}
      />
      {fixedCode != null && <FixedCodePanel fixedCode={fixedCode} />}
    </div>
  );

  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-header__eyebrow">Static analysis</p>
        <h1 className="page-header__title">Security scan</h1>
        <p className="page-header__desc muted">
          Run analysis against the Flask engine, then use Save scan to store results in Supabase for your
          account.
        </p>
      </header>

      <ScanResultsView
        leftColumn={codeColumn}
        toolbar={toolbar}
        vulnerabilities={vulnerabilities}
        showSummary={resultsReady && !scanning}
        scanning={scanning}
        error={error}
      />
    </div>
  );
}
