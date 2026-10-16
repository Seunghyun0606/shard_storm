# Shard Storm M15 — Optional Challenges & Endgame PRD v1.0

- 작성: 2026-10-16. 상태: 기획 / 미구현.
- 선행: M14 World5/Boss5 메인 캠페인 완성.
- 목표: 편안한 메인 Run을 과제형 게임으로 바꾸지 않고, 희망하는 사용자에게 전략·재도전·빌드 실험을 제공한다.
- 범위 MVP: Challenge Protocol 3종×3Run, Storm Depth 3단계, Rogue Draft 5Run·Run 사이 3지선다, Research 변형6종.
- 기존 Rank/Skill49/Evolution15/Signature10/Relic6/World5/Codex19×4/Elite6/Anomaly6/Contract10을 보존하고 그 위에 별도 mode를 제공한다.
- 새 화폐·강제 Prestige wipe·가챠·온라인 랭킹 서버·일일 로그인 요구·모바일 게임화는 범위 밖.

## 1. 모드 위치와 전환

- TITLE/RESULT에서 기본 'NORMAL / BOSS'를 최우선으로 둔다. 'CHALLENGE LAB' 아래 PROTOCOL / DEPTH / DRAFT / RESEARCH를 선택적으로 펼쳐 진입.
- World5 완료 전에 Challenge Lab은 '미리 보기·나중에 해금' 상태여도 무방. 일부 초기 Protocol은 World2 이후 열어 볼 수 있게 할 수 있지만 메인 해금에 영향X.
- 모드 진입은 사용자 명시 선택, 기본 Run 자동 변경 금지. 모드 변경은 PLAYING 아닌 TITLE/RESULT settled에서만.
- 최악의 UI 과밀 방지: 현재 진행 중인 모드, 남은 Run/성공조건을 한 줄로 표시하고 전투 canvas를 덮지 않는다.
- 모든 모드의 실제 전투는 기존 20초(Extra Time20~32초 사용시 해당 기존 정책)를 따름; 특별한 제한이 있다면 모드 사전 안내.

## 2. Challenge Protocols (3×3 Run)

각 Protocol은 순서 있는 3개의 Run 결과로 진행. Run마다 실제 원인 기반 기록을 검증, 단계 완료는 정산1회.

| Protocol | Run 1 | Run 2 | Run 3 | 전술적으로 다른 점 |
|---|---|---|---|---|
| Chain Architect | 동일 Fuse Chain에서 실제 폭발2회 | Conductor 전도로 서로 다른 정상 대상2개에 피해 | 실제 Chain20+ | Fuse→Conductor→Chain |
| Precision Breaker | 직접 최종타10 | 보호 중 Phase에 0피해를 주지 않고 취약 창 직접 kill1 | 실제 직접 최종타로 핵심 Structure part kill1 | 무작정 광역 폭발 대신 직접 타이밍 |
| Rift Master | mainShard Mirror 반사 이후 실제 kill | Gravity bent mainShard kill | Portal passage 이후 distinct-target mainShard kill | 원인과 이동 경로 조작 |

- 동일 world/Rank/RunTier eligibility를 무시하는 target 강제 출현X; 불가능한 입력 조합이나 도형 미출현 때문에 실패하면 다음 Run 재도전할 수 있도록 pass/fail/attempt counts 저장.
- NEXT를 누르지 않고 정상 Run을 종료해도 Protocol 진행은 mode active snapshot에 따라 단 한번만 증가. 이미 단계 완수 후 동일 Run에서 반복 충족X.
- 3Run 연속 도전이므로 Run2 실패 시 초기 MVP 권장은 '해당 단계 재시도'(Run1 재수행 강제하지 않음), 플레이어가 더 높은 난도를 선택하면 strict reset 규칙을 M15 후속 선택형 옵션으로 분리.
- 기존 원인 로그(causal log), Codex actual shape kills, pending result를 활용하고 fixture/Replay/Skip의 부정중복 진척 차단.
- 보상: 영구 unique badge + 특정 Research recipe blueprint unlock, replay history에 perfect/failed 기록. 무제한 Photon payout/파밍 루프X.
- 처음 3Protocol이 실제 플레이에서 차별화되지 않으면 9~12개로 확장하지 말 것.

## 3. Storm Depth (3단계 MVP)

