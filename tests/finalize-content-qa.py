"""Run final isolated CPU checks/reports after the watcher collects both matrices.

This writes QA artifacts/reports only. It does not stage, commit, push, deploy,
or edit user storage. Review the generated reports before publishing them.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import traceback

root = Path(__file__).resolve().parent.parent
frozen_m10 = Path(sys.argv[1]).resolve()
status_file = root / "artifacts" / "content-final-qa-status.json"

def status(phase, **extra):
    record = {"phase": phase, "utc": datetime.now(timezone.utc).isoformat(), **extra}
    temporary = status_file.with_suffix(".tmp")
    temporary.write_text(json.dumps(record, indent=2), encoding="utf-8")
    temporary.replace(status_file)
    print(phase, flush=True)

try:
    status("waiting_for_full_collected_matrices")
    while True:
        complete = True
        for name, count in [("m10", 72000), ("m11", 54000)]:
            file = root / "artifacts" / f"{name}-balance-results.json"
            data = json.loads(file.read_text(encoding="utf-8")) if file.exists() else {}
            complete &= data.get("passed") is True and data.get("actualRuns") == count
        if complete:
            break
        time.sleep(20)
    # Summary files are atomically copied after all validated source checkpoints.
    # Let the collector close its final logs and the completed workers exit.
    time.sleep(3)
    env = os.environ.copy()
    env["PERFORMANCE_ISOLATED"] = "1"
    env["M10_SOURCE_ROOT"] = str(frozen_m10)
    commands = [
        ("m10_performance", "tests/m10-performance.mjs", "artifacts/m10-performance-final.txt"),
        ("m11_performance", "tests/m11-performance.mjs", "artifacts/m11-performance-final.txt"),
        ("m10_reports", "tests/m10-report.js", "artifacts/m10-report-generation.txt"),
        ("m11_reports", "tests/m11-report.js", "artifacts/m11-report-generation.txt"),
    ]
    for phase, script, log in commands:
        status(phase)
        with (root / log).open("w", encoding="utf-8") as output:
            run = subprocess.run(["node", script], cwd=root, env=env, stdout=output, stderr=subprocess.STDOUT)
        if run.returncode:
            raise RuntimeError(f"{script}: exit {run.returncode}; see {log}")
    status("ready_for_review", passed=True, note="Read reports, finish README and commit/push manually. Human enjoyment remains unverified.")
except Exception:
    status("failed", passed=False, error=traceback.format_exc())
    raise
