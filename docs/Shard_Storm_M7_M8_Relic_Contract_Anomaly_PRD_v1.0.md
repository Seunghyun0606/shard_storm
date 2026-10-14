# Shard Storm — M7·M8 통합 개발 상세 기획서 v1.0

- 작성: 2026-10-14
- 문서 성격: Codex 직접 구현용 확정 초기 명세, 자동 QA 및 사람 검증 계획
- 저장소: https://github.com/Seunghyun0606/shard_storm
- 코드 기준: origin/feat/m5-m6-progression (개발 시작 전에 fetch하고 최신 HEAD 재확인)
- 문서 기준: docs/m7-m8-relic-contract-anomaly (M6 완료 코드를 바탕으로 작성)
- 구현 권장 브랜치: feat/m7-m8-relic-contract-anomaly (위 문서 브랜치에서 생성)
- 범위: M7 Relic 6종/2슬롯/설계도/제작/교체 + M8 Contract 10종/3슬롯 + Anomaly 6종/선택/결과 + 100~300 Run 계측과 통합 QA
- 범위 제외: M9 Mastery 전용 계층, Prestige/Ascension, Relic 랜덤 가챠, 현금 결제, 서버·멀티플레이, 새로운 Sector/Round 화면, 게임 엔진 교체

## 0. 원칙과 기존 코드 기준선

### 0.1 확인된 M5·M6 구현

- 기본 Run 20초; Extra Time Lv당 +2초, 최대 32초.
- HTML5 Canvas 2D + Vanilla JavaScript ES Modules; 기존 조작은 직접 클릭, 홀드, 드래그.
- Triangle, Square, Pentagon, Star + Hex Shield, Reactor Node, Ancient Core = 7종. Cracked/Charged/Enhanced, 저속 회전/드리프트, 단계별 효과와 최초 접촉 충돌.
- Raw Shards -> 10토큰/5슬롯 Refinery(기본 rate .06) -> Photon 정산. Catalyst도 Run 종료 시 정산.
- Discovery Rank0~4(정산 누적 파괴 0/300/1200/3500/8000), 기존 스킬 19개, 총 50레벨.
- 세이브 키 shard-storm-v1, 현행 schema4; pendingSettlement/lastSettlementId로 정산 1회 지급. 레거시 schema1~3 읽기, 기존 총량 분리.
- Fresh Lab과 모든 실험/디버그 지급은 실제 세이브와 격리.
- M6 보고 테스트 118 PASS, browser pointer QA, benchmark:m5-m6 1573 Run 완료. 이 숫자는 **과거 보고**이며 M7·M8 구현 후 최신 실행값을 재확인해야 한다.

근거:
- docs/Shard_Storm_M5_M6_Implementation_Report.md
- docs/Shard_Storm_M5_M6_Balance_Report.md
- config.js / progression.js / storage.js / content.js / ore.js / refinery.js / game.js

### 0.2 M7·M8의 문제 정의

M6 자동 입력 5시드×3빌드에서 최초 모든 50레벨 MAX 시점의 중앙값은 Crusher 40 Run, Cascade 44 Run, Reactor 39 Run이다. Rank4는 약 29 Run이고 후반 Catalyst 잉여가 크다. 50×20초는 기본 전투만 16분40초이므로, 숫자 강화만 늘려도 3~4시간 플레이를 보장하지 못한다.

**M7 목표**: 제한된 2개 Relic 장착을 통해 동일한 스킬 MAX 상태에서 공격·연쇄·표적 선택이 달라지게 한다. Catalyst의 의미 있는 소비처를 만든다.
**M8 목표**: 매 Run에서 플레이어가 Contract 목표와 선택 가능한 Anomaly 위험/보상을 스스로 고르게 만든다. 리롤·중복 지급·결과 조작을 방지한다.
**통합 목표**: 5/20/50/100/200/300 Run까지 행동·보상·목표 소진을 측정하며 사람 플레이가 재미를 느끼는지는 별도 검증한다.

### 0.3 절대 불변 조건

1. 기본 Run 20초. Extra Time 레벨/시간/가격은 기존대로 유지.
2. 도형 직접 선택/클릭/홀드/드래그, 실제 움직이는 도형과 동적 히트 판정 유지.
3. 연쇄 효과는 동일 게임 시간축에서 순차로 발동; 즉시 전역 피해 또는 원인 없는 자동 공격 금지.
4. 신규 도형은 현재 화면 안의 기존 도형 사이에만 혼합 등장; Sector/Round 화면, 타이머 리셋, 도형 전멸 요구 금지.
5. 스킬 19개·50레벨, 기존 Photon/Catalyst, 구매 내역, Rank, lifetime 카운터 보존. 기존 광석/변종 생성률 기본값 보존.
6. 동일 조건·시드·의사결정이면 결정적 결과. 외형 RNG와 실제 전투·보상 RNG 분리.
7. 장착/Contract 활성화/Anomaly 선택은 Run 시작 전 또는 RESULT에서만 허용. Run 중 선택 변경으로 이익 창출 금지.
8. 0초 이후 추가 파괴/Raw/Photon/Catalyst/Contract 진척/Relic 업적 증가 금지.
9. 장식 표현만 바꿀 때 전투/경제는 완전 동일해야 함. 사운드 OFF, VFX OFF도 보상에 영향 금지.
10. 스킬·파편·파동 이벤트 상한을 무단 상향하지 않음. 추가 능력은 원인·횟수 제한으로 안정성 유지.
11. 보상은 **정산에 성공한 Run**에서만 영구 기록. pending/refresh/Skip/Back/Replay는 전부 멱등.
12. 새 피처 OFF 격리 실험은 기존 저장에 절대 영향 주지 않음.

## 1. 플레이 루프와 화면 동선

새 루프:
RESULT(영구 스킬 + Relic Loadout + Contracts + Next Run Anomaly)
 -> START RUN(선택값 스냅샷 고정)
 -> PLAYING(기존 20초 파괴, Relic 효과, Contract 계측, Anomaly 규칙)
 -> RUN END(Refinery 확정 + Contract/Anomaly 성패 계산)
 -> RESULT(Refinery/추가 보상 합산 1회 확정, 성취 상태 표시, 장착·선택·재도전)

