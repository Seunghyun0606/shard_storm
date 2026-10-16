# Shard Storm M14 — World Tiers & Milestone Bosses PRD v1.0

- 날짜: 2026-10-16, 상태: 기획 / 미구현.
- 선행: M12 accurate scheduler / M13 Destruction Stage4 + reactive formations.
- 핵심: '강해졌으므로 무엇을 부술 수 있는가'에 답하는 메인 캠페인과 분명한 종착점.
- 범위: 선택 가능한 World5개, 복합 구조물 Boss5개, 각 월드의 조사(Discovery)→Challenge Run→실제 파괴→다음 월드 해금, 최초 클리어 엔딩, Replay.
- 비범위: 별도 적 공격·캐릭터 체력·탄막 회피, 새로운 공격 액션 버튼, 추가 화폐/절대적인 Prestige wipe, 게임 중 긴 컷신, 별도 실시간 보스 무대/연속 5분 전투.

## 1. 두 가지 단계의 명확한 분리

- M11 'Run Tier': 한 Run 내 파괴 수로 바뀌는 spawn eligibility; 기존 수치·역할 유지.
- M13 'Destruction Stage' I~IV: 계정 구매 스킬 레벨/성장으로 설정된 공격 환경, Run 시작에 frozen.
- M14 'World Tier' I~V: 장기 Campaign 진행·테마·어떤 복합 타깃이 활성인지·Boss cleared state; Run 시작에 frozen.
- 상호 관계: 월드 선택이 도형 Rank/RunTier gating을 우회하면 안 된다. World3에 방문해도 Mirror/Portal 등에게 필요한 Rank 부족시 장식 fake spawn이 아니라 해당 월드 잠금/정상 fallback.
- 하나의 Run에 3개 개념이 서로 다른 별도 규칙으로 동작; UI에서는 Current World, Destruction Stage, Run Tier를 구별하되 한 줄 요약/세부 패널.

## 2. 메인 캠페인 5월드

| World ID/이름 | 계정 접근 조건(초기) | 실제 도형·환경 특성 | Boss 구조물 | 가장 중요한 조준 |
|---|---|---|---|---|
| w1 Fragment Belt | fresh start | Triangle/Square/Pentagon/Star 중심; 낮은 특수 가중 | Fracture Warden | 보호 연결 해제 후 핵 파괴 |
| w2 Circuit Nest | w1 actual clear+Rank1 | Hex/Conductor/Fuse/Repair 대표; 원래 shape prerequisites 준수 | Relay Citadel | Ward·전도 체인 순서 |
| w3 Gravity Rift | w2 actual clear+Rank2 | Mirror/Gravity/Portal/Reflection 대표 | Rift Engine | 굴절/Portal로 떨어진 핵 공격 |
| w4 Singularity Field | w3 actual clear+Rank3 | Reactor/Ancient/Phase/Prism 대표; Ancient 자체 Rank4 조건은 유지 | Singularity Core | Stage wave와 phase timing |
| w5 The Shard Storm | w4 actual clear+Rank4 | 19종 상호작용과 연결된 multi-pocket 및 고위력 attack 지원 | Storm Heart | 여러 군집 연쇄로 3중 Core 구조 붕괴 |

- World table '대표 도형'은 배치/weight 우선일 뿐 나머지 19종 전부 금지X. 기존 드롭/Relic/Contracts/Anomaly는 보존.
- Rank4 미달일 때 World4는 Reactor/Phase 중심으로 충분히 클리어 가능해야 한다. Ancient의 Rank4 잠금은 World4 '메인 캠페인 핵심 필수 조건'으로 삼지 않음.
- W1/2는 자연 초기성장 계정에서도 충분히 볼 수 있는 데모 대상을 제공하되 Rank gate를 깰 수 없음.
- World 전환은 TITLE/RESULT settled 에서만 가능하고 PLAYING 도중 세계 변경X. World1 Replay는 계정 스킬 MAX 상태여도 허용; 과거 월드의 쉬운 파괴가 power fantasy로 보인다.

## 3. Survey — Boss 접근을 위한 짧은 실전 목표

메타계정의 worldSurveyProgress[worldId]가 실제 정산 Run들에서 쌓인다. 반드시 해당 World를 명시적으로 선택한 Run이여야 함.

| World | 공개된 Survey 조건(초기) | Boss 접근 |
|---|---|---|
| W1 | 누적 Normal shapes20 kill + 하나의 Chain5 경험 | Rank0 / 같은 World에서만 |
| W2 | 서로 다른 적격 Run 중 Conductor/Fuse/Hex의 qualifying kill 합계4 + Chain5 1회 | Rank1 and W1 clear |
| W3 | mainShard Mirror reflection or Gravity actual bend cause kill 1회, 두 번의 world run 정산 | Rank2 and W2 clear |
| W4 | Reactor stage wave actual triggered2회 + Phase vulnerable kill1회(필요 shape 적격이면) | Rank3 and W3 clear |
| W5 | 서로 다른2개 군집을 통과한 Chain15 한 번 + World run 정상 완료2회 | Rank4 and W4 clear |

