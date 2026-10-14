# Shard Storm — M9.0~M11 통합 로드맵·Codex 실행 계약 v1.0

- 작성: 2026-10-15
- 저장소: https://github.com/Seunghyun0606/shard_storm
- 코드 기준: origin/feat/m7-m8-relic-contract-anomaly. 시작 전 fetch 및 해당 브랜치 최신 커밋 확인.
- 문서 브랜치: docs/m9-m11-content-expansion (M8 완료 소스 + 다음 4개 PRD)
- 권장 개발 브랜치: feat/m9-m11-content-expansion; 이 문서 브랜치를 base로 새로 생성 후 코드 개발, 단계별 커밋·push.
- **명세가 작성됐다는 것은 기능 구현/QA 완료를 의미하지 않는다.** 코드 변경은 Codex 후속 개발 작업.

## 1. 독립 기획서 4개

| 마일스톤 | 기획서 | 결과 |
|---|---|---|
| M9.0 Playfield & Feedback | [M9.0 PRD](Shard_Storm_M9_0_Playfield_Feedback_PRD_v1.0.md) | 최대1440px+Focus/DPR, HUD 비가림, Click 타격감, Shake, cosmetic slow, Field Clear, Fade-in |
| M9 Shape Ecology | [M9 PRD](Shard_Storm_M9_Shape_Ecology_PRD_v1.0.md) | Shape6, Modifier4, 배치4, 소개 Spawn Director, 7→13Shape, schema6 |
| M10 Skill Expansion | [M10 PRD](Shard_Storm_M10_Skill_Expansion_PRD_v1.0.md) | 신규30 Skill, 19→49 nodes / 50→100 levels, Signature10/활성3, Evolution5×3/활성2, schema7 |
| M11 Collection & Advanced Shapes | [M11 PRD](Shard_Storm_M11_Collection_Advanced_Shapes_PRD_v1.0.md) | Shape6, 추가 Trait4(총 신규8), 13→19Shape, Codex19×4, Elite6, schema8 |

고급 연출 명세의 실제 구현 보류 목록: [Deferred VFX TODO](Shard_Storm_Deferred_VFX_TODO.md).

## 2. 누적 콘텐츠 현황과 목표

| 항목 | 현재 M8 | M9 종료 | M10 종료 | M11 종료 |
|---|---:|---:|---:|---:|
| Shape 종류 | 7 | 13 | 13 | 19 |
| 기존 Cracked/Charged/Enhanced | 3 | 3 | 3 | 3 |
| 신규 2차 Trait 종류 | 0 | 4 | 4 | 8 |
| 새 배치 패턴 누적 | 0 | 4 | 4 | 4 |
| 구매가능 Skill nodes | 19 | 19 | 49 | 49 |
| 구매가능 Skill Lv | 50 | 50 | 100 | 100 |
| Signature 종류 / 활성 | 0 | 0 | 10 / 3 | 10 / 3 |
| Evolution form 종류 / family 활성 | 0 | 0 | 15 / 2 | 15 / 2 |
| Relic / Contracts / Anomaly | 6/10/6 | 유지 | 유지 | 유지 |
| Shape Codex 고유 목표 | 0 | 0 | 0 | 19×4 = 76 |
| Elite Presets | 0 | 0 | 0 | 6 |
| Save schema | 5 | 6 | 7 | 8 |

M9.0은 시각적/레이아웃 작업으로 schema5 유지. 각 다음 schema는 이전 정상 저장을 보존하며 shard-storm-v1 스토리지 키를 절대 바꾸지 않는다.

## 3. 구현·통합 순서

### Phase 0 — M8 Baseline Gate

- M8 origin 최신 코드, README, 구현/밸런스 보고서, config/storage/progression/game/render를 읽고 initial git HEAD SHA 기록.
- 실제 npm test, 대표 benchmark, 20초 브라우저 포인터 QA 스모크를 우선 실행. 과거 보고 153PASS와 69,420 Run은 재실행 이전까지 **과거 보고**로 분리.
- Base seed [31415,1,7,42,99], Fresh/LegacyMax, 20/ExtraTime, Normal/Anomaly, 가진 Rank/Relics와 replay behavior 캡처.
- 로컬 변경사항·다른 병렬 세션 커밋을 덮어쓰지 말 것.

