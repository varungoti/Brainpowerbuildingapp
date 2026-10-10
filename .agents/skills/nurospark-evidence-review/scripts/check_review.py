"""Offline declared-evidence classifier; never runs or certifies app checks."""
import json
import re
import sys
import os
import stat
from pathlib import Path

ROOT = Path(__file__).absolute().parents[1]
EXPECTED_CONFIG = {'project': 'NuroSpark', 'repo': 'varungoti/Brainpowerbuildingapp', 'base': '836da44bcb96faab395ce2bf15df7d312b4eea63', 'slug': 'nurospark-evidence-review', 'required': ['consent_generation', 'guardian_scope', 'claim_appraisal', 'adult_ux'], 'aliases': ['NS-D06', 'NS-D07', 'NS-R07-NS-R13', 'WP06', 'WP10', 'IMP'], 'blockers': ['Existing consent PR1 is unmerged; main does not contain its repair', 'Payment PR2 lacks atomic ingest RPC/migration and is blocked for release', 'Full integration, browser/native and child-safety acceptance are unverified']}
STATES = {"passed", "failed", "blocked", "not_run", "unavailable", "not_applicable"}

def classify(data):
    CONFIG = load_config()
    if not isinstance(data, dict) or set(data) != {
        "project", "repository", "candidate_sha", "scope", "evidence_kind", "checks"
    }:
        raise ValueError("Unexpected or missing metadata fields; do not supply raw records")
    if data["project"] != CONFIG["project"] or data["repository"] != CONFIG["repo"]:
        raise ValueError("Wrong project or repository")
    if not isinstance(data["candidate_sha"], str) or not re.fullmatch(r"[0-9a-f]{40}", data["candidate_sha"]):
        raise ValueError("An exact candidate SHA is required")
    if data["scope"] != "bounded_workflow_review":
        raise ValueError("This classifier cannot evaluate release, clinical or financial claims")
    if data["evidence_kind"] not in {"synthetic_fixture", "declared_receipt_metadata"}:
        raise ValueError("Evidence kind must remain explicit")
    checks = data["checks"]
    if not isinstance(checks, list) or len(checks) != len(CONFIG["required"]):
        raise ValueError("Every required check must be present exactly once")
    seen = set()
    statuses = []
    for check in checks:
        if not isinstance(check, dict) or set(check) != {"id", "status", "reason", "command", "artifact_sha256"}:
            raise ValueError("Unexpected or missing check metadata")
        ident, status = check["id"], check["status"]
        if not isinstance(ident, str) or ident not in CONFIG["required"] or ident in seen:
            raise ValueError("Unknown or repeated check")
        if not isinstance(status, str) or status not in STATES:
            raise ValueError("Unknown status is not success")
        if any(not isinstance(check[k], str) or not check[k].strip() or len(check[k]) > 512 for k in ["reason", "command"]):
            raise ValueError("A bounded reason and declared command are required")
        digest = check["artifact_sha256"]
        if status in {"passed", "failed"}:
            if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
                raise ValueError("Executed claims require a declared artifact digest")
        elif digest is not None:
            raise ValueError("Unexecuted checks cannot claim an executed artifact")
        seen.add(ident)
        statuses.append(status)
    # Not-applicable needs owner review and is never silently promoted to success.
    state = "failed" if "failed" in statuses else (
        "passed" if all(s == "passed" for s in statuses) else "blocked"
    )
    return {
        "project": CONFIG["project"], "candidate_sha": data["candidate_sha"],
        "bounded_evidence_status": state,
        "verification": "declared_metadata_only",
        "product_release_status": "not_assessed",
        "known_snapshot_blockers": CONFIG["blockers"],
        "checks": checks,
        "evidence_kind": data["evidence_kind"],
    }

def parse_metadata(raw):
    if not isinstance(raw, str) or len(raw.encode("utf-8")) > 65536:
        raise ValueError("Metadata input exceeds 64 KiB")
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate JSON key is invalid metadata")
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=unique_object)

def safe_json_file(relative):
    target = ROOT / relative
    if target.is_symlink() or any(parent.is_symlink() for parent in target.parents):
        raise ValueError("Skill metadata must not be symlinked")
    before = target.lstat()
    if not stat.S_ISREG(before.st_mode) or before.st_size > 65536:
        raise ValueError("Skill metadata must be a regular file no larger than 64 KiB")
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0)
    fd = os.open(target, flags)
    with os.fdopen(fd, "rb") as stream:
        opened = os.fstat(stream.fileno())
        if not stat.S_ISREG(opened.st_mode) or (before.st_dev, before.st_ino) != (opened.st_dev, opened.st_ino):
            raise ValueError("Skill metadata changed during open")
        raw = stream.read(65537)
    if len(raw) > 65536:
        raise ValueError("Skill metadata exceeds 64 KiB")
    return parse_metadata(raw.decode("utf-8", errors="strict"))

def load_config():
    config = safe_json_file("references/review-contract.json")
    if not isinstance(config, dict) or config != EXPECTED_CONFIG:
        raise ValueError("Config must match this reviewed project contract exactly")
    return config

def load_cases():
    cases = safe_json_file("fixtures/status-cases.json")
    expected = {
        "known-positive": ("passed", "passed"),
        "intentional-failure": ("failed", "failed"),
        "blocked-dependency": ("blocked", "blocked"),
        "unavailable-evaluator": ("unavailable", "blocked"),
        "never-executed": ("not_run", "blocked"),
    }
    if not isinstance(cases, list) or len(cases) != len(expected):
        raise ValueError("All five nonempty fixture categories are required")
    names = set()
    for case in cases:
        if not isinstance(case, dict) or set(case) != {"name", "input", "expected"}:
            raise ValueError("Invalid fixture shape")
        name = case["name"]
        if not isinstance(name, str) or name not in expected or name in names:
            raise ValueError("Invalid or duplicate fixture category")
        state, result_state = expected[name]
        data = case["input"]
        result = classify(data)
        if data["evidence_kind"] != "synthetic_fixture" or data["checks"][0]["status"] != state:
            raise ValueError("Fixture category must retain its intentional state")
        if case["expected"] != result_state or result["bounded_evidence_status"] != result_state:
            raise ValueError("Fixture category result is incorrect")
        names.add(name)
    return cases

def main():
    try:
        CONFIG = load_config()
        if sys.argv[1:] == ["--self-test"]:
            cases = load_cases()
            for case in cases:
                result = classify(case["input"])
                if result["bounded_evidence_status"] != case["expected"]:
                    raise ValueError("Fixture classification mismatch")
                if result["product_release_status"] != "not_assessed":
                    raise ValueError("A workflow result became a product release claim")
            print(json.dumps({"project": CONFIG["project"], "synthetic_classifier_cases_passed": len(cases), "application_checks_executed": 0}))
        elif sys.argv[1:] == ["--stdin"]:
            print(json.dumps(classify(parse_metadata(sys.stdin.read(65537))), indent=2))
        else:
            raise ValueError("Use --self-test or --stdin; no file, network or execution targets are accepted")
    except (ValueError, TypeError, KeyError, OSError, UnicodeError, RecursionError) as error:
        print(json.dumps({"metadata_status": "invalid", "detail": str(error), "product_release_status": "not_assessed"}), file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
