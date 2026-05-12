import { formatSeverityLabel, getSeverityTier } from "../lib/severityUtils.js";

export function SeverityBadge({ severity, className = "" }) {
  const tier = getSeverityTier(severity);
  const label = formatSeverityLabel(severity);
  return (
    <span className={`severity-badge severity-badge--${tier} ${className}`.trim()}>
      {label}
    </span>
  );
}
