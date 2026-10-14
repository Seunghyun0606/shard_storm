# Shard Storm — M9 Shape Ecology 개발 PRD v1.0

- 작성: 2026-10-15
- 선행: M9.0 Done; origin/feat/m7-m8-relic-contract-anomaly의 7종 Shape/3 Modifier/19 Skill/6 Relic/10 Contract/6 Anomaly, schema5 전체 보존
- 코드 구현 대상: 신규 메커니즘 Shape 6종 + 배치 4종 + 2차 특성 Modifier 4종 + 생성·첫 발견 시스템 + 회귀/밸런스/브라우저 QA
- 후속: M10은 여기 추가되는 Shape를 조건으로 30스킬 구축, M11은 나머지 Shape 6·Modifier 4·Codex·Elite 도입.
- 추가 후 Shape 총 13종(7+6). Complex cosmetic/unique sound/정식 재질은 TODO. 독립 Sector/Stage/타이머 리셋은 계속 금지.

## 0. 콘텐츠 확장 설계 원칙

1. Shape는 생김새가 아닌 **공격 순서·조준/파편 경로·파괴 이후 반응** 중 적어도 하나를 실제로 바꿔야 한다.
2. M8의 Native events(직접 attack, timed effects, inherited wave, primary shard)를 재사용. 새로운 죽음/출생/전달은 각각 고유 ID+원인(cause)으로 1회 기록.
3. M8 OFF+Normal 무장없이 신규 생태계 OFF이면 기존 5seed 전투 kills/Raw/Contract/Anomaly/Refinery checksum 동일.
4. 기존 spawnInterval=.20, spawnBatch=3, 일곱 도형과 원래 special rank/tier/cap/ore probability는 임의로 건드리지 않음. 새 Shape 등장 확률은 별도 content stream.
5. 20초 Run에서 실제로 보이는 것이 중요. 해금 후 eligible 3 Run 이내 **소개용 1회 안전 등장**을 deterministic하게 예약하되 기존 tutorial/특수 cap/충돌 안전 규칙 우회 금지.
6. 단일 Shape의 비밀 재귀와 chain 폭발로 매 Run의 소득/계약을 무한 생성하지 않음. 분열 child와 전도 이벤트에는 별도 누적 cap.

## 1. 1차 신규 Shape 6종 고정 명세 (초기 밸런스 실험 수치)

| key | 이름 | Rank, Run Tier | HP/BonusRaw/반경 | 적격 스폰 chance/동시 cap | 파괴/피해 시 행동 |
|---|---|---|---|---|---|
| splitter | Splitter | Rank0/Tier1(15킬) | 5 / 13 / 23px | 4% / 3 | 사망 시 작은 Echo2개가 0.06초 뒤 안전 위치에 생성 |
| fuseBomb | Fuse Bomb | Rank0/Tier1 | 6 / 15 / 24px | 3% / 3 | 첫 실제 피해 시0.70초 fuse; 생존 시간 만료 시 반경100px/피해2; 죽으면 0.08초 뒤1회 동일 폭발 |
| conductor | Conductor | Rank1/Tier2(45킬) | 6 / 18 / 25px | 2.5% / 3 | 사망 시 연결된 최대2대상(거리≤115px)에 .04초 뒤 피해2 전기 전달 |
| mirror | Mirror | Rank2/Tier2 | 8 / 26 / 25px | 2% / 2 | 주 파편만 최대2회 반사: 입사 진행각을 최대70° 굴절하여 가장 가까운 적격 대상 방향 전환 |
| gravityWell | Gravity Well | Rank2/Tier3(100킬) | 10 / 32 / 29px | 1.8% / 2 | 생존 동안 거리≤145px의 주 파편 진행 방향을 틱당 최대6°, 누적 최대30° 굴절 |
| repairNode | Repair Node | Rank3/Tier3 | 9 / 30 / 26px | 1.5% / 2 | 0.85초마다 주변 105px의 손상된 일반 도형 최대2개를 HP1씩 복원(대상별 Run 총2HP 이하) |

