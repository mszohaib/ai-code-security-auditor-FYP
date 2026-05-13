import { Fragment, useEffect, useState } from "react";
import { getJson } from "../services/api.js";
import { normalizeStoredScan } from "../lib/scanPayload.js";
import { SavedScanCodePanel } from "../components/SavedScanCodePanel.jsx";
import { ScanResultsView } from "../components/ScanResultsView.jsx";

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
  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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

  async function toggleRow(id) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailError("");
      return;
    }

    setExpandedId(id);
    setDetailError("");

    if (detailCache[id]) {
      return;
    }

    setDetailLoading(true);
    try {
      const data = await getJson(`/api/scans/${id}`);
      setDetailCache((prev) => ({
        ...prev,
        [id]: normalizeStoredScan(data.scan),
      }));
    } catch (e) {
      setDetailError(e.message || "Failed to load scan");
      setExpandedId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function onRowKeyDown(e, id) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleRow(id);
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="page-header__eyebrow">Your workspace</p>
        <h1 className="page-header__title">Scan history</h1>
        <p className="page-header__desc muted">Recent scans saved for your account in Supabase.</p>
      </header>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="muted">No scans recorded yet. Run a scan from the scanner page.</p>
      )}
      {!loading && rows.length > 0 && (
        <div className="card card--table">
          <table className="history-table">
            <thead>
              <tr>
                <th className="history-table__col-expand" aria-label="Expand" />
                <th>When</th>
                <th>Language</th>
                <th>Findings</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOpen = expandedId === r.id;
                const detail = detailCache[r.id];
                return (
                  <Fragment key={r.id}>
                    <tr
                      className={`history-row--interactive${isOpen ? " history-row--expanded" : ""}`}
                      onClick={() => toggleRow(r.id)}
                      onKeyDown={(e) => onRowKeyDown(e, r.id)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? "Collapse" : "Expand"} scan from ${formatWhen(r.created_at)}`}
                    >
                      <td className="history-table__col-expand">
                        <span className={`history-chevron${isOpen ? " history-chevron--open" : ""}`} aria-hidden="true" />
                      </td>
                      <td className="history-table__when">{formatWhen(r.created_at)}</td>
                      <td>
                        <span className="tag tag--lang">{r.language || "—"}</span>
                      </td>
                      <td>
                        <span
                          className={`history-count${(r.findings_count ?? 0) > 0 ? " history-count--warn" : ""}`}
                        >
                          {r.findings_count ?? "—"}
                        </span>
                      </td>
                      <td className="mono-snippet history-table__summary">{r.summary || ""}</td>
                    </tr>
                    {isOpen && (
                      <tr className="history-expanded">
                        <td colSpan={5} className="history-expanded__cell">
                          {detailLoading && !detail && (
                            <p className="muted history-expanded__loading">Loading scan details…</p>
                          )}
                          {detailError && <p className="error-text">{detailError}</p>}
                          {detail && (
                            <div className="history-expanded__body">
                              <ScanResultsView
                                key={r.id}
                                leftColumn={<SavedScanCodePanel code={detail.code} language={detail.language} />}
                                toolbar={
                                  <div className="toolbar toolbar--saved-meta">
                                    <span className="muted text-small">
                                      Saved scan · {formatWhen(detail.created_at)}
                                    </span>
                                    <span className="muted text-small">
                                      {detail.findings_count ?? detail.vulnerabilities?.length ?? 0} finding
                                      {(detail.findings_count ?? detail.vulnerabilities?.length ?? 0) === 1
                                        ? ""
                                        : "s"}
                                    </span>
                                  </div>
                                }
                                vulnerabilities={detail.vulnerabilities}
                                showSummary
                                scanning={false}
                                error=""
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
