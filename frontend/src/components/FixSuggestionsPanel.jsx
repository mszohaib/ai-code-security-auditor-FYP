export function FixSuggestionsPanel({ vulnerability }) {
  if (!vulnerability) {
    return (
      <div className="card">
        <h2 className="panel-title">Fix suggestions</h2>
        <p className="muted">Select a finding to view remediation guidance.</p>
      </div>
    );
  }

  return (
    <div className="card fix-panel">
      <h2 className="panel-title">Fix suggestions</h2>
      <p style={{ marginTop: 0 }}>{vulnerability.explanation || "No narrative provided."}</p>
      {vulnerability.recommendation && (
        <div>
          <h3 className="panel-title" style={{ fontSize: "0.95rem" }}>
            Recommendation
          </h3>
          <p className="muted">{vulnerability.recommendation}</p>
        </div>
      )}
      {vulnerability.fix_example && (
        <div>
          <h3 className="panel-title" style={{ fontSize: "0.95rem" }}>
            Example fix
          </h3>
          <pre>{vulnerability.fix_example}</pre>
        </div>
      )}
      {vulnerability.references?.length > 0 && (
        <div>
          <h3 className="panel-title" style={{ fontSize: "0.95rem" }}>
            References
          </h3>
          <ul className="muted" style={{ paddingLeft: "1.1rem" }}>
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