- base HP·Raw bonus는 계정 성장/Modifier와 원래 방식대로 합성. 새 shape는 기존 oreGrade 롤 자격. 특별히 명시한 Echo child는 예외.
- chance는 해당 Rank+Run Tier 이후 spawner 시도에서 다른 특수 도형과 병행되는 **별도 독립 추첨**. M8 특수 3종의 기회는 유지하되 종별 cap·총 신규 특수 cap(권장 전체 새 Shape alive≤7)을 지킨다. 총합 과도하면 먼저 스폰 디렉터가 종류별 cooldown 적용하되 이유를 로그에 기록.
- 샘플 숫자는 최초 구현 기준이며 실험 결과에 따른 권고 조정은 별도 프로파일/보고서에서 비교한다. 무단 변경으로 테스트 통과를 꾸미지 말 것.

### 1.1 Splitter + Echo child 원자 규칙

- splitter 파괴는 보상/계약/킬 1회, kill source에 귀속. 0.06초 후 두 child를 생성하되 일반 spawn 안전 간격과 arena bounds 준수. 실패 child는 조용히 포기; 강제 겹침/중복 ID 금지.
- Echo child: HP1/반경16/Native Raw bonus0, oreGrade common, catalyst0, Relic blueprint 조건·Codex 일반 Shape 발견·영구 Lifetime Destroyed 카운트에는 **포함하지 않음**. 단 이번 Run의 연쇄 체인에서는 파괴 가능한 실제 대상이며 체인 콤보 증가를 허용.
- Echo child는 다른 Echo를 만들지 않음. Splitter당2, Run당 Echo 생성 cap20, live Echo cap6; 사이드이펙트 재귀 및 중복 생성X.
- 새 보상/Contract의 실제 일반 Shape kill 카운터와 전체 화면 파괴 수치를 분리 계측. Game.totalDestroyed가 Run Tier에도 사용되므로 Echo는 별도의 tempKill/chainKill로 처리해 Rank·기존 계약·Run Tier의 farm을 일으키지 않도록 한다. 바꾸기 어려운 카운터는 최소한 기존 일반 카운터에 child가 혼입되지 않음을 테스트.
- Echo 파괴도 공격 피해 HP만 rawBase에 최대1을 더할 수 있으나 native bonus, Ore, Catalyst, 불필요한 계약·업적 보너스 금지; total Raw from Echo ≤20/Run. 불가하면 0Raw 정책을 선택하고 보상 로그에 표기.

### 1.2 Fuse Bomb

- 첫 **양수 actualDamage**에서 하나의 fuseState=armed 상태로 전이, expiresAt=simulationTime+.70. 0 데미지/ward 무효 피해는 발동X.
- 그 전에 죽으면 기존 예약 취소 대신 사망 후.08초에1회 조기 폭발(armed 여부 관계없음); 폭발이 이미 발생하면 더는 발동X.
- 폭발은 cause.source=fuse, radius100, damage2, 전체 연쇄 chainId/발동순서 보존. 죽음→폭발→다른 Fuse 점화의 연속은 가능하나 Fuse당 최대1회, 예약 이벤트/상한 준수.
- 게임 시간이 0으로 끝나면 예약 폭발은 피해/계약/보상 전부 미반영. 경고 ring은 시각용만.

### 1.3 Conductor

- spawn에서 연결 후보 nearest(max2, within115px, stable id tie-break), 렌더상 연결선 표시; 대상 사망·자연이동으로 끊어지는 경우 안전 갱신.
- 파괴 시 현재 살아 있고 범위 내 적격2개에 .04초 뒤 피해2, 각 targetId는 해당 Conductor 발동당1회. 생성 시 고른 target이 죽으면 전도 새 target 재추첨하지 않음.
- Chain당 Conductor transmission 최대4개(총 목적지가 아니라 전도 node 기준), source=conductor, depth 상한 그대로. 와이어 VFX는 cosmetic layer.

