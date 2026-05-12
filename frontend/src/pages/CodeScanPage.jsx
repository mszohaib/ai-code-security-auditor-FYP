import { useMemo, useState } from "react";
import { CodeEditor } from "../components/CodeEditor.jsx";
import { VulnerabilityDashboard } from "../components/VulnerabilityDashboard.jsx";
import { FixSuggestionsPanel } from "../components/FixSuggestionsPanel.jsx";
import { postJson } from "../services/api.js";

const SAMPLE = String.raw`import sqlite3

def unsafe_login(username, password):
    conn = sqlite3.connect("app.db")
    query = "SELECT * FROM users WHERE name = '" + username + "' AND pass = '" + password + "'"
    return conn.execute(query).fetchone()
`;

export function CodeScanPage() {
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState("python");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [resultsReady, setResultsReady] = useState(false);
  const [savePayload, setSavePayload] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return vulnerabilities.find(
      (v) => (v.id || `${v.tool}-${v.title}-${v.line_start}`) === selectedId
    );
  }, [selectedId, vulnerabilities]);

  async function runScan() {
    setScanning(true);
    setError("");
    setSelectedId(null);
    setResultsReady(false);
    setSaveStatus("idle");
    setSaveMessage("");
    setSavePayload(null);
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
      if (items.length) {
        const first = items[0];
        setSelectedId(first.id || `${first.tool}-${first.title}-${first.line_start}`);
      }
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

  const saveStale =
    savePayload &&
    (savePayload.code !== code || savePayload.language !== language);

  return (
    <div className="page-shell">
      <header>
        <h1 style={{ margin: "0 0 0.35rem" }}>Security scan</h1>
        <p className="muted" style={{ margin: 0 }}>
          Run analysis against the Flask engine, then use Save scan to store results in Supabase for your
          account.
        </p>
      </header>

      <div className="scan-layout">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          onLanguageChange={setLanguage}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="toolbar" style={{ margin: 0 }}>
            <button type="button" className="btn btn-primary" onClick={runScan} disabled={scanning}>
              {scanning ? "Scanning…" : "Run scan"}
            </button>
            {resultsReady && !scanning && (
              <button
                type="button"
                className="btn"
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
            {saveMessage && (
              <span className={saveStatus === "error" ? "error-text" : "muted inline-note"}>
                {saveMessage}
              </span>
            )}
            {saveStale && (
              <span className="muted inline-note">Code or language changed — run scan again to enable save.</span>
            )}
            <span className="muted inline-note">
              Results include Bandit (Python) and Semgrep-style rules.
            </span>
          </div>
          <VulnerabilityDashboard
            vulnerabilities={vulnerabilities}
            selectedId={selectedId}
            onSelect={setSelectedId}
            scanning={scanning}
            error={error}
          />
        </div>
      </div>

      <FixSuggestionsPanel vulnerability={selected} />
    </div>
  );
}
