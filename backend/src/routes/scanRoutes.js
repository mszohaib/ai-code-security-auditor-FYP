import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { analyzeCodeWithEngine } from "../services/flaskSecurityClient.js";
import { createSupabaseAdminClient } from "../services/supabaseClient.js";

export const scanRoutes = Router();

scanRoutes.post("/", requireAuth, async (req, res) => {
  const { code, language } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" });
  }

  try {
    const engineResult = await analyzeCodeWithEngine({
      code,
      language: language || "python",
    });

    const vulnerabilities = engineResult.vulnerabilities || [];
    const summary =
      vulnerabilities[0]?.title ||
      (vulnerabilities.length ? `${vulnerabilities.length} findings` : "Clean scan");

    const admin = createSupabaseAdminClient();
    const { error: insertError } = await admin.from("security_scans").insert({
      user_id: req.user.id,
      language: language || "python",
      findings_count: vulnerabilities.length,
      summary,
      raw_engine_response: engineResult,
      code_sample: code.slice(0, 8000),
    });

    if (insertError) {
      console.warn("[scans] Supabase insert failed:", insertError.message);
    }

    return res.json({
      vulnerabilities,
      meta: engineResult.meta || {},
      persisted: !insertError,
    });
  } catch (err) {
    console.error("[scans] analyze failed:", err);
    return res.status(502).json({
      error: err.message || "Security engine unavailable",
    });
  }
});

scanRoutes.get("/history", requireAuth, async (req, res) => {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("security_scans")
    .select("id, created_at, language, findings_count, summary")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ scans: data || [] });
});