### 1.4 Mirror

- 특정 주 파편 충돌 순간(기존 collision event), 대상의 HP는 일반 규칙대로 피해. 파편 반사는 같은 projectile ID에서 속도 direction만 수정, 각 Mirror 고유 source hit 파편당 최대1회, Mirror당 Run최대2회.
- 다음 타깃은 현재 살아있는 non-self nearest; 없으면 기본 벽 반사/종료 fallback. 주 파편 원래 bounce budget/Relic Ricochet Coil과 합성하되 cap/shard lifetime 위반 금지.
- M10 Mirror Return 등과 합성하도록 cause.marker(reflectionKind) 제공. FX-only 거울 빛줄기는 TODO.

### 1.5 Gravity Well

- 물리 파편 trace와 연속 충돌(기존 motion.js firstContact)과 일치하게 곡선 경로를 짧은 segment로 근사. 세그먼트별 conservative collision 근거 기록.
- 살아있는 Gravity 최대2개 합성: 가장 가까운 것 하나만 적용. main shard 전용이며 auxiliary/파동 미적용.
- <=145px에서 tick당 회전 최대6°, 1개 파편당 합계30°. 파편 travel length/life는 기존 경로 예산 초과하지 않음.
- OFF와 ON에서 첫 접촉 차이는 의도된 회전 때문임을 로그로 기록. 잘못된 ghost hit/target pass-through 0.

### 1.6 Repair Node

- 타겟: 살아 있는 non-special normal base shape, hp<maxHP, within105px. 최근 손상 많이 된2개 대상 우선(HP ratio asc, id tie-break).
- 0.85초 타이머, target당 **한 Run 최대2 HP 치유**, 치유로 maxHP 초과 금지. Repair 죽으면 치유 정지.
- 치유된 HP의 이후 실제 피해를 Raw로 반영하더라도 Run/target cap2 때문에 farming 제한. Royal rare ore bonus는 죽음당 여전히1회.
- 치유/피해 시점을 게임 시간으로 계산, tab-hidden pause에서 추가 치유 없음.

## 2. 신규 Modifier 4종 (2차 성질/Secondary Trait)

기존 Cracked/Charged/Enhanced의 RNG·배타 규칙은 보존하고 신규 성질은 별도 trait 슬롯에서 독립 추첨한다. **한 도형에는 신규 secondary trait 최대1개**; M11의 후속4종과 합쳐 총8종 중1개만. 기존 primary와 겹칠 때 금지 조합 표를 적용.

| ID | 대상·확률(초기) | 실제 기능 | 안전 제한 |
|---|---|---|---|
| reinforced | Rank1+, 적격 spawn 2.5% | 최초 유효 양수 피해1 감소(최소0), 장갑 아이콘 사라짐 | 1회만; Hex 최초장갑·Enhanced와 중첩 금지 |
| volatile | Rank1+, 2.5% | 사망 .05초 후 반경70px/피해1 파동 | 파동/보조 child가 volatile을 재유발할 수는 있지만 원 Shape 사망당1회; FuseBomb에는 금지 |
| reflective | Rank2+, 1.5% | 최초 main shard 적중 시 입사각15° 반사 | Mirror/charged shield와의 중복 제외, 동일 파편 재반사 cap |
| hollow | Rank2+, 1.5% | 직접 damage -1(최소1), main shard damage +1 | 아머와 섞지 않음, base HP 동일 |

- 안전한 적격 확률의 합은 기본8%, Rank별 subset만 적용; 기존 ore/special streams와 분리. 기존 M8 Modifier ON/OFF 의미를 깨지 말고 v2 secondTraits Enabled 전용 dev toggle 제공.
- 경계 피격·0데미지·순서·재귀·소스 카운터/overlay 아이콘을 정확히 구현. 사용자 구분을 색상 하나에 의존하지 말 것.

## 3. 배치 패턴 4종