- 초기 START 화면에도 작은 **Loadout / Contracts / Next Run** 섹션을 제공. 실제 플레이 화면에는 불필요한 팝업 금지.
- RESULT에서 기존 Refinery와 19노드 트리, Play Again 버튼을 보존하고 새로운 3개 섹션은 접기 가능. 별도 필수 대기 화면을 추가하지 않는다.
- 정상 Run(Anomaly 미선택)과 2 Relic 미장착이 가능해야 함. 기존 이용자가 기존 Run을 계속 즐길 수 있어야 한다.
- Refinery 애니메이션 최대 기존 1.2초, Skip과 Play Again은 확정 정산과 같은 결과를 생성한다.
- Contract 진행 현황은 HUD에서 활성 3개 중 하나만 짧게 보이거나 사용자가 펼쳐 보는 방식. 클릭 목표를 가리지 않는다.
- 화면 한쪽의 Anomaly 이름/위험 표식은 작게 표시하고 도형이나 직접 클릭 히트영역을 가리지 않는다.

## 2. M7 Relic 시스템

### 2.1 공통 규칙

- Relic 총 6종, 고정 ID, 영구 소유는 중복 불가. 2개 장착 슬롯은 초기부터 존재하며 비어 있을 수 있음.
- 구매 방식: **설계도 해금(업적+최소 Rank) -> Photon/Catalyst 지불 -> 영구 제작 -> 0~2개 장착**. 랜덤 드롭/유료 가챠 아님.
- Relic은 소비형이 아니며 분해/판매/강화/랜덤 옵션/품질 등급을 이번 범위에 넣지 않는다.
- 장착/해제/교체는 Run이 없거나 결과 정산 후에서만 허용. 최초 Run 생성자의 relicLoadout을 frozen snapshot으로 전달하고 종료까지 고정.
- 같은 ID 2중 장착 금지. 미소유 장착 금지. 저장 로딩 시 알 수 없는 ID·중복은 안전하게 무시(저장 전체 폐기 금지).
- 효과 수치는 초기 프리셋으로 설정 파일에 선언하고 하드코딩 분산 금지. 툴팁에 실제 파생 수치/Trade-off를 표시.
- **기본 룰 대비 독립 실험 가능**: noRelic / eachSingleRelic / 2-Relic pair. 사람 선택이 단순 피해 +%보다 달라지는지 측정.
- Catalyst 재화는 기존 catalystBalance 사용; Relic 별도의 유료 재화/가루는 추가하지 않는다.

### 2.2 Relic 6종 전체 명세

| ID | 이름 | 최소 Rank | 영구 설계도 획득 조건(M7 이후 누적 실제 정산) | 제작 비용(Photon/Catalyst) | 장착 중 효과 | 기회비용 |
|---|---|---:|---|---:|---|---|
| ricochetCoil | Ricochet Coil | 1 | 주 파편의 실제 벽 반사 30회 | 250 / 4 | 주 파편의 최대 반사 수 +1 | 주 파편 사거리 -40px, 최소120px |
| waveCondenser | Wave Condenser | 1 | Square/Star 고유 파동으로 완전 파괴 50개 | 360 / 6 | Square/Star 고유 파동 피해 +1 | 해당 파동 최대 반경 ×0.85, 정수 반올림 |
| cracklingEdge | Crackling Edge | 1 | Cracked 직접 최종 파괴 30개 | 420 / 10 | 해당 Cracked 직접 최종타 직후 0.03초에 반경55px/피해1 보조 파동 1개 | 기본 직접 피해 -1, 최소1 |
| hexSiphon | Hex Siphon | 2 | Hex 사망으로 Ward 연결 실제 해제 25개 | 700 / 16 | Hex 사망으로 Ward 1개 이상 해제 시 충전+1(최대2), 다음 성공 직접 타격에 추가 피해+1 소비 | 충전 4초 만료, Run당 소비 최대6회 |
| reactorGovernor | Reactor Governor | 3 | Reactor의 HP 임계 파동 실제 발동 40회 | 900 / 18 | Reactor 두 단계 파동 피해 +1 | 각 발동 지연 +0.08초(기존 0.03→0.11, 0.11→0.19) |
| ancientResonator | Ancient Resonator | 4 | Ancient Core 완전 파괴 4개 | 1600 / 32 | Ancient 75/50/25% 각 단계 효과에 보조 파편 1개 추가(피해1/사거리75px) | Ancient 외 도형에는 직접 효과 없음(슬롯 점유) |

정확한 세부 규칙:
- 주 파편은 기존 Triangle/Pentagon의 기본 주요 파편이며 소형 분열, Relay, Precision, Channel 보조 파편에는 Coil 효과를 적용하지 않음. 사거리 감소 후 비행 생명 주기와 접촉 시점 재계산. +1 bounce는 기존 물리/상한과 합성.
- Wave Condenser는 기존 Square/Star **고유** 파동에만 적용. Impact Pulse, Reactor, Ancient, Ward Release, Resonance에는 미적용. 반경 감소와 피해 증가를 동일 파동에 적용; 이미 종료된 파동 재설정 금지.
- Crackling Edge는 **직접 최종타** 원인만 인정하고, 생존 중 반복 타격이나 보조 파편 사망 재귀에는 발동하지 않음. Precision Fracture와 함께 장착/구매한 경우 두 효과의 독립 1회 발동을 허용하되 추가 파동은 Relic으로 자신을 재발동하지 않음. 재귀 금지 메타데이터 설정.
- Hex Siphon 충전은 실제 Ward 해제 대상 존재 시 Hex당 1회만 지급, 단순 보호막 실패/생성/만료는 제외. 충전 시점부터 게임 시간 4초 후 만료. 0초 이후 사용 불가. 소비는 성공적으로 대상이 피격될 때만; 빈 공간 클릭은 소비하지 않음. 최대6회/Run.
- Reactor Governor는 기존 임계 HP 6/0, 발동 딜레이만 수정. 동일 피해가 여러 임계점을 통과해도 기존 단계당 1회. 시간 종료 후 예약된 효과는 실행하지 않음.
- Ancient Resonator의 추가 보조 파편은 기본 단계 파편 발사와 동시, 원인 체인 계승, 재분열/반사/추가 Relic 발동 금지. 기존 active shard150/chain event400/depth10 상한 준수.
- 모든 Relic이 보너스 소유 효과로 죽음을 일으키면 피해 출처는 정확하게 cause metadata에 기록. 직접 타격 보조 파동으로 죽은 대상은 direct kill이 아니라 cascade kill.
- Relic 및 스킬의 효과 조합에서 최소 피해 1, 거리/지연/반사 음수 금지. 순서 고정: base stats -> Skill -> Relic snapshot -> Anomaly Run modifiers; 개별 원인 태그는 보존.

