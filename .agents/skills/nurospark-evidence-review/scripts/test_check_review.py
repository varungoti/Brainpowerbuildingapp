import copy
import importlib.util
import json
import socket
import tempfile
import io
from contextlib import redirect_stderr
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("review_classifier", ROOT / "scripts" / "check_review.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.cases = json.loads((ROOT / "fixtures" / "status-cases.json").read_text())
        self.positive = copy.deepcopy(self.cases[0]["input"])

    def reject(self, data):
        with self.assertRaises((ValueError, TypeError)):
            module.classify(data)

    def test_positive_failure_and_blocked_propagate(self):
        with patch.object(socket, "socket", side_effect=AssertionError("Network forbidden")):
            for case in self.cases:
                with self.subTest(case=case["name"]):
                    result = module.classify(case["input"])
                    self.assertEqual(result["bounded_evidence_status"], case["expected"])
                    self.assertEqual(result["product_release_status"], "not_assessed")
                    self.assertEqual(result["checks"], case["input"]["checks"])
                    self.assertEqual(result["verification"], "declared_metadata_only")
                    self.assertTrue(result["known_snapshot_blockers"])

    def assert_cli_rejects_skill_files(self, config=None, cases=None, raw_config=None, symlink=False, missing=False):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "skill"
            (root / "references").mkdir(parents=True)
            (root / "fixtures").mkdir()
            config_path = root / "references/review-contract.json"
            if not missing:
                if symlink:
                    outside = Path(tmp) / "outside.json"
                    outside.write_text(json.dumps(module.EXPECTED_CONFIG))
                    config_path.symlink_to(outside)
                elif raw_config is not None:
                    config_path.write_bytes(raw_config)
                else:
                    config_path.write_text(json.dumps(module.EXPECTED_CONFIG if config is None else config))
            (root / "fixtures/status-cases.json").write_text(json.dumps(self.cases if cases is None else cases))
            with patch.object(module, "ROOT", root), patch.object(module.sys, "argv", ["check_review.py", "--self-test"]), redirect_stderr(io.StringIO()) as error:
                self.assertEqual(module.main(), 2)
                self.assertIn('"metadata_status": "invalid"', error.getvalue())

    def test_empty_fixtures_cannot_pass(self):
        self.assert_cli_rejects_skill_files(cases=[])

    def test_missing_fixture_category_cannot_pass(self):
        self.assert_cli_rejects_skill_files(cases=self.cases[:-1])

    def test_duplicate_fixture_category_cannot_pass(self):
        cases = copy.deepcopy(self.cases)
        cases[-1] = copy.deepcopy(cases[0])
        self.assert_cli_rejects_skill_files(cases=cases)

    def test_config_cannot_change_project_contract(self):
        config = copy.deepcopy(module.EXPECTED_CONFIG)
        config["required"] = []
        self.assert_cli_rejects_skill_files(config=config)

    def test_missing_or_malformed_config_is_controlled_failure(self):
        self.assert_cli_rejects_skill_files(missing=True)
        self.assert_cli_rejects_skill_files(raw_config=b"{")
        self.assert_cli_rejects_skill_files(raw_config=b"\xff")

    def test_symlinked_config_is_denied(self):
        self.assert_cli_rejects_skill_files(symlink=True)

    def test_deep_stdin_json_is_controlled_failure(self):
        raw = "[" * 1100 + "0" + "]" * 1100
        with patch.object(module.sys, "argv", ["check_review.py", "--stdin"]), patch.object(module.sys, "stdin", io.StringIO(raw)), redirect_stderr(io.StringIO()) as error:
            self.assertEqual(module.main(), 2)
            self.assertIn('"metadata_status": "invalid"', error.getvalue())

    def test_duplicate_json_keys_cannot_hide_failure(self):
        with self.assertRaises(ValueError):
            module.parse_metadata(' {"status":"failed","status":"passed"} ')

    def test_input_size_is_bounded(self):
        with self.assertRaises(ValueError):
            module.parse_metadata(" " * 65537)

    def test_missing_required_check(self):
        self.positive["checks"].pop()
        self.reject(self.positive)

    def test_duplicate_or_unknown_check(self):
        for ident in [self.positive["checks"][0]["id"], "unreviewed"]:
            data = copy.deepcopy(self.positive)
            data["checks"][1]["id"] = ident
            self.reject(data)

    def test_unknown_status(self):
        self.positive["checks"][0]["status"] = "success-ish"
        self.reject(self.positive)

    def test_boolean_status_is_rejected(self):
        self.positive["checks"][0]["status"] = True
        self.reject(self.positive)

    def test_missing_or_bad_candidate_sha(self):
        for value in ["main", "a" * 39, True, None]:
            self.positive["candidate_sha"] = value
            self.reject(self.positive)

    def test_foreign_project_or_repo(self):
        for key in ["project", "repository"]:
            data = copy.deepcopy(self.positive)
            data[key] = "different"
            self.reject(data)

    def test_release_claim_is_rejected(self):
        self.positive["scope"] = "release_ready"
        self.reject(self.positive)

    def test_private_record_or_extra_field_is_rejected(self):
        self.positive["raw_record"] = {"synthetic_only": True}
        self.reject(self.positive)

    def test_digest_required_for_executed_claim(self):
        for digest in [None, "bad", True]:
            self.positive["checks"][0]["artifact_sha256"] = digest
            self.reject(self.positive)

    def test_unexecuted_check_cannot_carry_execution_digest(self):
        self.positive["checks"][0]["status"] = "not_run"
        self.reject(self.positive)

    def test_not_applicable_stays_blocked(self):
        self.positive["checks"][0].update(status="not_applicable", artifact_sha256=None)
        self.assertEqual(module.classify(self.positive)["bounded_evidence_status"], "blocked")

    def test_failure_takes_precedence_over_unavailable(self):
        self.positive["checks"][0]["status"] = "failed"
        self.positive["checks"][1].update(status="unavailable", artifact_sha256=None)
        self.assertEqual(module.classify(self.positive)["bounded_evidence_status"], "failed")

    def test_empty_or_overlong_metadata_is_rejected(self):
        for value in ["", " " * 2, "x" * 513, None]:
            self.positive["checks"][0]["reason"] = value
            self.reject(self.positive)

if __name__ == "__main__":
    unittest.main()
