"""Optional Groq LLM pass to attach per-finding AI-generated fixes."""

from __future__ import annotations

import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from typing import Any, Optional

from config import Config

logger = logging.getLogger(__name__)

_GROQ_TIMEOUT_S = 28.0
_MAX_CONTEXT_CHARS = 12000


def attach_ai_fixes(
    code: str,
    language: str,
    vulnerabilities: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return a new list with each item including ``ai_fix`` (dict or ``None``)."""

    if not vulnerabilities:
        return []

    if not (Config.GROQ_API_KEY or "").strip():
        return [{**v, "ai_fix": None} for v in vulnerabilities]

    try:
        from groq import Groq
    except ImportError:
        logger.warning("groq package not installed; skipping AI fixes")
        return [{**v, "ai_fix": None} for v in vulnerabilities]

    client = Groq(api_key=Config.GROQ_API_KEY.strip())
    out: list[dict[str, Any]] = []

    for v in vulnerabilities:
        v_copy = dict(v)
        if _should_skip_ai(v_copy):
            v_copy["ai_fix"] = None
            out.append(v_copy)
            continue

        fix = _fetch_ai_fix_with_timeout(client, code, language, v_copy)
        v_copy["ai_fix"] = fix
        out.append(v_copy)

    return out


def _should_skip_ai(v: dict[str, Any]) -> bool:
    rk = str(v.get("rule_key") or "").lower()
    title = str(v.get("title") or "").lower()
    if "missing" in rk or "parse-error" in rk:
        return True
    if "executable not found" in title or "non-json" in title:
        return True
    return not str(v.get("snippet") or "").strip()


def _fetch_ai_fix_with_timeout(
    client: Any,
    full_code: str,
    language: str,
    vuln: dict[str, Any],
) -> Optional[dict[str, Any]]:
    def _call() -> Optional[dict[str, Any]]:
        return _call_groq_for_fix(client, full_code, language, vuln)

    with ThreadPoolExecutor(max_workers=1) as pool:
        fut = pool.submit(_call)
        try:
            return fut.result(timeout=_GROQ_TIMEOUT_S)
        except FuturesTimeout:
            logger.warning("Groq request timed out for finding %s", vuln.get("id"))
            return None
        except Exception as exc:
            logger.warning("Groq request failed: %s", exc)
            return None


def _call_groq_for_fix(
    client: Any,
    full_code: str,
    language: str,
    vuln: dict[str, Any],
) -> Optional[dict[str, Any]]:
    snippet = str(vuln.get("snippet") or "").strip()
    ctx = full_code[:_MAX_CONTEXT_CHARS] if len(full_code) > _MAX_CONTEXT_CHARS else full_code

    system = (
        "You are an expert secure code reviewer. You respond with only valid JSON, no markdown, "
        'no code fences. Use keys "corrected_code" (string) and "explanation" (string, exactly one sentence '
        "stating why the corrected version is safer). corrected_code must be a concrete replacement for the "
        "vulnerable snippet, preserving intent where safe."
    )
    user = (
        f"Language: {language}\n\n"
        f"Full source (context, may be truncated):\n```\n{ctx}\n```\n\n"
        f"Vulnerable snippet to fix:\n```\n{snippet}\n```\n\n"
        f"Finding title: {vuln.get('title')}\n"
        f"Tool: {vuln.get('tool')}\n"
        f"Severity: {vuln.get('severity')}\n"
        f"Line range: {vuln.get('line_start')}–{vuln.get('line_end')}\n"
        f"Rule: {vuln.get('rule_key')}\n"
    )

    completion = _create_groq_completion(client, system, user)

    message = completion.choices[0].message
    raw = (message.content or "").strip()
    return _parse_ai_fix_json(raw)


def _create_groq_completion(client: Any, system: str, user: str) -> Any:
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    common: dict[str, Any] = {
        "model": Config.GROQ_MODEL,
        "messages": messages,
        "temperature": 0.15,
        "max_tokens": 900,
    }
    try:
        return client.chat.completions.create(**common, response_format={"type": "json_object"})
    except Exception as exc:
        logger.debug("Groq json_object mode failed (%s); retrying without response_format", exc)
        return client.chat.completions.create(**common)


def _parse_ai_fix_json(raw: str) -> Optional[dict[str, Any]]:
    if not raw:
        return None

    cleaned = raw.strip()
    fence = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", cleaned, re.IGNORECASE)
    if fence:
        cleaned = fence.group(1).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Groq returned non-JSON content")
        return None

    if not isinstance(data, dict):
        return None

    corrected = data.get("corrected_code")
    expl = data.get("explanation")
    legacy_why = data.get("why_safer")
    if corrected is not None and not isinstance(corrected, str):
        corrected = str(corrected)
    line = expl if isinstance(expl, str) and expl.strip() else legacy_why
    if line is not None and not isinstance(line, str):
        line = str(line)

    corrected = (corrected or "").strip()
    line = (line or "").strip()

    if not corrected and not line:
        return None

    return {
        "corrected_code": corrected,
        "explanation": line,
        "why_safer": line,
    }
