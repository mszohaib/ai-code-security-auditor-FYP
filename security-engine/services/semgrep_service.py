"""Execute Semgrep against bundled rules tailored to common web vulnerabilities."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

_RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "semgrep_rules.yml"


def _snippet_from_source(source: str, start_line: int | None, end_line: int | None) -> str:
    """Build match text from the scanned source; avoids Semgrep 1.100+ 'requires login' placeholders in extra.lines."""

    if not start_line:
        return ""
    lines = source.splitlines()
    lo = max(0, start_line - 1)
    # end_line is 1-based inclusive; Python slice end is exclusive and matches that line number.
    end_exclusive = end_line if end_line is not None else start_line
    if lo >= len(lines):
        return ""
    return "\n".join(lines[lo:end_exclusive]).strip()


def _suffix_for_language(language: str) -> str:
    mapping = {
        "python": ".py",
        "javascript": ".js",
        "typescript": ".ts",
        "generic": ".py",
    }
    return mapping.get(language, ".py")


def _run_semgrep_subprocess(temp_path: Path) -> subprocess.CompletedProcess[str]:
    """Prefer OSS-only local scan; fall back for older CLIs that lack scan/oss-only flags."""

    env = {**os.environ, "SEMGREP_SEND_METRICS": "off"}
    candidates = [
        [
            "semgrep",
            "scan",
            "--config",
            str(_RULES_PATH),
            "--oss-only",
            "--quiet",
            "--json",
            str(temp_path),
        ],
        ["semgrep", "scan", "--config", str(_RULES_PATH), "--quiet", "--json", str(temp_path)],
        ["semgrep", "--config", str(_RULES_PATH), "--quiet", "--json", str(temp_path)],
    ]
    last: subprocess.CompletedProcess[str] | None = None
    for cmd in candidates:
        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            env=env,
        )
        last = completed
        out = (completed.stdout or "").strip()
        if out.startswith("{"):
            return completed
        err = (completed.stderr or "").lower()
        if "oss-only" in err or "unrecognized" in err or "invalid choice" in err or "unknown" in err:
            continue
        if completed.returncode == 0:
            return completed
    assert last is not None
    return last


def run_semgrep_scan(code: str, language: str) -> list[dict[str, Any]]:
    """Run Semgrep against a temporary source file."""

    suffix = _suffix_for_language(language)
    with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as handle:
        handle.write(code)
        temp_path = Path(handle.name)

    try:
        try:
            completed = _run_semgrep_subprocess(temp_path)
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
        line_start = start.get("line")
        line_end = end.get("line") or line_start
        extra_lines = (extra.get("lines") or "").strip()
        if not extra_lines or extra_lines.lower() == "requires login":
            snippet = _snippet_from_source(code, line_start, line_end)
        else:
            snippet = extra_lines
        findings.append(
            {
                "tool": "semgrep",
                "check_id": result.get("check_id"),
                "severity": _normalize_severity(extra.get("severity")),
                "title": extra.get("message") or result.get("check_id") or "Semgrep finding",
                "line_start": line_start,
                "line_end": line_end,
                "snippet": snippet,
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