### 2.3 설계도 진행과 제작

- Rank와 업적 조건은 **둘 다** 충족해야 blueprintUnlocked=true. 업적 카운터는 이 기능이 도입된 후 **실제 정산된 Run**만 누적(구 M6 마지막20 Run 합산 금지).
- 업적 카운터 타입: mainShardWallBounces, nativeWaveKills, directCrackedKills, wardReleasesFromHexDeath, reactorStageWaveExecuted, ancientKills.
- 해당 Relic 장착 전에도 업적은 기록. 예: 반사 횟수 업적은 기존 주 파편으로 달성 가능해야 함.
- 이미 Rank4·MAX 스킬인 기존 계정은 새 업적을 0부터 진행하지만 Rank/Photon/Catalyst는 보존. 기존 플레이 내역을 임의 추정해 즉시 전 Relic 해금하면 안 됨.
- 업적 진행도와 Rank·제작비를 항상 볼 수 있다. 최초 설계도 조건 달성 시 RESULT에 한 번만 비차단 배너 표시.
- 제작 시 state=RESULT, settlement 완료, blueprint unlocked, 재화 충분, 미제작, 알려진 ID를 동시에 확인. Photon/Catalyst 동시 감소, 소유 목록 동시 갱신 후 단일 persist. 실패면 전부 불변.
- Relic 보유/장착/업적과 사용 여부는 save schema5 필드. 다시 불러오기 후 동일.

### 2.4 M7 실험 세트

- 기본 무장 vs 각 6개 단독 vs 2개 조합(대표 5쌍 이상) × 동일 시드 [31415,1,7,42,99], 고정20초, 동일 타깃 정책.
- 분석: 직접/연쇄 파괴, 파동·파편 주인, 독립 Relic 발동 횟수, 특별 도형 파괴, Photon, Catalyst, capHit, 미사용 충전, Real elapsed.
- Relic 효과 OFF만으로 같은 초깃값·seed에서 소유·지급·재화가 달라지지 않는 격리 대조군과 효과 ON 비교.
- 기존 M6 스킬 및 물리 시뮬레이션 성능 기준선을 5시드로 새 측정하고 수치 비교. 무작정 공격력 증가만으로 모든 Relic을 강하게 만들지 않는다.

## 3. M8 Contract 시스템

### 3.1 기본 개념

- **Contract 10종, 동시 활성 최대 3개**, 총3단계(Ⅰ/Ⅱ/Ⅲ) 반복 가능. 일일 리셋, 기한, 외부 결제 없음.
- 목표는 Run 여러 번에 걸쳐 누적되며, 활성 여부와 단계는 Run 시작 시 스냅샷으로 고정. Run 중 등록/삭제는 불가.
- 각 Contract는 아래 테이블에 고정 ID, 최소 Discovery Rank, 누적 카운터 이름, Ⅰ단계 요구량, Ⅰ단계 기본 보상을 선언한다.
- 단계별 목표량 배율 = [1,2,4] × baseTarget, 정수. 보상 Photon 배율 = [1,1.5,2] × basePhoton(내림), Catalyst = [1,2,3] × baseCatalyst.
- Contract는 단계 완료가 자동으로 **해당 정산에서 지급**되며, 이후 다음 단계는 다시 수락해야 활성화. Ⅲ완료 후 명예 배지 1개 기록하고 보상 반복 지급은 없음.
- 완료한 슬롯은 자동 비활성화. 필요하면 RESULT에서 다른 Contract 또는 동일 ID의 다음 단계 활성화.
- 계약 포기: RESULT에서만 가능, 진행도 0으로 돌아감, 이미 지급된 보상·완료 단계에는 영향 없음. 재수락해도 임의 리롤 보너스 없음.
- 잠겨 있는 계약은 목록에서 해금 조건만 노출. 최대3개 넘게 선택하려 하면 기존 선택 보존.
- **정산 완료한 Run만 진척 증가**. 공격 중 데이터는 HUD 임시 예상치일 뿐, 저장 영구 수치는 pending 정산 완료 후 갱신.
- 같은 Run의 한 계약은 단계 하나까지만 완료, 초과 성과는 다음 단계로 이월하지 않음. 중복 조건 만족으로 같은 계약 보상 두 번 지급 금지.

### 3.2 Contract 10종 확정 초기 테이블

| ID | 이름 | Rank | 누적 카운터와 정확한 조건 | Ⅰ단계 목표 | Ⅰ단계 Photon | Ⅰ단계 Catalyst |
|---|---|---:|---|---:|---:|---:|
| preciseClicks | Precision Duty | 0 | 실제 직접 완전 파괴 수 | 80 | 75 | 0 |
| chainHunter | Chain Hunter | 0 | 별개 Chain에서 최고 10파괴 이상 최초 달성 횟수 | 5 | 100 | 0 |
| fragmentRoute | Fragment Route | 1 | Triangle/Pentagon **주 파편이 최종타**인 파괴 수(보조 파편 제외) | 90 | 130 | 0 |
| waveTactic | Wave Tactic | 1 | Square/Star **고유 파동이 최종타**인 파괴 수 | 80 | 120 | 0 |
| crackedCleanup | Crackdown | 1 | Cracked 도형 직접 최종 파괴 수 | 25 | 110 | 0 |
| hexLiberator | Hex Liberator | 2 | Hex 사망으로 실제 Ward 연결 해제된 서로 다른 도형 수 | 18 | 175 | 2 |
| coreCollector | Core Collector | 2 | 실제 Core oreGrade인 도형 완전 파괴 수 | 12 | 145 | 2 |
| reactorEngineer | Reactor Engineer | 3 | Reactor 체력 임계 파동이 전투 시간 안에 실행된 횟수 | 25 | 200 | 3 |
| anomalyPilot | Anomaly Pilot | 2 | 선택 Anomaly의 성공 판정이 true로 정산된 Run 수 | 4 | 180 | 2 |
| ancientHunter | Ancient Hunter | 4 | Ancient Core 완전 파괴 수 | 3 | 280 | 6 |