| 패턴 | 구성/조건 | 기대 조준 선택 | 제한 |
|---|---|---|---|
| Ring Formation | 6개 이하 일반 도형을 핵심 특수 도형 주변 75~115px 링 | 가운데 먼저 vs 주변 먼저 | 핵심 타깃 좌표·안전 gap·arena bounds |
| Chain Corridor | 4~6개를 50~70px 간격의 방향성 배열 | 파편 시작 방향 최적화 | existing pattern/collision safe fallback |
| Shield Fortress | Hex와 Ward 대상/일반 도형을 둘러싼3~5개 밀집 | Hex 해제 후 연쇄 | Hex rank/tier 조건 충족시만 |
| Bomb Garden | Fuse1~2+ordinary 3~4 가까운 군집 | 폭발 지연·순서 선택 | Fuse cap, 0.7s timer, 겹침X |

- 기존 cluster/arc/bridge/shield pocket/tether와 공동 pattern scheduler. 추천 초기 eligible distribution: 기존 배치80% / 신규 배치20%(4종 각5% 단, 자격 불충분하면 정상 fallback). 스폰 소모 예산 초과하면 다음 tick 예약, 무한 queue X.
- 신규 도형 첫 소개 Run은 해당 도형의 mechanics를 이해하기 쉬운 pattern 우선. Visual warning/intro tag는 HUD 비차단 1회.

## 4. 등장 시스템 개편

- ShapeDirector(version1) 선언형: rank, runTier, activeCap, runCap(optional), spawnChance, introPriority, cooldownSeconds, compatibleTraits, formationTags.
- 각 shape unlock 이후 적격 spawn 발생하는 첫3개의 **정상 정산 Run** 안에 최소1회 안전 Spawn 시도. 불가능(도형 공간 부족, Run Tier 미도달)이면 다음 적격 Run으로 carry, 강제소환/무적/중복처리 금지. 해금 플래그는 실제 등장 후 정산에서 1회 consumed.
- 빈 화면 시간/타입 분포/주요 이펙트 발동 수 기록. 소개용 우선 등장 때문에 Ore/Anomaly/Contract 카운터 중복 지급 없음.
- 고레벨 생성량 병목 연구: 기존 기본 .20×3 유지, **격리 실험 프리셋만** adaptive .18×3 (Rank2+Tier3), .16×3 (Rank4+Tier5) 비교. M9 사용 기본값 변경은 실제 포인터 QA 결과와 5seed balance 근거 없이는 금지. 결과 보고에서 후보 채택/보류를 결정.
- Spawn weights/intro flags는 gameplay RNG stream과 독립. 새 feature OFF에서 M8 deterministic parity. feature ON과 OFF가 같은 RNG 소비를 할 필요는 없지만 cosmetic은 영향0.

## 5. 경제·난도·가시성

- 기존 C.refinery .06, 19 skill, Relic6, Contracts10, Anomaly6, 20~32초, M8 schema5 베이스 보존.
- 추후 M10 30 skill이 바로 경제를 소모할 근거를 만들지만 M9에서 Photon 지급률을 올리지 않음.
- NEW target interaction > 숫자 HP 증가; 조준 대상 변화와 chain rate를 지표로 기록.
- 매 Run 새 shape 등장·파괴수, 타입당 발생 횟수, 경고/타깃 우선순위, on-kill proc 수, average blank duration, cap reasons, 1/3/5/10/20/30/50Run newly discovered count 보고.
- 자동 완전조준 정책은 사람의 식별·난이도를 대표하지 않음을 보고서에 명시.
- 소개 특수 도형이 투명 스폰/줄 긋기 미완성 상태에서 명중한 것처럼 보이지 않게 M9.0 Fade-in과 맞춤.

## 6. 세이브 schema6 및 정산

