"""Collect a completed source-frozen growth matrix without mixing smoke data."""
import gzip
import json
from pathlib import Path
import shutil
import sys

milestone, folder = sys.argv[1:]
expected = {"m10": (72000, 240), "m11": (54000, 180)}
if milestone not in expected:
    raise SystemExit("Expected m10 or m11")
source = Path(folder).resolve()
root = Path(__file__).resolve().parent.parent
relative = Path("artifacts") / f"{milestone}-balance-results.json"
summary_bytes = (source / relative).read_bytes()
summary = json.loads(summary_bytes)
runs, count = expected[milestone]
if summary.get("passed") is not True or summary.get("actualRuns") != runs or len(summary.get("sourceFiles", [])) != count:
    raise SystemExit("Full matrix is not complete; smoke evidence was not copied")
files = []
for name in summary["sourceFiles"]:
    path = Path(name)
    if path.is_absolute() or path.parent != Path("artifacts") / f"{milestone}-growth":
        raise SystemExit(f"Unexpected source path: {name}")
    row = json.loads(gzip.decompress((source / path).read_bytes()))
    if row["spec"]["signature"] != summary["signature"] or len(row["rows"]) != 300:
        raise SystemExit(f"Incomplete/mixed checkpoint: {name}")
    files.append(path)
for path in files:
    target = root / path
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(target.suffix + ".collect-tmp")
    shutil.copyfile(source / path, temporary)
    temporary.replace(target)
temporary = (root / relative).with_suffix(".collect-tmp")
temporary.write_bytes(summary_bytes)
temporary.replace(root / relative)
print(f"Collected {milestone}: {runs} verified Runs / {count} complete paths / {summary['signature']}")