카운터 세부:
- 현재 Run의 확인된 실제 사건만 집계; 스폰/예약/렌더 이펙트는 달성하지 않음.
- 한 파괴는 최종 피해 출처에 따라 직접/주 파편/고유 파동 중 알맞은 분류에만 들어감. Relic 보조 파동은 Wave Tactic으로 분류하지 않음.
- Chain Hunter는 같은 체인에서 10→20→30을 달성해도 1회만 증가. 다른 Chain이면 각각 카운트.
- Reactor Engineer는 HP 임계점 통과만으로 미리 계산하지 않음; 예약 파동이 실제 실행되어야 카운트(시간 종료로 취소되면 0).
- Hex Liberator는 워드 대상 ID당 해제 1회. 신규 대상 연결 또는 0.25초 failsafe 이후 중복 집계 금지.
- Anomaly Pilot은 Anomaly 성공 중복 이벤트로 증가하지 않고 Run당 최대1회.
- 동일 사건이 Relic 설계도 업적과 Contract에 동시에 반영되는 것은 가능. 서로 다른 보상 지급이라고 해서 한 쪽 진척을 누락하면 안 됨.
- **랭크가 높아진 바로 그 Run에서 새 Contract를 소급 활성화하지 않는다.** 새 Rank가 확정된 후 다음 시작 전부터 선택 가능.

### 3.3 보상/경제 제어

- Contract 완료 Reward는 Refinery 결과에 **곱하지 않는다**. basePhoton, Catalyst 직접 가산으로 별도 표기.
- 해당 단계 Reward는 정해진 고정 지급만, 가중치 랜덤/추가 패키지/룰렛 없음.
- 세 단계 전체를 한 계정에서 딱 한 번씩 보상 획득. 초과 완료 불가. 즉시 MAX를 해결하려고 수익 상향하는 용도로 사용 금지.
- 실패한/포기한 계약은 진행도만 폐기. 보유 Photon/Catalyst는 압수하지 않는다.
- Result 요약에는 Refinery Photon / Contract Photon / Anomaly Photon / Catalyst를 구분하여 보여준다.

## 4. M8 Anomaly 시스템

### 4.1 선택 및 생성

- **6종 Anomaly**. START 또는 RESULT에서 **다음 Run 후보 3개 + Normal Run** 중 최대1개 선택. Rank0 등 자격 종류가 3개 미만이면 2개만 보여도 됨.
- 후보는 [id, 최소Rank] 선언형 테이블에서 현재 확정 Rank로 필터하고 **3개 중복 없는 선택**. 무작위 후보 생성에는 gameplay RNG와 독립된 seed stream을 사용.
- 후보는 Run 이전에 **offerId, eligibilityRank, offeredIds, seedKey**로 저장. Refresh/Back은 같은 후보 재노출하며 유리한 후보를 재추첨하지 않음.
- offerKey = 안정적인 조합(accountSessionId 또는 설치 고유 seed, save.totalRuns, 확정된 offerIndex). crypto UUID는 최초 설치 시 1회 발급 저장; 샌드박스는 별도 고정 seed. 암호학적 보안은 필요 없으나 저장 새로고침 악용을 허용하지 않음.
- 정상 Run 시작이 확정될 때에만 해당 offer를 소비. 선택 값을 Game 생성자에 불변 snapshot으로 전달하고 이미 저장한 offer는 바로 소비/다음 offer 준비. 의도적 Run 강제 중단은 다음 offer만 허용, 기존 Run의 정산/잔고 증가는 0.
- **동일 seed 실험 / 반복 실험은 메모리 샌드박스에서 별도 시퀀스**를 사용하며 live offerIndex/계정 상태를 갱신하지 않음.
- 유저에게 수치로 명시한 위험과 성공 조건/보상을 표시. Normal 선택 시 원래 생성률·전투·재화 규칙 그대로.

### 4.2 Anomaly 6종 확정 초기 테이블

| ID | 이름 | 최소 Rank | 다음 Run의 고정 패널티/변화 | 성공 조건(해당 Run만) | 성공 Photon 보너스 |
|---|---|---:|---|---|---|
| fastOrbit | Fast Orbit | 0 | 원래 드리프트·회전 속도 ×1.5(현재 모션 구성 상한 유지), 시각 회전도 동기화 | 서로 다른 움직이는 도형 직접 완전 파괴 12개 | refineryPayout의 10% |
| denseField | Dense Field | 0 | 현재 Tier target alive ×1.20(최대32), 원래 spawn clock/물리 cap은 그대로 | 서로 다른 체인 중 Chain15 이상 한 번 | refineryPayout의 8% |
| fragileMatter | Fragile Matter | 1 | 비-Enhanced eligible spawn의 Cracked chance +8%p(Charged는 기존 우선순위/상한 보존) | Cracked를 직접 6개 완전 파괴 | refineryPayout의 10% |
| overcharge | Overcharge | 1 | Charged 적격 확률 ×1.75(상한2 유지), Rank3 이상 Reactor 등장률 ×1.5 | Charged 또는 Reactor 3개 완전 파괴 | refineryPayout의 11% |
| fortified | Fortified | 2 | Hex 등장 확률 +4%p(기존 동시/Run cap), Ward 피해 감소 1→2 | Hex 사망으로 Ward 해제 2개 | refineryPayout의 12% |
| unstableCore | Unstable Core | 3 | Reactor 등장 확률 ×1.5, Rank4 이상 Ancient 확률 ×3(기존 cap/Run cap 유지) | Reactor 임계 파동 실제 실행 3회 또는 Ancient 완전 파괴1개 | refineryPayout의 15% |

