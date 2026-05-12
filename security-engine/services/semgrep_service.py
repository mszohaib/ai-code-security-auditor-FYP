"""Execute Semgrep with bundled rules tailored to common web vulnerabilities."""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any


_RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "semgrep_rules.yml"


def _suffix_for_language(language: str) -> str:
    mapping = {
        "python": ".py",
        "javascript": ".js",
        "typescript": ".ts",
        "generic": ".py",
    }
    return mapping.get(language, ".py")


def run_semgrep_scan(code: str, language: str) -> list[dict[str, Any]]:
    """Run Semgrep against a temporary source file."""

    suffix = _suffix_for_language(language)
    with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as handle:
        handle.write(code)
        temp_path = Path(handle.name)

    try:
        completed = subprocess.run(
            [
                "semgrep",
                "--config",
                str(_RULES_PATH),
                "--quiet",
                "--json",
                str(temp_path),
            ],
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return [
            {
                "tool": "semgrep",
                "severity": "medium",
                "title": "Semgrep executable not found",
                "line_start": 1,
                "line_end": 1,
                "check_id": "semgrep-missing",
                "snippet": "Install Semgrep in the security-engine virtual environment.",
                "raw": {},
            }
        ]
    finally:
        temp_path.unlink(missing_ok=True)

    stdout = (completed.stdout or "").strip()
    if not stdout:
        return []

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError:
        return [
            {
                "tool": "semgrep",
                "severity": "low",
                "title": "Semgrep produced non-JSON output",
                "line_start": 1,
                "line_end": 1,
                "check_id": "semgrep-parse-error",
                "snippet": (completed.stderr or stdout)[:400],
                "raw": {},
            }
        ]

    findings: list[dict[str, Any]] = []
    for result in data.get("results", []) or []:
        start = result.get("start", {}) or {}
        end = result.get("end", {}) or {}
        extra = result.get("extra", {}) or {}
        findings.append(
            {
                "tool": "semgrep",
                "check_id": result.get("check_id"),
                "severity": _normalize_severity(extra.get("severity")),
                "title": extra.get("message") or result.get("check_id") or "Semgrep finding",
                "line_start": start.get("line"),
                "line_end": end.get("line") or start.get("line"),
                "snippet": (extra.get("lines") or "").strip(),
                "raw": result,
            }
        )
    return findings


def _normalize_severity(value: str | None) -> str:
    if not value:
        return "medium"
    normalized = str(value).lower()
    if normalized in ("error", "critical"):
        return "high"
    if normalized == "warning":
        return "medium"
    if normalized == "info":
        return "low"
    return normalized