- World4 또는 World5 first clear 이후 World replay에서 optional difficulty 1/2/3.
- 기존 M11 Anomaly 선택/World Tier/Destruction Stage와 서로 다른 계층. Difficulty1은 base world with no restriction; difficulty2/3는 적격 special/trait/formation mixture에 중점을 둔다.
- Difficulty2: protection+conduction 혼합 포켓 비중 증가(기본 대비 +10%p 이내의 시범 가중치), Shield Fortress와 Bridge Formation 조합 가능하되 안전 타깃 여유 확보.
- Difficulty3: World Boss의 phase-latch와 Bridge Formation 조건 1개씩 강화(예: 별도 anchor의 실제 피해 조건), Elite concurrent wave/cap 증가 없이 조합 난도만 조정.
- HP 단순 두 배/셋 배 금지. 사용자가 능력 MAX라도 적절한 첫 타깃 선택과 실제 제어를 요구해야 한다.
- 보상: World+Depth별 bestChain, successful clear time, badges, replay/ghostless leaderboard(local only). 원래 경제 Photon/Refinery 변경 없음.
- main campaign 미완료 user에게 Depth3를 강제하거나, 아무 재화 없이 원래 Boss를 다시 클리어하도록 강요X.

## 4. Rogue Draft — 5Run standalone mode

### 4.1 기본 계약

- 최대5개의 20~32초 Run을 묶은 별도 도전. 도전 중 한 번의 Run이 완료될 때마다 3개의 임시 선택지 중 정확히 하나를 고른다.
- Run1 시작 전 3개 중1개 initial perk draft 가능, Run1~Run4 RESULT에서 이후 다음 Run을 위한 하나의 perk 선택; 최대5 perks 활성(계열 중복 허용 여부는 초기 MVP '동일 perk 중복 금지', 고정).
- 기존 영구 Skill/Signature/Evolution/Relic은 플레이어가 소유한 그대로 무제한 합성하면 draft 의미가 없어지므로 독립 Draft loadout policy 사용: Rank/unlocked shapes는 기존 상태 유지, 일반 permanent skill 계정 수치는 고정 baseline/최대 허용량을 명시한 'draft ruleset'; 기존 사용자 save는 절대 덮어쓰지 않음.
- 권장: Draft 전용 virtual SkillLoadout는 M11 기초 스킬 19종 중 preset 1개 + 0 Signature/Evolution/Relic에서 시작, perk가 순차 추가. 상품은 계정 소유와 무관한 **임시 sandboxlike combat config**, 결과는 도전 성적만 live account에 commit; Run Raw/Photon 실제 지급 정책은 Normal과 구분하고 권장 0 영구 Photon 지급(도전 보상 뱃지)으로 시작. 실제 Run 시작 화면에 분명히 표시.
- 기존 World/Normal Run 경제를 덮어쓸 우려가 있으면 Draft in-memory game mode로 먼저 개발하고, 영구 account에는 draftBestScore/draftClears만 store.
- 3개 선택지는 고유 RNG stream(seed, challengeId, roundIndex), 새로고침하여 더 좋은 손패를 무작위 재추첨하지 않음. chosen perk/rng cursor/offer snapshot 저장.
- 5Run 마지막 결과에서 totalDestroyed, maxChain, bestChainDistance, uniqueMechanicsTriggered로 score 결정. Score formula는 config 선언형; 5Run 중 동일 seed/choices 리플레이 일치.
- 도전 중 중단시 이어하기·포기 명시 버튼 제공. 도전 저장은 Normal bank/pending settlement와 원자적으로 분리. 도전 포기 시 사용자의 영구 화폐/기록 손실X.

### 4.2 초기 Perk 후보9종

| ID | 신규 스킬이 아닌 임시 변형 | tradeoff |
|---|---|---|
| pierceStorm | main shard 첫 실제 적중 이후 한 번 추가 관통 | 사거리-25% |
| chainOverload | Chain10 최초 달성시 추가 1회 전파 지원 | direct damage-1 |
| reactorEcho | Reactor delayed wave가 작은 후속 wave 예약 | Reactor 최초 wave delay 증가 |
| mirrorFan | Mirror 반사 후 auxiliary 2개 | main shard damage-1 |
| gravityDrift | Gravity bend 추가 최대15도 | projectile range-25px |
| conductorWide | Conductor link range +20px | 전달 피해-1 |
| shatterFocus | direct attack+2 | attackInterval+.04s |
| phaseHunter | Phase 취약 window+.2s | wave radius -15px |
| chainSalvage | Chain20+ 1회 추가 score bonus | 영구 Raw/Photon 보너스는 없음 |