공통 수학/충돌 원칙:
- 성공 보상 = min(60, floor(refineryPayout × 표 배율)). 최소 0. 실패 보너스0. **Refinery 슬롯 재추첨이나 수익의 전투 중 선지급 금지**.
- 성공에 필요한 사건은 정상 Run의 실제 완료 이벤트 기준; 임계값 미달·Run 종료는 성공 아님.
- Anomaly는 해당 Run의 Game-local 수정값을 사용하며 CONFIG·save.options·설치 기본값을 영구 변경하면 안 됨.
- 스폰 확률은 원래 기본 타입/Modifier/ore 스폰을 거치되 Anomaly의 선택적 overlay만 적용. 높은 확률 합산/상한 초과 방지; 확률은 [0,1] clamp하고 자격 rank/tier 먼저 검사.
- Fast Orbit: static 프로필도 존재하며 Static을 억지로 이동시키지 않음. Motion OFF 실험은 비교 정책을 분리 기록. motion physics/contact 현재 world pose 동기화 필수.
- Dense Field: spawnBatch·step·shard cap을 상향하지 않음; target alive만 증가. 원래 생성 자리 확보가 불가하면 안전 폴백; 강제 겹침 없음.
- Fortified: Ward 피해 감소 합성 시 실제 damage가 0이 될 수 있으나 원래 피해/HP 지불 규칙만 따르고 허위 파괴/보상 없음.
- Unstable Core: Ancient는 Rank4 + Run tier 문턱을 여전히 충족해야 등장 가능. Rank3에서 비활성인 Ancient를 강제 소환하지 않는다.
- 모든 수치/조건은 config.js 선언형으로 작성. Anomaly OFF 또는 Normal은 M6 기본 룰과 수익이 같도록 A/B 회귀.
- **UI 문구**: 성공 시 Photon 보너스, 실패 시 0, 위험 조건, 필요 Rank를 정확한 수치로 보여준다. 카지노식 미공개 확률·유료 리롤 금지.

### 4.3 후보 제공 UX 및 시뮬레이션

- 제공 Anomaly는 자격 중 최대3개이며 Normal은 항상 존재. 유저가 명시적으로 선택하지 않으면 기본 Normal로 시작.
- 설명/성공 조건의 툴팁/세부 설명은 클릭 1회 이내에 접근 가능. Game 시작 후 카드 선택 금지.
- 결과 화면: Selected Anomaly, Success/Fail, 조건 목표/실제 수, 추가 Photon을 독립 표시.
- 실험에서는 Same-Seed Normal / 6 Anomaly 별 개별 ON / Relic 조합으로 비교. RNG 분리로 옵션을 꺼도 무관한 도형 외형과 기존 도형 damage가 달라지지 않도록 처리(의도된 스폰/모션 변화는 로그에서 분리).
- Contract Anomaly Pilot은 **보너스가 0이어도** 조건 달성해 성공한 Run이면 1회 증가 (예: Refinery payout=0). 정산 성공과 성공 조건을 구분.

## 5. M7 + M8 통합 상호작용

### 5.1 순서와 스냅샷

1. RESULT에서 정산/강화/Relic 제작·장착/Contract 수락·포기/Anomaly 선택.
2. START 클릭 시 levels, relicLoadout, activeContracts stage+progress, selectedAnomaly, rank, seed, modifier version을 RunSnapshot으로 고정. 계약 선택/Relic 교체 UI 잠금.
3. 전투는 기존 이벤트 큐와 같은 시뮬레이션 시간축. Game은 runStats + causal event log에 사건만 기록.
4. 타이머 종료: Run record를 freeze. 배경 효과 중단. Refinery plan, Contract delta, relicAchievement delta, anomaly objective/result, Photon/Catalyst 성분을 **한 번 계산**.
5. pendingSettlement에 확정된 결과와 ID를 저장. 완료/Skip/Refresh/Back/Replay 어느 경로에서도 같은 snapshot을 적용하고 확정 ID가 같으면 재반영 금지.
6. 저장 완료 후 Next Rank/Blueprint/Contract 재도전/Anomaly offer를 다음 Run에만 적용.

### 5.2 사건 데이터 계약

권장 최소 이벤트 스키마:
- eventId, runId, simulationTime, chainId, sourceType, sourceShapeId, targetShapeId, targetType, targetModifier, targetOreGrade, direct, primaryShard, nativeWave, relicId?, anomalyId?, stageIndex?, eventType.
- 사건은 damage, kill, shardWallBounce, waveExecuted, wardReleased, stageWaveExecuted, chainThresholdCrossed, anomalyObjectiveUpdate 등 유의미한 타입만 기록.
- 체인 재귀·보조파편의 태그를 원래 cause로 잘못 통합하지 말고 명시적 분류 사용.
- 장식 파티클/팝업/빈 클릭으로 업적이나 Contract 증가 금지.
- 영구 업적 6종과 Contract 10종은 **실제 사건 스트림 또는 정확한 런 카운터**에서 일관되게 집계. UI와 시뮬레이션이 동일한 계산 함수를 사용.
- 메모리 상한을 위해 Run 중 전 사건을 무제한 저장하지 말고 필요한 상수 크기 per-run 집계 + QA 디버그 상세 log 제한을 구분.

### 5.3 강제 조합 검사

- Ricochet Coil + Kinetic Reach (distance/life/반사 합성).
- Wave Condenser + Chain Amplifier (피해+반경 상충, Square/Star native만).
- Crackling Edge + Precision Fracture (직접 최종타 조건 공유, 각각 독립 1회).
- Hex Siphon + Fortified (Ward를 우선 깨야 하는 선택의 가치).
- Reactor Governor + Resonance Layer + Overcharge (시간차 여진/연쇄 귀속).
- Ancient Resonator + Catalyst Channel + Unstable Core (Ancient 단계·표식·추가파편 상한).
- Relic 장착 중 새로운 Anomaly의 패널티를 성공 보상 없이 우회하는 exploit이 없는지 테스트.
- Contract 3개 동시 진행으로 같은 이벤트가 여러 목표에 기여하는 것은 허용하지만 동일 Contract 보상은 1회.

## 6. 경제/플레이 페이싱

