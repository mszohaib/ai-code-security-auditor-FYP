import { SeverityBadge } from "./SeverityBadge.jsx";

export function FixSuggestionsPanel({ vulnerability }) {
  if (!vulnerability) {
    return (
      <div className="card">
        <div className="card__head">
          <h2 className="panel-title">Fix suggestions</h2>
        </div>
        <p className="muted">Select a finding to view remediation guidance.</p>
      </div>
    );
  }

  return (
    <div className="card fix-panel">
      <div className="card__head card__head--wrap">
        <h2 className="panel-title">Fix suggestions</h2>
        <SeverityBadge severity={vulnerability.severity} />
      </div>
      <p className="fix-panel__lead">{vulnerability.explanation || "No narrative provided."}</p>
      {vulnerability.recommendation && (
        <div className="fix-section">
          <h3 className="fix-section__title">Recommendation</h3>
          <p className="muted">{vulnerability.recommendation}</p>
        </div>
      )}
      {vulnerability.fix_example && (
        <div className="fix-section">
          <h3 className="fix-section__title">Example fix</h3>
          <pre>{vulnerability.fix_example}</pre>
        </div>
      )}
      {vulnerability.references?.length > 0 && (
        <div className="fix-section">
          <h3 className="fix-section__title">References</h3>
          <ul className="muted fix-panel__refs">
            {vulnerability.references.map((r) => (
              <li key={r}>
                <a href={r} target="_blank" rel="noreferrer">
                  {r}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
