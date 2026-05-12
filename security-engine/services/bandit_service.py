"""Execute Bandit against in-memory Python source and parse JSON results."""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any


def run_bandit_scan(code: str) -> list[dict[str, Any]]:
    """Run Bandit on a temporary Python file."""

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as handle:
        handle.write(code)
        temp_path = Path(handle.name)

    try:
        completed = subprocess.run(
            [
                "bandit",
                "-q",
                "-f",
                "json",
                str(temp_path),
            ],
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return [
            {
                "tool": "bandit",
                "severity": "medium",
                "title": "Bandit executable not found",
                "line_start": 1,
                "line_end": 1,
                "test_id": "bandit-missing",
                "snippet": "Install Bandit in the security-engine virtual environment.",
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
                "tool": "bandit",
                "severity": "low",
                "title": "Bandit produced non-JSON output",
                "line_start": 1,
                "line_end": 1,
                "test_id": "bandit-parse-error",
                "snippet": (completed.stderr or stdout)[:400],
                "raw": {},
            }
        ]

    issues = []
    for result in data.get("results", []) or []:
        issues.append(
            {
                "tool": "bandit",
                "test_id": result.get("test_id"),
                "severity": (result.get("issue_severity") or "medium").lower(),
                "confidence": result.get("issue_confidence"),
                "title": result.get("issue_text") or "Bandit finding",
                "line_start": result.get("line_number"),
                "line_end": result.get("line_number"),
                "snippet": _snippet_from_result(result),
                "raw": result,
            }
        )
    return issues


def _snippet_from_result(result: dict[str, Any]) -> str:
    code = result.get("code") or ""
    if isinstance(code, str):
        return code.strip()
    return ""