### 6.1 확정되는 것과 가설을 구분

변경하지 않는 기본값:
- Raw→Photon rate 0.06, 기존 10토큰·5슬롯 분포, 기존 19스킬 및 ×1.6 성장, Catalyst 기본 Ore/Ancient 드롭.
- Rank thresholds 300/1200/3500/8000; 20~32초 시간 규칙, 7종 모양/원래 도형 스폰 cap.

이번 확정 초기값:
- Relic 6종, 2슬롯, 비용/업적 표.
- Contract 10종×최대3단계, 동시3개, 테이블의 목표/보상.
- Anomaly 6종, 0~3 후보 + Normal, 성공 배율·Run당 상한60.

검증 가설:
- **5 Run**: 다음 Relic 설계도 조건과 Contract를 이해하고 진척을 볼 수 있어야 한다. 첫 Relic 제작은 목표이지 강제 지급하지 않는다.
- **20 Run**: 최소1개 Relic 제작/장착 경로를 경험, 여러 Contract·Anomaly 성공 여부 선택이 의미 있어야 한다.
- **50 Run**: 기존 19스킬이 MAX여도 서로 다른 2 Relic 조합, 남은 Blueprint, Contract Ⅱ~Ⅲ 목표가 있어야 한다.
- **100 Run**: 서로 다른 Relic 로드아웃과 Anomaly 선택에 따라 목표/보상/파괴 분포가 달라야 한다.
- **200/300 Run**: 보상 전부가 소진되었는지 *정직하게* 측정. 모든 시스템이 이미 소진된다면 M9 설계를 위한 실패/개선 가설로 남기고 값 조작 금지.

### 6.2 300 Run 성장을 무리하게 숫자로 늘리지 말 것

- 50 Run 모두 MAX 문제를 **기존 19스킬 가격 인상, 광석 드롭 압수, 강제 Run 잠금**으로 감추지 않는다.
- Catalyst 잉여를 Relic 제작비로 사용하되 보유자가 반드시 쓸 이유가 있도록 실전 행동 변화/툴팁을 제공한다.
- Contract 전체 유효 지급 상한은 단계 보상 테이블로 고정; Anomaly 성공 보너스도 Run당60 cap.
- 비교 분석에서는 실제 Run 시간/정산 대기/UI 체류/다음 시작 지연까지 별개 로그. 300×20초는 기본 전투만100분이므로 3~4시간 플레이 성공으로 보고하지 않는다.
- 매판 무조건 Anomaly를 선택하도록 강제하면 선택성이 사라지므로 Normal 선택 비율도 중요한 성과 지표.

## 7. 저장 마이그레이션 및 정확히 1회 정산

### 7.1 schema5와 기존 저장 호환

기존 storageKey = shard-storm-v1 유지, saveVersion 4 -> 5. v1/v2/v3/v4를 안전하게 읽는다. 신규 필드는 없으면 다음 안전 초기값으로 추가:
- relicOwned: [] (고유 Relic ID 배열)
- relicEquipped: [] (길이0~2, 중복 없음)
- relicAchievements: {mainShardWallBounces:0,nativeWaveKills:0,directCrackedKills:0,wardReleasesFromHexDeath:0,reactorStageWaveExecuted:0,ancientKills:0}
- relicBlueprintUnlocked: [] (업적과 rank에서 파생하거나 중복방지 cache, 직접 수정해 모두 해금 불가)
- contracts: { active:[], records:{} } (각 ID stage=1, progress=0, maxCompletedStage=0, 상태)
- contractMedals: [] (Ⅲ 완료 ID만)
- anomalyOffer: null; anomalyOfferIndex:0; anomalySeed: 설치 최초 생성된 난수/seed 또는 기존 합리적인 안전 기본
- selectedAnomaly: null (Normal)
- totalAnomalyWins:0; lastM7M8SettlementId: null(필요한 경우만, 기존 lastSettlementId와 통합 우선)

절대 보존:
- bank, levels 19개, bestStats, lastRuns, options, catalystBalance, discoveryRank, lifetimeDestroyed, knownHistoryKills, totalRuns, milestoneWelcomeFlags, legacyExtraTimeLevel/timeRespecUsed, pendingSettlement, lastSettlementId.
- v4의 정산 대기 데이터는 기존 성공 판단 규칙대로 복구하고 **M7/M8 새 보상을 소급 지급하지 않는다**. 구버전 record에 새 필드 없음은 0/Normal/빈 업적으로 처리.
- 손상된 신규 필드는 해당 영역만 기본값으로 정규화, 정상 bank/levels와 무관한 필드 오류로 기존 진행 전체 초기화 금지.
- JSON 내보내기에 schema5 신규 필드 포함. import 기능을 새로 추가하지 않는 한 export만 유지.

### 7.2 원자적 pendingSettlement

기존 pendingSettlement에 다음 신규 optional 필드를 포함:
- relicAchievementDeltas, contractProgressDeltas, contractsCompleted[], contractPhoton, contractCatalyst
- anomalyId, anomalySucceeded, anomalyPhoton
- payoutBreakdown: {refineryPhoton,contractPhoton,anomalyPhoton,baseCatalyst,contractCatalyst}
- recordSnapshot: 기존 run.record() + relic/anomaly/contract configVersion과 최종 통계
- 고정 settlementId=runId 및 totalPayout = refineryPhoton+contractPhoton+anomalyPhoton

규칙:
- stage에서 숫자(모든 재화/진척/ID/구매)를 검증하여 snapshot 확정. **애니메이션이 끝난 뒤 재계산하지 않는다**.
- complete는 동일 ID의 확정 snapshot을 save에 한 번만 합산하고 lastSettlementId 갱신. 중복 complete는 false 반환 및 무변경.
- Javascript 단일 스레드 내 한 객체 갱신 + localStorage 단일 JSON 쓰기를 기본으로 한다. 실제 분산 트랜잭션을 약속하지 않는다. 저장 차단 시 기존 안내처럼 현재 세션만 유지. 페이지 복구는 확정된 pending 결과만 재적용.
- 기존 v4 pending 필드는 신규 보상이 없으므로 0 defaults. 불완전/오염 입력이면 재화가 음수 또는 비정상 safe integer를 만들지 않도록 검증하고 사용자 은행 전체를 삭제하지 않는다.
- 정산 진행 중 구매/Relic 제작/Contract 선택/Anomaly 선택/새 Run 전환은 방지하거나 먼저 안전하게 완료. Retry/Back/Skip 경로는 동일 동작.
- Sandbox save는 live storage write 불가. dev 지급·강제 등장·조건 수정은 real 계정 업적/Contract 완료에 반영 불가.
- 라이브 저장의 이미 존재하는 같은 key에 대한 다중 탭 동시편집은 서버 동기화 보장 범위 밖. 테스트에서는 pageshow recovery 및 동시 클릭 중복 완료를 검증.

