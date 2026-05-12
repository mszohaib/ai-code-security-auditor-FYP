import { useMemo } from "react";
import { countFindingsByTier } from "../lib/severityUtils.js";

export function ScanSummaryBar({ findings }) {
  const counts = useMemo(() => countFindingsByTier(findings), [findings]);
  const total = findings?.length ?? 0;

  const segments = useMemo(() => {
    const rows = [
      { tier: "critical", count: counts.critical, label: "Critical" },
      { tier: "high", count: counts.high, label: "High" },
      { tier: "medium", count: counts.medium, label: "Medium" },
      { tier: "low", count: counts.low, label: "Low" },
    ].filter((r) => r.count > 0);
    if (counts.other > 0) {
      rows.push({ tier: "other", count: counts.other, label: "Other" });
    }
    return rows;
  }, [counts]);

  return (
    <div className="scan-summary-bar card card--flush">
      <div className="scan-summary-bar__header">
        <span className="scan-summary-bar__title">Scan summary</span>
        <span className="scan-summary-bar__total">
          <strong>{total}</strong>
          <span className="muted"> finding{total === 1 ? "" : "s"}</span>
        </span>
      </div>

      {total > 0 && (
        <div className="scan-summary-bar__track" aria-hidden="true">
          {segments.map(({ tier, count }) => (
            <div
              key={tier}
              className={`scan-summary-bar__seg scan-summary-bar__seg--${tier}`}
              style={{ flexGrow: Math.max(count, 0.15) }}
              title={`${count} ${tier}`}
            />
          ))}
        </div>
      )}

      <div className="scan-summary-bar__chips">
        <StatChip tier="critical" label="Critical" count={counts.critical} totalFindings={total} />
        <StatChip tier="high" label="High" count={counts.high} totalFindings={total} />
        <StatChip tier="medium" label="Medium" count={counts.medium} totalFindings={total} />
        <StatChip tier="low" label="Low" count={counts.low} totalFindings={total} />
        {counts.other > 0 && (
          <StatChip tier="other" label="Other" count={counts.other} totalFindings={total} />
        )}
      </div>

      {total === 0 && <p className="scan-summary-bar__empty muted">No issues reported in this scan.</p>}
    </div>
  );
}

function StatChip({ tier, label, count, totalFindings }) {
  return (
    <div className={`scan-stat-chip scan-stat-chip--${tier}`}>
      <span className="scan-stat-chip__label">{label}</span>
      <span className="scan-stat-chip__count">{count}</span>
      {totalFindings > 0 && count > 0 && (
        <span className="scan-stat-chip__pct muted">
          {Math.round((count / totalFindings) * 100)}%
        </span>
      )}
    </div>
  );
}
