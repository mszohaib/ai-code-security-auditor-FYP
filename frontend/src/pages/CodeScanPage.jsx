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
    try {
      const data = await postJson("/api/scans", { code, language });
      const items = data.vulnerabilities || [];
      setVulnerabilities(items);
      if (items.length) {
        const first = items[0];
        setSelectedId(first.id || `${first.tool}-${first.title}-${first.line_start}`);
      }
    } catch (e) {
      setError(e.message || "Scan failed");
      setVulnerabilities([]);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="page-shell">
      <header>
        <h1 style={{ margin: "0 0 0.35rem" }}>Security scan</h1>
        <p className="muted" style={{ margin: 0 }}>
          Code is sent to the Express API, forwarded to the Flask engine, and optionally stored after each run.
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
