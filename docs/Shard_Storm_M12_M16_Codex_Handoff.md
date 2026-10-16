# Codex handoff — Implement Shard Storm M12~M16 sequentially

Repository: https://github.com/Seunghyun0606/shard_storm
M11 finished code branch: feat/m9-m11-content-expansion
Planning branch with the six PRDs: docs/m12-m16-destruction-evolution
NEW implementation branch: feat/m12-m16-destruction-evolution

## ROLE & MAIN OBJECTIVE

You are the implementation/testing agent for the Shard Storm HTML5/Vanilla JS game. Implement M12 → M13 → M14 → M15 → M16 **in this order** on the new feature branch. Deliver real playable code, regressions, browser screenshots, benchmark evidence, and pushed milestone commits — not scaffolds or placeholder-only screens.

Do not create production deploy, merge to main, PR, monetization, backend rewrite or dangerous account data changes without a separate explicit user request.

## 1. Start here (mandatory)

1. git fetch remote, inspect latest actual refs and current HEAD before writing. Do not accidentally branch from main or older M8.
2. Read ALL of these docs from docs/m12-m16-destruction-evolution:
   - docs/Shard_Storm_M12_M16_Development_Roadmap_v1.0.md
   - docs/Shard_Storm_M12_Core_Loop_Power_Curve_PRD_v1.0.md
   - docs/Shard_Storm_M13_Destruction_Evolution_PRD_v1.0.md
   - docs/Shard_Storm_M14_World_Tiers_Milestone_Bosses_PRD_v1.0.md
   - docs/Shard_Storm_M15_Optional_Challenges_Endgame_PRD_v1.0.md
   - docs/Shard_Storm_M16_Juice_Audio_Release_PRD_v1.0.md
3. Read M11 Implementation/Balance/Human Playtest/Save Capacity Decision, README, source config/game/ecology/advanced-shapes/elites/motion/effects/app/progression/storage and test structure.
4. Branch feat/m12-m16-destruction-evolution from docs/m12-m16-destruction-evolution so both M11 code and all new PRDs exist in one working tree.
5. Capture baseline git SHA, npm test actual results, relevant benchmark smoke, Chrome20sec pointer QA and save-read/write behavior. Past M11 307PASS/54,000 growth/28pointer runs are historical evidence, not this session's test runs.

## 2. Common, non-negotiable rules

- Preserve 20sec normal Run and original ExtraTime20~32, direct click/hold/drag, fixed-step causal combat, pointer mapping at logical 960x540. Focus/CSS1440/DPR/HUD safe.
- Preserve M11 assets: 19Shape,8 secondary traits,3 primary,49Skills/100Lv, Signature10 with3 active, Evolution15 forms with2 family active, Relic6, Contract10, Anomaly6, Codex19×4, Elite6.
- Preserve shard-storm-v1 storage key; full 20 lossless compressed combat records, LZ4/base64+CRC32, pending/lastSettlementId, Photon/Catalyst, levels, records, all unlocks. Migrate safely only when persistent data structures require it.
- Cosmetic RNG/event should NEVER change physics/seed/settlement. Sandbox and debug force mechanics must not write actual live account progress.
- Never change/overwrite another developer's work; inspect status before commits, do not delete user data. Never disable or weaken an existing regression to report green.
- Simulation safety: no skipped physics time, no duplicate event/reward, provenance trace, stable ordered collision & event processing. Caps for shards150, depth10, chainEvents400, waves64, scheduled1024 must remain bounded unless a separate measured, justified change is approved.
- M12~M16 numeric balancing candidates are *experiment proposals* not a blanket license to change production figures arbitrarily. Compare A/B and document reasons for selected production values.
- M13 Destruction Stage I..IV and M14 World I..V are separate systems; do not combine. Existing Rank0..4 and RunTier remain separate. All new progression changes are frozen per run and committed only on settlement.
- Keep main gameplay easy to enter; advanced challenge modes optional. No global wipe, price-only grind extension or new payment-like mechanic.
- Real browser pointer QA (not mere Node simulation) and human-experience uncertainty must be recorded separately.

## 3. M12 — Core Loop & Power Curve

Implement P0 first: fix scheduler iteration exhaustion causing remaining step simulation time to be skipped. Model remaining physical debt/events honestly rather than simply increasing cap512. Test old non-cap paths for exact parity and cap cases for newly correct behavior; no result credit after time ends.

Then implement M12 Spawn Director v2: preserve early baseline and compare high-power safe supply candidates15/18/21/24/30 objects/sec, hysteresis, safe placement, combat metrics, source/time tracking, allowed actual Rank/Tier. Select production profile using evidence; no free currency spawn loop.

Redesign Elite rare chance from eligible-spawn-attempt frequency to eligible-Run policy; compare .03/.15/.20/.25 with separate first-introduction and placement-failure/pity logic. Existing one Elite/Run and settlement exactly once.

Improve Codex cause-based progress/failure explanations for hard shape feats, without resetting progress or faking events.

Deliver M12 report/test/benchmark: benchmark:m12, qa:m12, browser pointer ≥6 actual runs, screenshots, A/B balance, source signatures. Commit and push M12 before continuing.

## 4. M13 — Destruction Evolution