- 위는 난도 후보. 최소 run count는 전부 의도적으로 짧게 설정; 3~4시간 확보를 위한 강제 grinding 금지. 사람이 20초에서 조건을 이해 못 하거나 너무 드물게 도형 등장한다면 Survey mechanic-first 조정.
- W4 Phase 도형이 자연 등장하지 않는 계정에선 신뢰할 수 있는 'first eligible encounter' 보장 시도를 M9 intro Director 방식으로 제공; Rank/RunTier/arena 안전 무시X.
- Survey의 progression은 Codex19×4와 독립이며, Codex III/IV 전부 완수 강제 금지. 이미 Codex 기록에서 완료 증거가 확실한 실제 사건을 가진 M11 계정은 survey 수치에 정확히 한 번 import 가능하나 source evidence 불충분하면 미인정.
- UI는 현재 수행해야 할 조건만 대표2개 표시, expanded World panel에서 세부 predicate/과거 attempt 확인. 실패 Run 기본 성장 보상 유지.

## 4. Boss는 '복합 구조물' (5종 모두 고유 전술)

### 공통 Boss Run

- World Survey 완료 후 RESULT/TITLE에서 Boss Challenge 선택 가능. 기본20초 Run(원래 Extra Time skill이 활성인 경우 20~32초를 그대로 따름), world special spawn schedule와 overlay은 하이재킹하지 않음.
- 0.3~1.5초 사이 world bounds에서 필요한 부품을 원자적으로 안전 배치. 안전 배치가 안 되면 같은 고정 seed에서 bounded tries 후 배치 실패 처리; 임의 중첩이나 Core만 단독 강제 생성 금지.
- Boss는 19 shape type 중 관련 도형으로 이뤄진 'Encounter Structure'이며 신규 영구 shape type 증가는0. 구조물 부품은 deterministic structureId, phaseId, partRole(core|shield|relay|portal|anchor) 태깅.
- 구조물 파괴 판정은 실제 part death/ward release/mainShard passage/wave touch 등의 명시 이벤트만으로 전이. 파괴되었다고 UI에서만 판정하는 fake HP threshold 금지.
- 보스 부품이 주요 이벤트로 남은 동안 기존 일반 spawner가 겹치지 않도록 예약 local safe zone 제공. 외곽 일반 spawn은 살아 있어 원래 파괴 loop 유지.
- Boss Run 한 판에 exactly1 boss, Boss core 죽음 후 나머지 일반 도형은 남을 수 있음; Run 종료 및 정산은 기존 timer policy대로. Boss clear 판정은 core 실제 파괴+구조물 phase predicate 충족+settlement once.
- 시간이 끝날 때 Core가 파괴되지 않았다면 World progression은 무진척(단 Survey 진행/기본 Raw/Photon/Contract 보상은 정상); 실패 UI에 마지막 해결 단계·필요 attack 표시.
- Spawn eligibility: Rank/RunTier를 충족하지 않은 특수 Shape는 사용하지 않거나 Boss 구성 안에서 'Boss 전용 object'를 명확히 구분하고 관련 메커니즘 테스트. 이 문서 권장 방식은 World unlock gate와 맞춘 eligible existing shapes만 사용.
- Boss component kill은 일반 도형의 실제 HP/Raw/Ore 규칙을 따르되 기존 Elite primary/exclusive aura/Codex 수익을 중복 생성하지 않음. Boss 특정 완료 보상(별도 Badge/World unlock)은 정산 exactly once, 통화 지급은 첫 클리어 기념 최소값만(선택)하고 repeated Boss farming 금지.

### 4.1 Boss 구성 (초기 컨트랙트)

| Boss ID | 부품/구조 | 잠금/단계 | 마지막 Core 파괴 조건 |
|---|---|---|---|
| fractureWarden | 보호2/ordinary shield+중앙 Star Core | shield node2를 먼저 실제 죽음 처리→Core vulnerable, 나머지 일반 Shapes는 진행 | 2보호 part 죽음 후 직접/파편/파동으로 Core 실제 죽음 |
| relayCitadel | Hex+Conductor+ordinary protected core | Hex ward release → Conductor transmit target과 연결 해제 → Core open | Ward 해제와 전도 후 Core 실제 죽음 |
| riftEngine | Mirror/Gravity + Portal Pair + target core | mainShard가 Mirror/Gravity 경로 굴절 또는 Portal passage를 통해 전환 트리거 1회 | 지정 Path event를 같은 Run에 발생시키고 Core 실제 죽음 |
| singularityCore | Reactor+PhaseCrystal+일반 core | Reactor wave 실제 실행 + Phase vulnerability window event 순으로 2개 latch | 두 조건 달성 후 Core 실제 죽음 |
| stormHeart | Core + 최소3방향 보호 anchor + linked pocket(s) | 독립한2군집을 연결한 Chain15+ 및3보호 anchor에 실제 damage/death → phase open | 모든 조건 + 마지막 실제 Core kill |

