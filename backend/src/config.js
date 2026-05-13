import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  securityEngineUrl: (process.env.SECURITY_ENGINE_URL || "http://127.0.0.1:5001").replace(
    /\/$/,
    ""
  ),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiAutofixModel:
    process.env.GEMINI_AUTOFIX_MODEL || "gemini-2.5-flash",
};

export function assertConfig() {
  const missing = [];
  if (!config.supabaseUrl) missing.push("SUPABASE_URL");
  if (!config.supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.warn(
      `[config] Missing environment variables: ${missing.join(", ")} — auth and persistence will fail until set.`
    );
  }
}
