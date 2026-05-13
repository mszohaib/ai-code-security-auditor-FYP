/** Normalize security_scans row from API for the results UI. */

export function normalizeStoredScan(scan) {
  if (!scan || typeof scan !== "object") {
    return {
      code: "",
      language: "python",
      vulnerabilities: [],
      meta: {},
      id: null,
      created_at: null,
      summary: "",
      findings_count: 0,
    };
  }

  const raw = scan.raw_engine_response;
  let vulnerabilities = [];
  let meta = {};

  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.vulnerabilities)) {
      vulnerabilities = raw.vulnerabilities;
    }
    if (raw.meta && typeof raw.meta === "object") {
      meta = raw.meta;
    }
  }

  return {
    id: scan.id,
    created_at: scan.created_at,
    summary: scan.summary ?? "",
    findings_count: scan.findings_count ?? 0,
    code: typeof scan.code_sample === "string" ? scan.code_sample : "",
    language: scan.language || "python",
    vulnerabilities,
    meta,
  };
}