- per-chain/Run caps는 원래 C.caps와 겹치는 M10 ability cap을 그대로 준수. 동시에 활성된 perk가 모순되지 않도록 capability/compatibility matrix 정의.
- perk label은 기존 Signature/Skill 영구 소유를 의미하지 않는다. 적합성에 따라 9후보 중3개 deterministic offer.

## 5. Destruction Research 6 변형

- World/Protocol 완료로 blueprint를 해금하고 기존 Photon/Catalyst로 영구 '연구 레시피' 구매. 연구된 변형은 기존 Signature 또는 Evolution 3/2 슬롯 내에서 **기본 형태와 배타적인 하나**를 장착.
- 초기 6안:
  1. Narrow Pierce — 관통 거리 증가, 추가 분열 감소.
  2. Scatter Pierce — 관통 수 감소, 보조 파편 증가.
  3. Focus Detonation — 폭발 반경 감소, 핵심 도형에 피해 집중.
  4. Delayed Bloom — 반응 타이밍 증가, 보조 파편 방향 분기.
  5. Gravity Spiral — bend 상한 증가, shard range 감소.
  6. Relay Surge — Conductor 범위 증가, 개별 전달 피해 감소.
- 단순 attackDamage+N 무한 강화 금지, 모든 6변형은 상호 배타 트레이드오프 명시. 기존 Skill 레벨과 Reputation 등 새로운 보조 화폐 없음.
- 가격 실험 기준: Photon 2000~12000 + Catalyst20~150의 분산 후보. 현재 300Run 잉여값을 이유로 절대 가격을 무작정 크게 높이지 말고 사람 체감 조정; 완료가 불가능한 업그레이드 금지.
- Research는 계정성 purchase/owned state, equipped variant는 Run 시작 snapshot; pending settle 전 구매 불가, pending records 중복 적용 금지.
- 해당 변형을 해금하지 않아도 normal campaign5 Worlds를 완료할 수 있어야 한다.

## 6. 모드별 저장/정산

- storageKey shard-storm-v1, M14의 다음 schema를 이어받아 신규 modeLedger/researchOwned/draftProgress/draftOfferSeed 등을 추가. 기존 schema1..latest 읽기, LZ4/CRC32/20records 그대로.
- Protocol/Depth/Research progress는 실제 settled RunId 기준 exactly-once.
- Draft의 독립 가상 전투 설정이 라이브 자산/영구 구매를 변경하면 safety-fatal test failure. 기존 6Relics/Signature3/Evolution2 loadout을 Draft 종료 이후 복원.
- 이벤트 소스 분류로 Protocol 조건과 Codex19 퀘스트가 섞여 잘못 완료되지 않도록 provenance tags.
- UI prefers reduced motion/Focus/620px 대응; badge/complete banner가 arena target 방해X.

## 7. 테스트와 완료 게이트

- Protocol9 distinct Run objectives positive/negative, 3-stage order, duplicate settlement/restart, shape rank eligibility, forced debug zero progression.
- Depth1/2/3 difficulty comparables; depth2/3가 HP×N인 가짜 난도인지 검사, tier/world/formations/caps respected.
- Rogue Draft 동일 Seed offers3, choices persisted, virtual loadout isolation/abort/resume, full5Run deterministic replay, 9perk cross-mechanic tests, no farming.
- Research6 purchase/lock/unlock/equip mutual exclusion/payments, existing Signature3/Evolution2 budget preserved.
- oldSave migrations, corruption protection, browser input+result/5Run standalone workflow; 620/1280/1920 CSS/Focus.
- M11/M12/M13/M14 regressions no test weakening; npm run benchmark:m15 + npm run qa:m15.
- 성장 실험은 Normal과 Draft를 분리. Protocol user UX: 실패 후 다시 시도할 이유가 있는지·장애 요인이 기계적 이해인지 검증.
- docs/Shard_Storm_M15_Implementation_Report.md / Balance_Report, artifacts/m15-*, README, all branch commits/push.

M15 Done은 반드시 '선택형'이어야 한다. Core Main Mode에 반복적으로 강제되는 과제와 UI 깊이를 추가하거나 유료/거래 구조를 도입하지 않는다.
