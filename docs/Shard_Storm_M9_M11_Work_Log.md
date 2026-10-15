# M9.0–M11 implementation work log

This is a resume checkpoint, not an overall completion report.

- Branch: `feat/m9-m11-content-expansion`, based on docs HEAD `f03d9ee` containing M8 `7cc2867`.
- Baseline commit `19c843e`:153 tests, existing benchmark and486Run balance,6 actual Chrome20s runs.
- M9.0 commit `ab47fbc`, pushed: Focus/1440px/DPR, HUD, combat-only feedback/fade/settings.159 tests,24 layout combinations,4 actual20s pointer runs plus existing6Run M7/M8 QA.650Run M7/M8 smoke is explicitly separate from old69,420Run data.
- M9 Done:6 shapes/4traits/4formations, intro director, schema6, adaptive experiment isolation.179 tests PASS. Full38,250Run/165path matrix, isolated90Run performance, final5Run Chrome pointer QA and existing6Run M7/M8 browser regression passed. Reports and artifacts recorded below.
- M10 has independent preparation files (`expansion-defs.js`, `builds.js`, `expansion.js`, `build-ui.js`, `tests/m10-simulation.js`) but they are not imported by production or CONFIG yet. They are unverified preparation, not completed skills or migrations. Do not integrate them while the M9 benchmark uses its frozen dependency hash. M11 has not started; all requested functionality remains in scope.

## Corrections before final M9 validation

Echo's parent Chain must remain while its children are alive. Echo pays0Raw and no native/ore/Catalyst/lifetime/contract rewards. Visible combo and reward-objective kill counts are now separate: ordinary deaths alone advance Chain10/15 contracts/anomalies. This prevents an Echo contribution from being credited at the next normal death. FieldClear also handles the final temporary Echo. Gravity source selection must not confuse equal numbers in separate shape/projectile ID namespaces. First encounters prioritize a suitable formation before the random20% pattern lottery. Decorative radial effects clip to the arena, protecting the HUD.

## Verification and resuming

Read the6 original PRDs, README and current git diff/status. Do not repeat committed M9.0 work. `npm test` currently includes all153 old tests plus26 M9.0/M9 checks; no test is removed. Historical migration target assertions were updated5→6, preserving original balance/preservation assertions. `Game` defaults to ecology OFF for historical regression; production `app.js` starts ecology ON. New tests/benchmarks explicitly choose flags.

`tests/m9-balance.js` uses an exact LF-normalized dependency hash, per-path gzip checkpoints after10Runs and a saved sandbox profile. Default120 paths×300 plus45 Adaptive/Anomaly paths×50 =38,250 actual Runs. All comparative paths use5seeds/3builds/Fresh or old19-level LegacyMax/20 or ExtraTime. Derive counts from actual sourceFiles. Results are `artifacts/m9-balance-results.json`, `tests/m9-report.js` refuses a short smoke run as a full report.

Before editing any dependency while a benchmark runs, finish it or stop only our `node.exe` processes whose command line contains `m9-balance.js`. Do not stop the QA server or other user processes. Worker source guards reject mixed versions. Current source must be revalidated after the Echo reward fix. Old hashes `1f860b1cd4c0`, `275d29bfac4a`, `9f81223d1b19`, `3e129b7f2e35` contain smoke or interrupted pre-fix data and are not final completion evidence. Preserve them as historical experiment artifacts. Old M7 smoke files beginning `9fdb73602e7e` are valid ab47fbc-era1Run checkpoints, not300Run growth.

Commands: `node tests/log-command.mjs artifacts/m9-unit.txt npm test`, `npm run benchmark:m9` (optional CONTENT_WORKERS≤available12), `npm run qa:m9`, then `node tests/m9-report.js`. Browser uses separate Playwright contexts and no user profile: PLAYWRIGHT_MODULE=$TEMP/shard-storm-qa/node_modules/playwright, Chrome installed at Program Files/Google/Chrome/Application/chrome.exe, QA_BASE_URL=http://127.0.0.1:4174. Our local server on4174 is running; user4173 was not touched.

