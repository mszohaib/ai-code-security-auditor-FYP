"""Route blueprints for analysis and health checks."""

from __future__ import annotations

import uuid
from flask import Blueprint, jsonify, request

from config import Config
from services.bandit_service import run_bandit_scan
from services.semgrep_service import run_semgrep_scan
from services.vulnerability_mapper import merge_and_enrich

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.get("/health")
def health():
    return jsonify({"status": "ok", "service": "security-engine"})


@analyze_bp.post("/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    code = payload.get("code")
    language = (payload.get("language") or "python").lower()

    if not isinstance(code, str) or not code.strip():
        return jsonify({"error": "code must be a non-empty string"}), 400

    encoded = code.encode("utf-8")
    if len(encoded) > Config.MAX_CODE_BYTES:
        return jsonify({"error": "code exceeds maximum allowed size"}), 413

    scan_id = str(uuid.uuid4())
    bandit_results = []
    if language in ("python", "generic"):
        bandit_results = run_bandit_scan(code)

    semgrep_results = run_semgrep_scan(code, language)
    vulnerabilities = merge_and_enrich(bandit_results, semgrep_results)

    return jsonify(
        {
            "scan_id": scan_id,
            "vulnerabilities": vulnerabilities,
            "meta": {
                "language": language,
                "tools": {"bandit": bool(bandit_results), "semgrep": True},
                "counts": {
                    "bandit": len(bandit_results),
                    "semgrep": len(semgrep_results),
                    "merged": len(vulnerabilities),
                },
            },
        }
    )
