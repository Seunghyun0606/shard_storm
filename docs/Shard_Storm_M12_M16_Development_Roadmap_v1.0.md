# Shard Storm — M12~M16 Destruction Evolution 통합 개발 로드맵 v1.0

- 기획 작성: 2026-10-16.
- 저장소: https://github.com/Seunghyun0606/shard_storm
- 기준 구현 브랜치: feat/m9-m11-content-expansion (M11 기능 및 검증 보고 완료)
- 기획 문서 브랜치: docs/m12-m16-destruction-evolution
- 권장 코드 작업 브랜치: feat/m12-m16-destruction-evolution — docs branch를 시작점으로 별도 생성
- **문서 커밋은 코드 구현/QA/배포 완료를 뜻하지 않는다.** 별도 사용자 지시 전 main merge/서버 배포 금지.

## 1. 제품 철학 / 레퍼런스 반영

- Nodebuster에서 학습: 반복 공격→영구 성장→새로 상대할 강한 대상→명확한 최종 목표로 이어지는 파워 판타지. 대량의 스킬 구매 후 무목표 재화 파밍만 남는 상황 회피.
- A Game About Feeding A Black Hole에서 학습: 직관적인 단일 액션·시각적으로 커지는 파괴 규모·충분히 안내되는 메인 진행·선택형 후반 모드.
- Shard Storm 고유 차별화: 클릭 파괴가 다른 도형의 파편/파동/지연/전도/포털을 통해 **새로운 물체의 파괴를 연속 유발하는 공간적·인과적 체인**. 블랙홀 흡수나 단순 아이들 자동화로 변경하지 않는다.
- 핵심 루프: 20초 Run → Chain destruction → Raw/Photon/Catalyst/Result → Skill/Relic/Signature/Evolution → 더 큰 연쇄를 유발하는 배치/월드 → Boss/후속 도전. 20초 기본·원래 직접 클릭/홀드/드래그 유지.
- 영구 성장 완결 목표는 World5 Storm Heart first clear. 이후 자유 플레이/Replay/Challenge. 메인 캠페인 완주에 모든 Codex/스킬/Research 구매 강제 금지.

## 2. M11의 측정 사실 (새 구현이 아닌 배경)

| 항목 | M11 확인된 상태 | 새 방향 |
|---|---|---|
| 19 shapes; 8 secondary traits; 49 skills / 100Lv | 구현·자동QA307 PASS 보고 | 새 shape/skill 대량 추가 보류 |
| 54,000 M11 balance Runs / 180 paths; 28 Chrome20초 pointer Runs | 해당 M11 report 시점 기록 | 후속 성공의 자동증거가 아님; 마일스톤마다 재실행 |
| ExtraTime baseline Normal 첫100Lv MAX 중앙값 약69Run | 자동 조준 기준, 사람 시간 아님 | 증가한 파워가 실제 파괴 규모로 변해야 함 |
| Normal300Run Photon 중앙값238644 / Catalyst6917 | 자동경로 자산 잉여 | 새 가격 인상 아닌 플레이 목표/변형해금 |
| Elastic Spawn default OFF / .20sec×3 | 약15/s nominal, max20초 약300kill | M12 안전 공급A/B, M13 Chain-linked formation |
| Elite attempt probability .03 | 13500중12847 Run spawned(95.2%) | M12 Run-level probability + intro separate |
| Physics tickIterations512 | 잔여 slice 생략 가능 / cap hit 존재 | M12 물리 정확도 P0 |
| Codex Pentagon tech 성공 중앙값0/300Run | 자동 정책 일부에서 미달 | M12 실패 이유/의도적 공략 UX |
| World/Campaign 결말 없음 | M11는 Shape/Codex/Elite 중심 | M14 5World+5Boss+Ending |

M11 사실 출처: docs/Shard_Storm_M11_Implementation_Report.md, docs/Shard_Storm_M11_Balance_Report.md, docs/Shard_Storm_M9_M11_Human_Playtest.md.

## 3. 각 마일스톤의 실제 PRD

| Phase | 문서 | 기능·개발 수락 핵심 |
|---|---|---|
| M12 Core Loop & Power Curve | [M12 PRD](Shard_Storm_M12_Core_Loop_Power_Curve_PRD_v1.0.md) | no skipped physics, adaptive spawn A/B, Elite Run-rare, Codex actual progress, schema optional |
| M13 Destruction Evolution | [M13 PRD](Shard_Storm_M13_Destruction_Evolution_PRD_v1.0.md) | Shatter/Cascade/Overload/Storm4 Stage, Storm Response (Chain10/20), 새 연결 Formation3, 기존 budget/caps |
| M14 World Tiers & Milestone Bosses | [M14 PRD](Shard_Storm_M14_World_Tiers_Milestone_Bosses_PRD_v1.0.md) | World5, Survey5, 20sec structural Boss5, World5 Ending/Replay, latest schema migration |
| M15 Challenges & Endgame | [M15 PRD](Shard_Storm_M15_Optional_Challenges_Endgame_PRD_v1.0.md) | Protocol3×3 Runs, Depth3, standalone Draft5Run(3 choices), Research6, no wipe |
| M16 Juice, Audio & Release | [M16 PRD](Shard_Storm_M16_Juice_Audio_Release_PRD_v1.0.md) | causal hit/Chain/Boss juice, sound, 19 spawn edge reveal, accessibility, ending presentation, release QA |

