import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { analyzeCodeWithEngine } from "../services/flaskSecurityClient.js";
import { rewriteCodeWithGroq } from "../services/groqAutofix.js";
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

    return res.json({
      vulnerabilities,
      meta: engineResult.meta || {},
    });
  } catch (err) {
    console.error("[scans] analyze failed:", err);
    return res.status(502).json({
      error: err.message || "Security engine unavailable",
    });
  }
});

scanRoutes.post("/save", requireAuth, async (req, res) => {
  const { code, language, vulnerabilities, meta } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" });
  }
  if (!Array.isArray(vulnerabilities)) {
    return res.status(400).json({ error: "vulnerabilities must be an array" });
  }

  const summary =
    vulnerabilities[0]?.title ||
    (vulnerabilities.length ? `${vulnerabilities.length} findings` : "Clean scan");

  const admin = createSupabaseAdminClient();
  const rawPayload = {
    vulnerabilities,
    meta: meta && typeof meta === "object" ? meta : {},
    saved_at: new Date().toISOString(),
  };

  const { data, error: insertError } = await admin
    .from("security_scans")
    .insert({
      user_id: req.user.id,
      language: language || "python",
      findings_count: vulnerabilities.length,
      summary,
      raw_engine_response: rawPayload,
      code_sample: code.slice(0, 8000),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[scans] save failed:", insertError.message);
    return res.status(400).json({ error: insertError.message });
  }

  return res.status(201).json({ ok: true, id: data?.id });
});

scanRoutes.post("/autofix", requireAuth, async (req, res) => {
  const { code, language, vulnerabilities } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" });
  }
  if (!Array.isArray(vulnerabilities)) {
    return res.status(400).json({ error: "vulnerabilities must be an array" });
  }

  try {
    const fixed_code = await rewriteCodeWithGroq(code, language || "python", vulnerabilities);
    return res.json({ fixed_code });
  } catch (err) {
    const status = Number(err.status) || 500;
    console.error("[scans/autofix]", err);
    return res.status(status).json({ error: err.message || "Autofix failed" });
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

scanRoutes.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!id || id === "history" || id === "autofix") {
    return res.status(404).json({ error: "Scan not found" });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("security_scans")
    .select("id, created_at, language, findings_count, summary, code_sample, raw_engine_response")
    .eq("id", id)
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "Scan not found" });
  }

  return res.json({ scan: data });
});