### Phase 1 — M9.0 (먼저 구현)

- 화면 폭/고해상도/Focus/HUD 개선을 전투와 분리. Attack hit/miss/death/Chain/Special cosmetic hooks와 visual-only pseudo slow.
- 고성능 셰이더, 진짜 물리 slow, logic arena 확장은 Deferred TODO. 단계별 커밋+20초 실제 브라우저 QA 및 0-효과 경제 패리티.
- 결과 보고: docs/Shard_Storm_M9_0_Implementation_Report.md 및 docs/Shard_Storm_M9_0_Visual_TODO.md(공통 Deferred VFX TODO와 교차 링크).

### Phase 2 — M9

- 신규6 shape에서 우선 Splitter/Fuse/Conductor → Mirror/Gravity/Repair의 실제 효과 구현.
- formation4/SecondaryTrait4/spawn director / Schema6 / M8 회귀.
- 전투 관련 값은 선언형 config와 RNG stream 분리, Echo child 무한 farm 방지.
- 결과 보고: docs/Shard_Storm_M9_Implementation_Report.md + Balance_Report 및 artifacts/m9-*.

### Phase 3 — M10

- 신규30 skills 완전 구현 후 Signature10(활성3)/Evolution5family×3(활성2), 별도 loadout UI·schema7.
- 추후 M11의 Portal/Phase/Prism에 의존하는 새 skill도 M10 내 Mirror/Gravity에서 실제 동작해야 함. Stub-only, tooltip-only 완료 불허.
- 결과: docs/Shard_Storm_M10_Implementation_Report.md + Balance_Report / artifacts/m10-*.

### Phase 4 — M11

- 고급6 shape(Portal Pair/Parasite Link/Phase Crystal/Chain Beacon/Shifter/Prism Lens), 추가 secondary4, Codex19×4, Elite6.
- M10 Portal Momentum/Portal Calibration/Phase Disruptor/Magnetic Polarity/Prismatic Cascade와 신규 Shape의 실제 상호작용.
- schema8/결과 UI/독립 Chain events, 6 Elite는 normal Arena 혼합 출현.
- 결과: docs/Shard_Storm_M11_Implementation_Report.md + Balance_Report / artifacts/m11-*.

### Phase 5 — 통합 검증·보고

- 7→13→19 type, 19→49 node, 50→100Lv, Codex76/Elite6 모두 정확한 갯수와 구현 검사.
- 기존 원래 20초 직접 플레이가 새 콘텐츠에서 희미해지면 정보 과밀도·효과 빈도·스폰 분포 측정 후 실측에 따른 개선만 적용.
- New Rank 획득/UI 안내, first encounter, late spawn, Capped effect frequency, Contract 성공률, bestChain, blank arena, averageFPS/tickP95, saved migrations 등 누락 없음.
- 브라우저 UI에서 어려운 작업은 셀프 테스트와 기록으로 대신하고 사람 체감 검증은 별도 gate.
- README에 최신 Run/새 Shape/Skills/Codex/Focus/QA/Save 업데이트하고 docs 간 교차 링크와 최종 SHA push.

## 4. 공통 불변조건

