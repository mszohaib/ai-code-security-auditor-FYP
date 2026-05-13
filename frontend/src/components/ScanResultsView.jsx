import { VulnerabilityDashboard } from "./VulnerabilityDashboard.jsx";
import { ScanSummaryBar } from "./ScanSummaryBar.jsx";

export function ScanResultsView({
  leftColumn,
  toolbar = null,
  vulnerabilities,
  showSummary = true,
  scanning = false,
  error = "",
}) {
  return (
    <div className="scan-page-stack">
      <section className="scan-code-stage" aria-label="Source code">
        {leftColumn}
      </section>
      <section className="scan-results-stage" aria-label="Scan results and remediation">
        {toolbar}
        {showSummary && !scanning && <ScanSummaryBar findings={vulnerabilities} />}
        <VulnerabilityDashboard vulnerabilities={vulnerabilities} scanning={scanning} error={error} />
      </section>
    </div>
  );
}