Codex 실행 핸드오프: [M12~M16 Codex Handoff](Shard_Storm_M12_M16_Codex_Handoff.md).

## 4. 전체 구조 관계

- M11 Rank0..4 = account long-term discovery gate.
- M11 RunTier = current Run cumulative kill gate.
- M13 Destruction Stage I..IV = purchasedSkillLevel threshold 가이드 0/15/40/75; 파괴 규모와 formation 변화. RunStart frozen.
- M14 World I..V = account campaign cleared + selectedWorld + Survey/Boss clearance. RunStart frozen.
- M15 Mode = Normal과 분리된 optional challenge/Draft/Depth; 똑같은 계정 bank/Skill level을 wipe하지 않음.
- 순서: M12 안정성→M13 파괴 규모→M14 보스/엔딩→M15 옵션→M16 표현/출시. World5 과제를 스킬100Lv/모든 Codex 완료의 종속으로 설계하지 말 것.

## 5. 3~4시간 메인 캠페인 목표 (검증 전 가정)

| 실제 누적 플레이 시간 목표 | 의도한 새로운 경험 | 확인 지표 |
|---|---|---|
| 0~15분 | 기본 한 클릭/단순 Chain/첫 강화 | 첫 유효 click/kill, 첫10kills 체감 |
| 15~40분 | Fuse/Conductor/Hex의 우선 타깃 판단, World2 | 신규 도형의 실제 발견/설명 이해 |
| 40~90분 | Mirror/Gravity/Portal을 잇는 공간적 연쇄, World3 | Chain distance/number of clusters |
| 90~150분 | Stage III/IV, Reactor/Phase 조합과 World4 | chain20 attempts, boss failed/retries |
| 150~240분 | World5 StormHeart 3-phase break & Ending | real win, retry motivation, perceived climax |

- 기존 M11 자동 Run69 to MAX를 실제 69×20s human gameplay로 환산하지 말 것; 구매·결과·타깃 판단·실패·재시도 시간이 있다.
- 구매 가격이나 잠금 타이머로 시간을 끌지 않는다. 플레이가 너무 빠르면 새 '의미 있는 목표/파괴 차이'를 먼저 실험하고, 4시간 완주를 강제하지 않는다.
- 사람 Playtest 최소 Fresh 2 profiles / Legacy MAX 1 profile / World5 prior completion 1 fixture(진짜 플레이·fixture 분리) + 빌드 Crusher/Cascade/Reactor 교차테스트. 확실한 성공률을 말하려면 더 큰 표본 필요.

## 6. 전투·성장·정산 공통 불변 조건

1. Run 기본20초; ExtraTime 기존20~32초. Skill, hit/drag/hold, enemy motion, 19 shape types, 49 nodes/100 Lv, 8 new secondary/3 primary modifiers, 6 Relics/10Contracts/6Anomalies 모두 보존.
2. M9.0 Canvas logical960×540 and arena32..928/78..512 보존. CSS width up to1440, DPR, focus, HUD top region. 실제 world 크기 확대는 명시 별도 QA 후.
3. 20초 고정 simulation elapsed와 visual-only time dilation은 분리, 신규 M16 optional physical slow motion은 P0 안정성 관문 통과하지 못하면 deferred.
4. gameplay RNG streams independent of cosmetics, source event cause/chain depth/target unique, no duplicate damage/payout, spawn safety. 신규 M13 gameplay ON의 차이는 명시한 formation/supply만.
5. caps shard150/depth10/events400/waves64/scheduled1024 유지(정확성 보정은 상한 증가가 아님), schedule/debt simulation skipped seconds=0 목표.
6. 기존 store key shard-storm-v1, LZ4/base64 CRC32 full last20 run records, damaged save original preserved, Export·pending recover exactly once, bank/100 levels/Relic/Signature/Evolution/Contracts/Anomaly/Codex/Elite records intact.
7. 기존 M11 schema8→필요할 때만 schema9+ 점진 migration, schema1..current 읽기. 영구 새 fields는 Pending settlement one-time transaction.
8. Forced content, debug, sandbox fixture 또는 synthetic seed paths는 live account progression의 근거/보상으로 전환X.
9. M15 Draft mode는 영구 자산과 별도 virtual loadout, 기본 경제 source와 분리; 진척/Badge만 persist하는 방향 권장.
10. 하나의 콘텐츠가 너무 드문 확률/Rank 또는 부품 spawn이 불가능해 World/Codex를 무기한 차단하지 않도록 보장 시도 및 실제 pointer QA로 입증.