1. 원래 기본20초, ExtraTime≤32, 직접 클릭·홀드·드래그, 순차 event queue, 물리 first-contact.
2. Canvas 960×540 **논리좌표**는 M9.0에서 보존, CSS로만 최대1440px 표시 확대. logic arena real resize는 TODO.
3. M8 원래 7shape/19skills/6Relic/10Contract/6Anomaly, Ore rates, Rank thresholds, Refinery .06·10tokens·5slots 유지.
4. Echo/보조 하위 도형은 무한 spawn·Photon/Catalyst/Rank/contract farming 금지.
5. Gameplay/physics RNG와 cosmetic RNG 분리. feature OFF일 때 M8 기존 seeded deterministic parity.
6. per-Run/Chain caps: shard150/depth10/chainEvents400/waves64/scheduled1024 등을 변경하려면 별도 실측 및 PRD 수정 필요.
7. 사용자의 live bank·purchases·records·pending/lastSettlementId를 migrations1~8에서 보존. Fresh Lab/디버그 세이브 완전 격리.
8. 임의 경제 nerf 또는 Skill 가격 인상으로 MAX 소진 문제 숨기지 말 것. M8 자동 report에서 ExtraTime 기준 Skill MAX 약30~34 Run이고 장기 Photon/Catalyst 잉여 있다는 사실을 근거로 비교.
9. 새로운 도형 해금은 문서가 정한 Rank와 RunTier를 모두 만족하고 유효한 안전 좌표에서만. 정상 게임에서 발견 가능성 계측.
10. 새로운 시각 연출은 전투 dt/게임 시계/정산에 영향0. 미완료 고급 FX를 출시 완료로 위장하지 말 것.

## 5. 자동 QA 최소 실행 계약

- 고정 seeds [31415,1,7,42,99], build Crusher/Cascade/Reactor, fresh/legacy max, fixed20/ExtraTime, 20/50/100/200/300Run checkpoint를 우선.
- 단계별 20초 실제 Chrome pointer QA ≥4Run. M10,M11은 ≥6Run; START/RESULT/PLAY AGAIN/Focus/좁은620px/리로드, 성능.
- 신규 m9-0/m9/m10/m11 test suites는 해당 기능들을 실제 공격/kill/physics/outcome으로 단언. 강제 fixture는 fixture라고 표기.
- Old schema1→latest,2→latest,3→latest,4→latest,5→latest,6→7/8,7→8 등 정상 기존 자산 완전 보전·이미 정산한 Run의 중복 지급0.
- 기존 commands npm test, npm run benchmark, npm run benchmark:balance, npm run benchmark:m5-m6, npm run benchmark:m7-m8; 신규 qa:m9-0, benchmark:m9/qa:m9, benchmark:m10/qa:m10, benchmark:m11/qa:m11.
- 각 benchmark는 실제 처리된 Run count/seed/policy/error/환경/cached-output signature를 저장. 과거69,420Run을 계속 모든 milestone마다 강제 반복하지 말고 기준선1회+회귀 스모크+최종 전체를 분리(비교에 쓰는 Run은 실제 수행해야 함).
- QA가 실패한다면 근거와 수정 여부를 명시, 테스트 비활성화나 결과 미화 금지.

## 6. Delivery Checklists

- M9.0: 확대 CSS/Focus/DPR/HUD 가림 없음, 실제 pointer hit parity, visual FX economy parity, TODO 파일 작성.
- M9: 6Shape×실발동+4Trait+4formations+intro/spawn/schema6/대표 상호작용 screenshot.
- M10: 30node×실발동, Signature 10 중3, Evolution15 중 family2,49 graph·100Lv/schema7.
- M11: 새 Shape6과 총19, 후속 Trait4(총8), Codex19×4, Elite6, schema8/잔액보존.
- 모두: 포인터/브라우저 실제 QA, docs report, benchmark summary, README, 원격 push, commit history 최종 SHA.
- 사람의 3~4시간 재미, 모든 UI 몰입/난도 인지, Relic 선택, VFX 감각 등은 **인간 검증 전까지 미검증**으로 기록.

## 7. 개발 작업 인계

- Branch 전략: 문서브랜치 docs/m9-m11-content-expansion에서 코드작업용 feat/m9-m11-content-expansion을 분기. 기획 문서와 M8 소스가 동일 worktree에 있게 함.
- 같은 브랜치에서 M9.0→M9→M10→M11 순서, 각 milestone 완료 시 report/commits/push; Codex session 교체는 해당 브랜치+문서+최신 report로 복구.
- M9.0만 구현하고 전체 M9~M11을 완료라고 보고하면 안 됨.
- 최종 보고: branch, HEAD sha, 구현된1) shape2) traits3) skills4) signature/evolution5) codex/elites6) FX, 실제 QA outputs, 버그/미완료/추후 TODO. PR/Merge/배포는 별도 명시 요청 전에는 수행하지 않음.