Introduce 4 stages Shatter/Cascade/Overload/Storm, candidate unlock at purchasedLevels0/15/40/75 (legacy M11 max maps to top stage), with actual differently shaped fights at each stage. Do not add 30 permanent skills.

Storm Response for actual chain5/10/20; 10 milestone reserves a new linkPocket (StageII+), 20 milestone a bridgeCorridor (StageIII+), StageIV supports special stormCrown (three new formations in total). Consume normal future Spawn Director budget, enforce perRun/perChain trigger caps, no unbounded echo/farming/free shape economy, safe bounds, no visual-only fake chain.

Record causal Chain spread distance, #clusters, true triggered skills, kill counts and cooldown/fallback reasons. Validate Crusher/Cascade/Reactor/Control builds yield meaningful differences. Stage and World not conflated.

Real Chrome 20sec runs, FX ON/OFF deterministic parity, feature OFF equals shipped M12. Commit/push M13 report and benchmark:m13, qa:m13.

## 5. M14 — 5 Worlds & structural Bosses

Add World1 Fragment Belt, World2 Circuit Nest, World3 Gravity Rift, World4 Singularity Field, World5 The Shard Storm. Distinguish World selection from Run Tier and M13 Destruction Stage.

Implement World Survey objectives and 5 structural boss encounters (Fracture Warden, Relay Citadel, Rift Engine, Singularity Core, Storm Heart). Composite pre-existing Shape parts, actual shield/relay/phase/portal/chain causal gates; no fake HP-only bosses or player damage system. Boss run is still 20sec (or existing ExtraTime policy), not a separate five-minute stage.

World/Survey/first clear/ending save only on actual final settlement, reward exactly-once, failure normal payout, replay unlock preserved. M11 legacy players do not lose assets or get unearned Boss clears. World5 actual StormHeart death -> first ending + replay/free play.

Test Rank locks, real 20-second boss feasibility, safe atomic spawn, phase order false/true, migration, Chrome pointer and reports. Commit/push M14 before next.

## 6. M15 — Optional challenges/endgame

Add 3 Protocols×3 actual Run tasks, 3 Storm Depths, 5Run standalone Rogue Draft with deterministic 3-choice post-run offers, and 6 mutually exclusive Research variants.

Keep Normal mode and permanent account economy intact. Draft combat loadout is virtual/separate: NEVER reset or overwrite owned levels/relics/catalyst/photon/codex. Experimental draft pays badges/record only by default, not permanent resource farming. Persist draft offer/choices/progress and resume safely.

Research must present balanced alternatives, not infinite damage upgrades. Existing Signature/Evolution slot restrictions continue. Accessible optional UI doesn't obstruct main PLAY button.

Run benchmark:m15/qa:m15 + migrations/pending/aborted draft+full5 run replay, then reports & commits/push.

## 7. M16 — FX/audio/ending/release readiness

Polish M9.0 click/hit/miss/death effects, causal Chain5/10/20/Storm Response, Boss shield/core destruction, World5 ending. Add rate-limited audio event bus/user-gesture unlock/SFX mute/master settings. Existing reducedMotion/shake/FX OFF must work.

Use common Canvas polygon edge reveal for 19 shape spawn only if readable and performant; preserve hitboxes and vulnerability timing. Full physics hit-stop or global time dilation, 1280×720 physical arena change, WebGL bloom are separately gated TODOs: do not ship if accuracy/benefit not proven. Default to cosmetic pseudo slow.

Implement ending after actual settled campaignComplete, skippable/replayable, no duplicate reward. Browser compatibility, long-save, corrupt-save export, full test matrix. Update README, release notes, reports, source hash. Do NOT deploy to remote server without requested deployment.

## 8. QA / milestones contract

For each milestone:
- Implement actual features; add unit/negative/compositional tests, not UI mock-only.
- Run npm test and pre-existing relevant m11/newer regression/benchmark commands, plus benchmark:mXX and qa:mXX in package.json.
- Seed set [31415,1,7,42,99], 3 builds, Fresh/LegacyMax, fixed20/ExtraTime32, Normal/Anomaly, FX OFF/ON. Compare existing baseline OFF exactly except explicitly changed physics correctness.
- Browser test ≥6 actual mouse-pointer Runs including 620px/1280px/1920px/Focus/DPR/Result/Replay/click-hold-drag.
- Save migration schema1..latest, bank/Catalyst/100Lv/loadouts/Codex/Elite/full20record, pending exactly once, reload2 times; never silently drop user data.
- Balance experiments count actual runs/seeds/builds; separate smoke vs full simulations. Preserve source signature and artifacts; if runtime budget is constrained, be explicit about partial QA, never claim a full benchmark not run.
- Read player-experience unknowns as human gate and prepare a human Playtest guide, but do not claim the game is 3~4h fun based only on bots.
- Deliver docs/Shard_Storm_MXX_Implementation_Report.md, Balance_Report.md or M16 Release_QA_Report.md, artifacts/mXX-*, screenshot, README updated; commit/push each milestone.
- Final summary: implementation branch, final HEAD, M12/13/14/15/16 actual completion status, tested source/CLI evidence/actual Chrome run counts, unresolved bugs, optional VFX TODO, deploy readiness.

Stay focused on the core difference: attack one geometry piece -> successive causal fragments/waves -> collapse a larger and ultimately final structure. Do not inflate content counts instead of improving that experience.
