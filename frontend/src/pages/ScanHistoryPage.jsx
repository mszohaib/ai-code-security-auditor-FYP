import { useEffect, useState } from "react";
import { getJson } from "../services/api.js";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ScanHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getJson("/api/scans/history");
        if (!cancelled) {
          setRows(data.scans || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load history");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-shell">
      <h1 style={{ marginBottom: "0.35rem" }}>Scan history</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Recent scans saved for your account in Supabase.
      </p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="muted">No scans recorded yet. Run a scan from the scanner page.</p>
      )}
      {!loading && rows.length > 0 && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Language</th>
                <th>Findings</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatWhen(r.created_at)}</td>
                  <td>{r.language || "—"}</td>
                  <td>{r.findings_count ?? "—"}</td>
                  <td className="mono-snippet">{r.summary || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