중요: world 특성은 Shape의 기존 HP·die behavior와 단순 충돌하지 않도록 부품의 임시 구조물 속성으로 설계한다. Core는 '기존 normal body를 사용하되 보호 phase가 켜져 있는 part'와 같이 명시하여 native 19Shape의 기존 효과를 삭제하거나 덮어쓰지 않는다.
- 단계/종료를 게임 안에서 알아볼 수 있는 minimum signal: 선/잠금 심볼, phase label HUD, 1회 progress cue. 사망·효과 역추적 로그로 이해 가능해야 함.
- 20초에서 성공 가능한 전술 조건임을 unit fixture뿐 아니라 포인터 자연 플레이에서 확인. 일부 Boss가 최소 5초 Spawn/Tier 대기 후에야 등장하면 시간 압박 조정이 필요.

## 5. Boss 전투 경험 예시

W3 Rift Engine: Run 시작 → Mirror/Gravity 조합이 Portal entrance 옆을 둘러쌈 → 직접 타격으로 main shard 발생 → main shard 반사/굴절·Portal 통과 → 다른 군집 Core 약점 해제 → core actual kill → 20초 종료 → world clear animation/World4 unlock.

- 'Portal 써야 함'이 곧 무작위 운빨이 되지 않도록 안전 위치와 true firstContact test, 예측 가능한 발동 힌트, fixture 아닌 실제 pointer Run 테스트.
- Player의 성장 능력 때문에 Core가 phase 해제 전 이미 압도적으로 터지는 경우도 false clear 금지: invulnerability/deferred damage policy를 원래 게임 source/ward semantics와 일관되게 명시.

## 6. World selection/보상/엔딩

- UI: Title/Result의 WORLDS pane에 현재와 과거 월드, 다음 해금 조건, Survey 2 objective, Boss READY/FAILED/CLEARED, 한눈에 이해 가능한 5-step map.
- 월드 선택 후 normal run 또는 Boss Challenge 모드 선택. 단기 Run 시작 버튼이 기존보다 여러 단계 깊어지지 않도록 현재 선택 월드의 Play와 Boss 버튼 분리, normal run 기본.
- 신규 campaign record: World I..V firstClearedAt, bestRunId, bossAttempts, bossFailures, challengeSourceId; replay 기록과 링크. 실패한 Boss 재도전 가능.
- W5 StormHeart 첫 클리어에서 Ending Sequence(짧고 스킵 가능) + campaignComplete=true. 플레이어 재화/스킬/별도 기록 삭제 X. After Clear: FREE PLAY / REPLAY / FUTURE CHALLENGES 안내.
- 기존 World1에서 49 SkillMAX면 모든 월드의 전투를 쉽게 할 수 있지만 '실제 Boss 파괴 이벤트'가 있어야 최초 클리어된다. 저레벨 계정의 World progression은 자연 성장 중 만나도록.

## 7. 저장/호환성

- storageKey shard-storm-v1, 현행 M11 schema8 또는 M12 추가한 다음 schema로 점진 migration. World 계정 필드가 생기면 다음 정수 schema로 올리고 schema1~이전 전부 읽기.
- 신규: worldUnlocked{worldId:bool}, worldSelected, worldSurveyProgress, worldBossHistory, campaignFirstClear, campaignEndingSeen. World 계정 변경/Unlock은 RESULT settlementId 단위 only-once.
- 기존 bank/100 levels/Signature/Evolution/Relic/Contract/Anomaly/Codex/Elite, M9intro/20 full LZ4 record, pending/lastSettlementId 보존.
- cross world 계약/Anomaly 기준은 기존 실제 combat action/normal kill만 기록, Boss '단계 성공'을 normal Contract kill로 중복 측정X. Codex shape-specific 실제 사망 조건에 부합하면 정상 집계.
- Sandbox forced-boss/survey progress UI는 실제 save의 world unlocked/clear state로 전파하지 않음.

## 8. QA/마일스톤 수락

- World5 ID/조건, survey ledger5, boss5 each phase and kill with positive + negative fixture, true 20sec real pointer play.
- Rank0 fresh W1 natural access & W2 locked, M11 old Rank4 migration (World1 unlocked, no fake boss clears), broken/pending saves preservation.
- Boss layout atomic·0overlap, Tier/Rank eligible parts, no premature kill, no out-of-order phase, end-of-run failure keeps base rewards.
- 5 seeds×3builds×World1..5×Boss/normal×20/32sec, Run startup/clear/fail/replay/save/reload, same seed deterministic game outcome.
- human test 5 World bosses feasible? timing/target readability, fastskip ending, fatigue; adjust only with evidence.
- browser 620/1280/1920, Focus+Reduced Motion, 5 Boss pointer fixtures plus fresh demo, console errors0.
- npm test + previous benchmarks and tests, add benchmark:m14, qa:m14.
- reports docs/Shard_Storm_M14_Implementation_Report.md / Balance_Report.md, artifacts/m14-world-boss-*, README, commit/push.

**M14 Done**: World5, Boss5 actual causal mechanics, entry/survey/first-clear/ending, migration, QA and repeatable failure handling. World progression should give players '내가 강해져서 새로운 대상을 부술 수 있다'는 의미를 제공. 사람의 3~4시간 플레이타임은 아직 검증 전.
