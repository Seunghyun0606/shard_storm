"""Run the unchanged M7/M8, M9 and M10 browser assertions on current code.

The separate working directory collects relative artifacts without overwriting
the historical milestone screenshots/results in the repository.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
destination = root / "artifacts" / "m11-regression" / os.environ.get("QA_REGRESSION_LABEL", "browser")
destination.mkdir(parents=True, exist_ok=True)
results = []
for milestone, script in [("m9", "m9-browser.mjs"), ("m7-m8", "m7-m8-browser.mjs"), ("m10", "m10-browser.mjs"), ("m5-m6", "m5-m6-browser.mjs")]:
    if milestone not in os.environ.get("QA_REGRESSION_STAGES", "m9,m7-m8,m10").split(","):
        continue
    with tempfile.TemporaryDirectory(prefix=f"shard-{milestone}-regression-") as folder:
        working = Path(folder)
        (working / "artifacts").mkdir()
        output = destination / milestone
        output.mkdir(exist_ok=True)
        with (output / "command.txt").open("w", encoding="utf-8") as log:
            run = subprocess.run(["node", str(root / "tests" / script)], cwd=working,
                                 env=os.environ.copy(), stdout=log, stderr=subprocess.STDOUT)
        for artifact in (working / "artifacts").iterdir():
            shutil.copy2(artifact, output / artifact.name)
        results.append({"milestone": milestone, "script": script, "exitCode": run.returncode})
        (destination / "commands.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(f"{milestone} browser regression exit {run.returncode}", flush=True)
        if run.returncode:
            raise SystemExit(run.returncode)