- storageKey shard-storm-v1 유지, saveVersion5→6, v1/2/3/4/5 정상 읽기.
- 신규 shape introSeen/queued, run 형태별 discover log, 새 계약 카운터가 필요한 경우 optional 기록. **M9는 Codex·Research 구매/보상 자체는 추가하지 않음**; 그 단계는 M11에서.
- 기존 bank, Catalyst, 19 levels, 6 Relic, Contract progress/medals, Anomaly selectedOffer/offerIndex, 기존 pendingSettlement, Rank·lifetime·record 완전 보존.
- 소개 마일스톤 완료는 실제 정산에서만 반영. replay/skip/refresh/new Run으로 중복 unlock/bonus 발생X.
- Fresh Lab/forced Shape/디버그 지급으로 live intro completion을 조작하지 못하게 격리.
- M9에 새 shape를 포함하는 현존 M8 계약은 **해당 정의의 source 조건에 부합할 때만** 카운트(예: direct kill yes, nativeSquareWave no).

## 7. 개발 구조·단계

- config.js 또는 ecology-defs.js: 6 shape / 4 trait / 4 formation declarative config, featureFlags.
- ecology.js: allowed spawn, intro state, capped schedules, deterministic fallback.
- content.js: special discovery/ward/conductor/repaired target event 연동.
- entities.js, game.js, motion.js, effects.js: 기존 이벤트 큐/충돌/파편 refraction, death/onHit/regen hooks.
- visuals.js, renderer.js: 각 Shape 완성 라인 외형+아이콘, 통일된 outline/spawn, pointer world hit 일치.
- storage.js/progression.js: schema6/milestone settle/idempotency.
- tests/m9-*.test.js, tests/m9-balance.js, tests/m9-browser.mjs; README, docs/Shard_Storm_M9_Implementation_Report.md, docs/Shard_Storm_M9_Balance_Report.md.
- STEP1 M8 baseline capture → STEP2 shape definitions+1 spawn → STEP3 shape 6종 실제 인과효과 → STEP4 formations+traits → STEP5 intro+save → STEP6 pointer QA & benchmark → report/commit/push.

## 8. 필수 QA / 완료 정의

- Unit: 각 6 shape 출생·피해·죽음·도형 ID/특수 이벤트1회·시간 종료. Echo 20/Run cap, 0보너스, 0ore/0Catalyst, 기존 Tier/Lifetime/Contract 카운터 분리.
- Shape paired effects: Fuse→Conductor→Square, Splitter Echo→Reactor(보조 분열 없음), Mirror+RicochetCoil, Gravity trace firstContact, RepairNode+Cracked/Enhanced/Hollow, ward/trigger collisions.
- Trait4의 1회 방어/폭발/반사/직접반감, 호환 조합, spawn total chance, M8 primary Modifier precedence.
- 4 formations: 실제 안전 좌표, 충분한 공간 없으면 정상 폴백, 저사양·좁은 logical arena/Rank미충족시 강제생성 없음.
- 스폰 디렉터의 seed determinism, 소개3 Run(적격 Run만 세기), 스폰 비어있음, same seed comparison.
- 5 seeds × Crusher/Cascade/Reactor × 20/32s × feature ON/OFF × >=30Run, Rank0/Rank4/legacy M8 프로필. Rank4 50Run 이상 추가 보고. Baseline core loop OFF 완전 패리티.
- Browser 20초 Normal, Rank1, Rank2, Rank3 4개 이상 실제 pointer Run + 특수 조합 fixture와 620/1440 CSS 표시. 보너스/신규 Shape가 UI 위에 그려지지 않음.
- 기존 npm test/benchmark/benchmark:m5-m6/benchmark:m7-m8/qa:m7-m8, 새 npm run benchmark:m9/qa:m9.
- 명세에 없는 물리 규칙 충돌·예외는 테스트로 근거를 남겨 수정. 회귀 골든을 무작정 업데이트하여 실패 은폐 금지.

**M9 Done**: 13종 Shape(기존7+신규6), 신규 Trait4, 신규 formation4, intro director, schema6, 보고서+QA. 모든 신규 도형이 정상적인 20초 플레이에서 서로 다른 클릭 판단을 유도하는 발동 로그가 필요. M10/M11 기능 선구현·미완료 표시는 금지.
