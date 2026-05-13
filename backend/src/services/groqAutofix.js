import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const MAX_CODE_CHARS = 3000;
const MAX_VULNS = 5;
const REQUEST_MS = 120_000;

function summarizeVulnerabilities(vulnerabilities) {
  const list = Array.isArray(vulnerabilities) ? vulnerabilities.slice(0, MAX_VULNS) : [];
  return list.map((v) => ({
    id: v.id,
    title: v.title,
    severity: v.severity,
    tool: v.tool,
    line_start: v.line_start,
    line_end: v.line_end,
    snippet: typeof v.snippet === "string" ? v.snippet.slice(0, 400) : "",
    recommendation: typeof v.recommendation === "string" ? v.recommendation.slice(0, 300) : "",
    explanation: typeof v.explanation === "string" ? v.explanation.slice(0, 300) : "",
  }));
}

function parseFixedCodeJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  let cleaned = raw.trim();
  const fence = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) cleaned = fence[1].trim();
  try {
    const data = JSON.parse(cleaned);
    if (data && typeof data.fixed_code === "string") return data.fixed_code;
    return null;
  } catch {
    return null;
  }
}

/**
 * Rewrite source using Google Gemini (same export name for callers).
 * @returns {Promise<string>}
 */
export async function rewriteCodeWithGroq(code, language, vulnerabilities) {
  const apiKey = (config.geminiApiKey || "").trim();
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured on the server");
    err.status = 503;
    throw err;
  }

  const body = code.length > MAX_CODE_CHARS ? code.slice(0, MAX_CODE_CHARS) : code;
  const vulnJson = JSON.stringify(summarizeVulnerabilities(vulnerabilities), null, 2);

  const system =
    "You are an expert application security engineer. You must respond with a single JSON object only, " +
    'no markdown fences, using the shape {"fixed_code":"<complete rewritten source>"}. ' +
    "The fixed_code value must be the entire file or program text with every listed vulnerability remediated, " +
    `preserving language (${language}), imports, and behavior where safe. Escape newlines and quotes properly inside the JSON string.`;

  const user =
    `Language / context: ${language}\n\n` +
    `Here is the complete original source code:\n\n---BEGIN_CODE---\n${body}\n---END_CODE---\n\n` +
    `Static analysis reported these issues (JSON):\n${vulnJson}\n\n` +
    "Rewrite the full code so all issues are fixed. Return only the JSON object with key fixed_code.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: config.geminiAutofixModel,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
    systemInstruction: system,
  });

  const run = async () => {
    const result = await model.generateContent(user);
    const response = result.response;
    return typeof response.text === "function" ? response.text() : "";
  };

  let raw = "";
  try {
    raw = await Promise.race([
      run(),
      new Promise((_, reject) => {
        setTimeout(() => {
          const err = new Error("Autofix request timed out");
          err.status = 504;
          reject(err);
        }, REQUEST_MS);
      }),
    ]);
  } catch (e) {
    if (e?.status === 504) throw e;
    const err = new Error(e?.message || "Gemini request failed");
    err.status = 502;
    throw err;
  }

  const fixed = parseFixedCodeJson(raw);
  if (!fixed || !fixed.trim()) {
    const err = new Error("Gemini returned no usable fixed_code");
    err.status = 502;
    throw err;
  }
  return fixed;
}
