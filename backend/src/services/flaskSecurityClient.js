import fetch from "node-fetch";
import { config } from "../config.js";

export async function analyzeCodeWithEngine(payload) {
  const url = `${config.securityEngineUrl}/analyze`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const message = body?.error || body?.message || `Engine error (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export async function engineHealthCheck() {
  const url = `${config.securityEngineUrl}/health`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : { ok: res.ok };
  } catch {
    return { ok: res.ok, raw: text };
  }
}