M9 validation is complete. Read its Implementation/Balance Reports. Next work is M10 integration after the explicit Catalyst Extraction rule decision, followed by all M11 scope. No deployment, force reset, real currency manipulation, human fun claim, or unrequested engine work.

## Controller restart, 2026-10-15

Fetched origin again; branch still matches remote. Validated57 current-source gzip checkpoints (15,160 actual completed Runs), all readable and matching full signature `f335fad554c688407f4c8d811c18748d457b17863c5778c1c01b4ecdafd11c4c`. Restart exit1073807364 was an interrupted process, not a failed game assertion. Resumed with12 workers to `artifacts/m9-balance-resume.txt`; do not change hashed dependencies until it completes. Progress grows beyond this initial restart count.

Current full unit suite179PASS/0FAIL (`artifacts/m9-unit-final.txt`); two additional actual Mirror+Coil and auxiliary→Echo checks. Chrome155.0.8059.79 pointer5×20s PASS, zero errors; this run shared the machine with growth workers, so rerun alone for final browser/performance evidence. `tests/m9-performance.mjs` compares90 actual same-policy Runs to M9.0/M8 `ab47fbc` and must execute alone after growth. `tests/m9-report.js` now also requires its result. QA server restarted on4174; check live process before assuming it still exists.

## Final M9 verification and pending human gate

The above restart note is chronological. Growth completed:38,250 actual unique recorded Runs/165paths, same `f335fad554c6...` signature.15,160 saved rows reused,23,090 added. Both Normal and comparison modes use matching seeds; report tables compare the first50 Normal Runs to50 Adaptive/Anomaly Runs, not different index ranges. Full summary/sourceFiles are current; old300Run smoke is no longer used as `m9-balance-results.json`.

Isolated90Run performance PASS; M8/OFF exact outcome parity. Final Chrome155 pointer5×20s PASS after adding read-only held/click-count diagnostics and restoring a real mouse hold after screenshot/scroll cancels it. Each normal QA Run asserts≥70 actual attack attempts. Natural Fresh146kills/139Photon, Rank1..3 fixtures303/298/301kills; fixture values are not human fun evidence. Old Relic/Contract/Anomaly browser6Runs PASS and650Run smoke PASS; fresh outputs under `artifacts/m9-regression`, new650 source files use prefix `62608cdf8e1c`. Existing benchmark18legacy+2short,486Run balance,1573Run M5/M6 pass. Reports disclose existing512 iteration cap and late currency surplus. No gameplay source changed during growth; app diagnostic fields and QA/report files are outside its dependency list.

**Human gate:** PRD M10 Catalyst Extraction requires sameChain≥10 at a direct Hex/Reactor final hit, but `Game.attack` creates a fresh Chain and flushes that direct hit immediately. Actual reproduction `tests/m10-extraction-repro.mjs` records priorChain1=10kills vs directHexChain2=1kill. Do not borrow another Chain's kills or claim the manual reused-chain fixture proves normal play. [Rule decision](Shard_Storm_M10_Rule_Decision.md) offers A:defer qualifying a direct-origin Chain until it reaches10 normal deaths; B:allow cascade final hits on the qualifying Chain. Neither is selected or applied.

M10 unconnected preparation includes definitions/build-state/runtime/UI modules and simulation/benchmark/browser/test cases (`tests/m10-cases.js` exports registration and is not an active npm test entry point yet).15 pure-state Evolution crafts/costs/duplicates/slots/presets PASS in `artifacts/m10-build-precheck.txt`; this is not combat/schema7/UI QA. CONFIG still19skills/schema6, app does not import expansion modules. M11 has not started. After the human chooses, integrate and validate all30 effects/15forms, add the test entry point, migrate to7, preserve old19/50Lv fixture scopes in old benchmarks, implement49-node search/UI and run full M10 QA before M11. Do not treat prep code as tested: e.g. Catalyst condition remains the unconnected impossible draft until the decision; exact event hooks, wall-contact splitting, Gravity forms and economic settlement still need connection/review.
