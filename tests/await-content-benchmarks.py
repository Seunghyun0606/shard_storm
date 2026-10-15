"""Watch source-frozen experiments and collect only their completed matrices.

Usage: python tests/await-content-benchmarks.py M10_SOURCE_ROOT M11_SOURCE_ROOT
This never changes experiment dependencies, user storage, or Git state.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

root = Path(__file__).resolve().parent.parent
sources = dict(zip(["m10", "m11"], map(Path, sys.argv[1:])))
if len(sources) != 2:
    raise SystemExit("Provide the two frozen source roots")
collected = set()
expected = {"m10": 72000, "m11": 54000}
with (root / "artifacts" / "content-benchmark-watch.txt").open("a", encoding="utf-8") as log:
    while len(collected) < 2:
        statuses = []
        for name, folder in sources.items():
            if name in collected:
                statuses.append(f"{name}: full matrix collected")
                continue
            summary_file = folder / "artifacts" / f"{name}-balance-results.json"
            summary = json.loads(summary_file.read_text(encoding="utf-8")) if summary_file.exists() else {}
            if summary.get("actualRuns") == expected[name]:
                subprocess.run([sys.executable, str(root / "tests" / "collect-content-benchmark.py"), name, str(folder)], cwd=root, check=True)
                logs = sorted((folder / "artifacts").glob(f"{name}-balance-*.txt"))
                destination = root / "artifacts" / f"{name}-frozen-logs"
                destination.mkdir(exist_ok=True)
                for file in logs:
                    shutil.copy2(file, destination / file.name)
                collected.add(name)
                statuses.append(f"{name}: full {expected[name]} Runs collected")
            else:
                logs = list((folder / "artifacts").glob(f"{name}-balance-*.txt"))
                latest = max(logs, key=lambda p: p.stat().st_mtime) if logs else None
                lines = latest.read_text(encoding="utf-8").splitlines() if latest else []
                line = next((line for line in reversed(lines) if "paths " in line), "experiment running")
                statuses.append(f"{name}: {line}")
        text = datetime.now(timezone.utc).isoformat(timespec="seconds") + " | " + " | ".join(statuses)
        print(text, flush=True)
        log.write(text + "\n")
        log.flush()
        if len(collected) < 2:
            time.sleep(45)
