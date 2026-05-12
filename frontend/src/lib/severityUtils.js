/** Normalize engine severities into display tiers. */

export function getSeverityTier(severity) {
  const s = String(severity || "").toLowerCase();
  if (s.includes("crit")) return "critical";
  if (s.includes("high")) return "high";
  if (s.includes("med")) return "medium";
  if (s.includes("low") || s === "info") return "low";
  return "other";
}

export function formatSeverityLabel(severity) {
  const s = String(severity || "").trim();
  if (!s) return "Unknown";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function countFindingsByTier(findings) {
  const buckets = { critical: 0, high: 0, medium: 0, low: 0, other: 0 };
  for (const f of findings || []) {
    const tier = getSeverityTier(f?.severity);
    if (tier === "other") buckets.other += 1;
    else buckets[tier] += 1;
  }
  return buckets;
}