## 7. 시험 계약 및 문서화

- 모든 마일스톤 앞에 현재 코드 HEAD·기존 307 unit tests·기존 qa:m11/benchmark:m11 및 browser/save smoke를 baseline으로 재검증. 보고된 과거 수치와 이번 실실행 수치 구분.
- 공통: seed 31415/1/7/42/99, Crusher/Cascade/Reactor, Fresh/LegacyMax, fixed20/ExtraTime32, Normal/Anomaly, Rank0/4, 620/1280/1920px/Focus ON/OFF, user realistic pointer.
- 발전 A/B는 같은 seed/input and content feature ON/OFF; gameplay RNG 차이의 원인을 추적. FX ON/OFF는 전투·정산 모두 완전 동일.
- 각 마일스톤 추가 unit tests, scenario fixtures(true/false), actual pointer 20sec ≥6Run, saved migrations, retry/refresh/Skip/Replay, event cap stress, browser error0.
- benchmark:m12/13/14/15/16 + qa:m12/13/14/15/16를 구현. 성장 checkpoint1/5/20/50/100/200/300을 필요한 마일스톤에서 수행. 전 과정에 54,000Run 이상을 매번 반복하는 비용은 줄이고 스모크/대조/전체 측정 구분.
- Report: 각 docs/Shard_Storm_Mxx_Implementation_Report.md, Balance_Report.md; M16 Release_QA/Human_Playtest. Artifact source signature/seed/Runs/fixtures/environment/logs/screenshots. README 최신.
- 아무 단위 테스트나 strict original expectation을 낮춰 녹색으로 만드는 행위 금지. 게임룰 변경이면 설계 근거와 baseline new control dataset을 함께 제공.
- 3~4시간 재미, 타깃 우선 판단, 새로운 목표 재도전, 메인 Boss 난도는 사람 평가 전까지 '미검증'으로 표기.

## 8. 단계별 Codex 역할

**개발 메인 브랜치: feat/m12-m16-destruction-evolution (docs branch로부터 분기)**.
- M12 P0 scheduler correctness, later Spawn/Elite/UI. 계측/엔진/저장 회귀 보고서.
- M13 Stage4 + StormResponse + Formations3. 이 단계 끝나고 사람이 플레이해서 기존과 명확히 다른지 확인할 수 있도록 영상/QA 스크린샷/요약제공.
- M14 World5+StructuralBoss5+Ending. 전체 캠페인 자연 플레이 접근성 테스트.
- M15 Optional modes, Draft5Run + Research6. 기존 bank/skill data zero wipe.
- M16 VFX/Audio/Accessiblity/Release, no speculative expensive shader forced.
- 각 단계를 실제 구현/보고/commit/push, 실패 있으면 blocker+partial results 기록; 전체 Done으로 표시하지 말 것.
- main merge/PR 및 원격 게임 배포는 사용자의 별도 요청 전 금지.

## 9. 위험과 결정 보류 사항

- Spawn supply 프로파일: 15/18/21/24/30개/초 후보는 테스트 전 운영값 미확정.
- Elite Run-level .03/.15/.20/.25+Pity 후보는 실험/사람 검증 후 운영 적용.
- DestructionStage Level15/40/75 초기 후보로 지표가 나쁘면 조정, M11 Legacy 계정은 자동 최상위 인식 보장.
- World Survey World4 Phase/World5 Chain15가 20초에서 불가능해지면 target mechanics가 나오도록 적격 출현을 개선하고 조건 완화 여부 별도 보고.
- Draft payout=0 initial recommended (Badge-only), 20초 Normal 보상과 혼동하지 않도록 UI에서 명시; 사용자 별도 승인 없이 permanent currency changes 적용 금지.
- M16 실제 물리 slow motion/Shader/logic arena resolution 변경은 위험성이 높아 별도 prototype+approvals; visual-only default fallback.
- 메인 Campaign5 Worlds/5Boss 중심을 유지하고 Contracts/Anomaly/Codex/Relic은 보조 시스템이지 필수 모든 완료 목표가 아님.

## 10. 최종 Done Definition

- M12: no skipped physics, spawn supply risk controlled, Run-rare Elite, Codex readability.
- M13: four destruction stages, reactive Chains/three new formations, distinct later-run chain scale, reproducible safe cap.
- M14: five worlds, five causal structure bosses, actual campaign ending and replay.
- M15: Protocol3×3, Depth3, Draft5Run, Research6 all optional, zero permanent asset wiping.
- M16: coherent hit/chain/boss FX/sound, actual final ending, web release readiness QA.
- Test reports/PASS+FAIL/source files with QA evidence, saved migrations, developer docs/README, final sha all verified.

최종 기준은 '더 많은 스킬·도형'이 아니라 '한 번의 공격에서 시작한 연쇄가 더 넓고 복잡한 구조물을 붕괴시키며 결국 명확한 목표를 완료한다'는 경험이다.