## 8. 코드 구조 제안

기존 모듈을 교체하지 말고 작은 선언형 확장 모듈을 추가한다.

| 파일 | 책임 |
|---|---|
| config.js | relics[], contracts[], anomalies[] 선언·비용·목표·효과·캡, schema5 |
| relics.js (신규) | 정의 검증, achievement 누적 계산, blueprint 상태, 제작/2슬롯/효과 파생 |
| contracts.js (신규) | 10종 카운터·3단계·활성3·누적/완료/보상 계산·검증 |
| anomalies.js (신규) | seed 분리, 후보 생성/offer 고정/Rank, Run 모디파이어, 성공 판정 |
| game.js | Run snapshot, 이벤트 계측 hook, Relic/Anomaly rule 적용, 기록 |
| content.js / effects.js / motion.js | Hex/Reactor/Ancient 스킬+Relic 합성, 모션/파편/파동 최초 접촉 |
| progression.js | pendingSettlement의 계약/Anomaly/업적 정확히1회 반영 |
| storage.js | schema4→5 및 구버전 pending 복구, 누락/오염 field 기본값 |
| app.js / index.html / style.css / renderer.js | Result/Start의 Loadout·Contracts·Anomaly, HUD 최소 표시, 기존 Play Again 보존 |
| tests/* | 게임 규칙 회귀 + 단위/성장/브라우저 QA, 실제 수치/코드로 작성 |
| README.md / docs/ / artifacts/ | 현재 기능·제한·스크린샷·검증 보고 |

**가능한 코드 조립 순서**:
1. M6 최종 원격 baseline 확인, 기존 QA 실행.
2. schema5/Relic 정의+업적 카운터/비용/제작.
3. Relic 6개 실제 전투 효과 및 조합 회귀.
4. Relic UI/Save/브라우저 QA.
5. Contract 10종 선언·카운터·단계/3슬롯.
6. Anomaly 6종 정의·offer·선택·동적 스폰/움직임·성공 판정.
7. 정산 통합/계약/Anomaly 보상 1회 보장.
8. 50/100/200/300 Run 자동 실험, 기존 브라우저 QA/스크린샷.
9. 최종 보고서, README 갱신, 커밋/원격 푸시.

## 9. 자동 QA 및 명세 수락 기준

### 9.1 필수 단위 테스트

M7:
- 6개 Relic 업적의 경계(목표-1/목표/목표+1), Rank 제약, 소유/제작/구매 재화 부족/성공, 동시두 슬롯/중복 ID/장착해제/다음 Run 반영.
- 6개 Relic 모두 실제 효과 ON/OFF, 초당 제한/재귀/최종타, 0초 중단, 가시 지연·일시정지, 시드 재현.
- Ricochet+Kinetic Reach 생명주기, Condenser+Amplifier, Crackling+Precision, Hex charge 만료, Governor 임계 폭발, Ancient 보조파편.
- 기존 19스킬 UI/구매·M6 원래 광석/특수 도형·20초·Refinery regression.

M8 Contract:
- 10종 각각 카운터 정확성, 단계별 1/2/4배 목표 및 지급1/1.5/2배, Rank 잠금, 최대3개, 수락/포기, 보상 재수령 방지.
- 각 Chain 중복 threshold, 주 파편 vs 보조/고유 파동 구분, 실제 Hex Ward 해제/실행된 Reactor 파동/Ancient/ore 드롭 구분.
- 활성되지 않은 Contract에는 run 기록 소급 금지. Run 시작 snapshot으로 완료한 결과만 반영.

M8 Anomaly:
- 후보 안정성(리로드/Back/같은 Seed 저장 안정), 중복 없는 최대3개, Normal 우회, 자격 rank.
- 6종 위험 규칙의 정확한 수치, target/spawn cap 유지, 동적 충돌·렌더 일치, 정상 Run 원래 수익과 동일.
- 성공/실패 각각 Reward 0/정확한 floor(보너스) 및60 cap; 실패 시 은행 기초 Refinery 지급은 정상.
- Anomaly Pilot 한 Run 성공 1회, 폐기 Run 미지급.

세이브:
- v1→5, v2→5, v3→5, v4→5 은행/스킬/Rank/촉매/이전 pending 완전 보존.
- pending 생성 후 animation complete / Skip / Play Again / Refresh / Back / pageshow 순서 섞기: Photon/Catalyst/업적/계약 모두 1회만.
- 이상 신규 ID/레벨/카운터 데이터만 무시; 기존 정상 세이브 필드를 초기화하지 않음.
- live vs Fresh Lab/격리 A/B 입출력 분리.

### 9.2 재현 가능한 시뮬레이션

필수 최소 baseline:
- Seed [31415,1,7,42,99], build Crusher/Cascade/Reactor, Fresh/LegacyMax, Relic OFF/M7 ON/M7+M8 ON, 20초 fixed와 실제 Extra Time 분리.
- 1/3/5/10/20/30/50/100/200/300 Run 누적 성장, 총 Photon·Catalyst·Relic 소유수/장착률·Blueprint 진척·Contract 단계/완료/포기·Anomaly 선택/성공률·기존 스킬 MAX 시점.
- 동일 자동 target selection을 유지하되 **Contract/Anomaly 선택 정책**을 명시적으로 기록: NormalOnly, RiskSeeking, ContractFocused, Adaptive. 일부 정책은 특정 도형을 노리기 때문에 1개 정책이 모든 상황을 대표하지 않음.
- Relic별 손익 비교와 최소 5개 pair 비교. condition-only 효과는 단위 테스트뿐 아니라 실제 플레이에서 발동 빈도도 보고.
- Raw/Refinery/Contract/Anomaly Photon을 개별 집계하고 누적 수익률 변화 확인. Catalyst 유입·Relic 제작 소비·잔고 기록.
- 고정 seed 반복의 과도한 패턴 편향을 설명하고 선택적으로 distinct seeded runs를 추가 비교.
- v0.9/M6 수치가 같다고 주장할 때는 입력정책/Run 기간/종료조건이 일치했는지 확인; 임의 추정/임의 benchmark PASS 금지.

보고할 지표:
- Run1/5/20/50/100/200/300: relicOwned, equippedPairs, blueprintUnlocked, contractsAvailable/Completed, anomalyOffered/Selected/Won, successful objective reasons.
- human-only: 다시 플레이 의향(1~5), Relic 선택 이해도, Anomaly 위험 이해도, 비중립 Normal 선택 의도, 결과 화면 체류/Skip 비율.
- 프로파일링: 실제 브라우저 평균 FPS·tick P95, simulation collision P95, wave/shard contact errors, ghost hit, cap causes, unhandled console error, save error.

### 9.3 브라우저 실제 QA

- Node 20+, **npm test**, **npm run benchmark**, **npm run benchmark:balance**, **npm run benchmark:m5-m6** 기존 명령 보존.
- 새 **npm run benchmark:m7-m8**, **npm run qa:m7-m8**를 구현.
- 실제 Chrome 분리된 QA 프로필에서 20초 Run 최소 6회: Normal, M7 Relic 장착2, M8 Anomaly 성공/실패, Contract 완료, 기존저장 복구.
- 실제 포인터(클릭/홀드/드래그), UI 노출/버튼 중첩/리사이즈/좁은 창/Play Again 접근성, Relic/Contract/Anomaly 화면·정산 결과 각각 캡처.
- 실험/fixture로 Rank4·Relic 제작·Contract progress를 주입했다면 사진/보고서에 **fixture**라고 표시하고 일반 fresh 세이브 자연 해금 결과와 혼동 금지.
- 최종 QA 명령의 실제 stdout / failure / 환경 제한을 artifacts로 남김. Playwright 미설치면 프로젝트 외부 임시 환경을 사용; 사용자 실제 브라우저 프로필과 데이터 삭제 금지.
- 0 에러·성능 통과를 보고서에 적을 때 반드시 실제 로그 기반. 시스템 환경상 브라우저 실행 불가 시 그 항목만 '검증 필요'로 분리.

## 10. 보고서 / 완료 정의

만들거나 갱신할 결과물:
- docs/Shard_Storm_M7_M8_Implementation_Report.md
- docs/Shard_Storm_M7_M8_Balance_Report.md
- artifacts/m7-m8-*.json, unit-test txt, 브라우저 캡처 PNG 등
- README.md 실행/Run 흐름/Relic/Contract/Anomaly/저장/테스트 가이드
- 신규 모듈/테스트/설정, 필요한 플레이어 설명 텍스트

단계별 Git 커밋 이름 권장:
- test: capture M6 baseline before M7 M8
- feat: add schema5 relic ownership and loadout
- feat: implement six causal relic effects
- feat: add ten staged contracts
- feat: add six deterministic anomaly run rules
- feat: integrate rewards and result UX
- test: verify M7 M8 growth and browser QA
- docs: report M7 M8 outcomes and remaining human gates

**M7 완료**: Relic 6종 설계도/제작/장착 2칸/6효과/저장/정확히 1회 업적 반영 + 자동/브라우저 QA.
**M8 완료**: Contract 10종×3단계/활성3 + Anomaly 6종/Normal/결정적 후보/성공·실패 + 안전 지급/저장 + 실제 QA/시뮬레이션.
**정식 재미 검증은 별도**: 사람5~10 Run만으로 장기 체류3~4시간을 증명할 수 없다. 강제 소진 지연이나 구체적 근거 없는 '3시간 달성' 판정 금지.

## 11. Codex 실행 지침

1. origin/feat/m5-m6-progression의 최신 코드를 fetch하고, 본 문서가 포함된 docs/m7-m8-relic-contract-anomaly를 기준으로 작업 브랜치 feat/m7-m8-relic-contract-anomaly를 만든다. 문서와 코드가 같은 HEAD에 있어야 한다.
2. M5·M6의 118 PASS 기록을 그대로 복사하지 말고 첫 실행에서 실제 기준선/성능을 저장한다. 현재 테스트가 다르면 실제 결과를 명확히 기록.
3. M7 전체(정의/전투/UI/세이브/QA) → M8 전체(Contract/Anomaly/정산/UI/QA) → 통합 시뮬레이션 순서로 개발한다. 부분 scaffolding만 만들고 완료라고 주장하지 말 것.
4. 기존 세이브/동적 물리/이벤트 큐/직접 선택 재미를 유지한다. 게임 엔진/서버 전면 재작성 금지.
5. 초기 수치가 밸런스 목표에 미달하더라도 원본 실험 결과를 보존하며 무단 값 조정/기능 제거로 결과를 미화하지 않는다. 조정은 반드시 별도 실험 프리셋과 근거 보고.
6. 단계별 테스트 가능한 커밋을 남기고 최종 원격 브랜치에 push. 사용자의 미커밋 파일/병렬 작업을 덮어쓰지 말 것.
7. 목표는 M7/M8 **모두 실제 동작하는 게임**이다. 실패한 테스트/브라우저 실행 제한/사람 게이트는 별도 보고하되 범위의 나머지 기능을 진행한다.
8. 최종 보고에서 브랜치·HEAD SHA·구현표·변경파일·단위/브라우저/성장 테스트·스크린샷·사람 검증 필요사항·M9 후보를 간결하게 제공.

**핵심 성공 정의**: 20초 직접 파괴의 손맛을 유지하면서, 같은 완성 스킬 빌드라도 Relic 2개 장착과 Contract/Anomaly 선택으로 20초 동안 **어떤 도형을 먼저 파괴할지**가 달라지는 것.
