# Shard Storm — M5·M6 통합 개발 기획서 (v1.0)

- 문서 유형: Codex 구현용 PRD / 상세 기능 명세 / QA 수락 기준
- 작성 기준: 2026-10-14
- 저장소: https://github.com/Seunghyun0606/shard_storm
- 개발 기준 브랜치: `feat/v09-short-run-progression` (시작 시 최신 remote fetch 후 HEAD 기록)
- 우선순위: M5 경제·성장 속도 검증 → M6 콘텐츠 다양화 → 통합 밸런스·브라우저 QA
- 구현 방식: HTML5 Canvas 2D + Vanilla JavaScript ES Modules 유지, 기존 코어 루프 확장
- **주의:** 이 문서는 개발 요구사항이다. 실제 GitHub 코드 변경이나 커밋이 완료되었다는 의미가 아니다.

## 0. 검증된 현황 / 변경 금지 범위

### 0.1 v0.9 P0 구현 현황

2026-10-14에 원격 `feat/v09-short-run-progression`의 README, config.js, 구현 보고서, storage/economy/progression 코드를 확인했다.

| 항목 | v0.9의 기존 구현 |
|---|---|
| 전투 | 기본 20초; Extra Time +2초/Lv(최대 32초); 직접 클릭/홀드/드래그; 순차 연쇄 파편·파동 |
| 도형 | 기본 Triangle/Square/Pentagon/Star; Cracked/Charged/Enhanced; 저속 회전·드리프트 |
| 단일 Run 내부 Tier | 해당 Run 파괴 수 `0/15/45/100/200/400/750`; 화면 전환 없이 혼합 보충 |
| 재화 | Run 중 Raw 획득 → 결과창 10토큰·5슬롯 Refinery → Photon 1회 정산 |
| Refinery | `floor(sum(tokenRaw × .06 × slotMultiplier))`; 슬롯 배율 `.8/1/1.1/1.3/1.6` 및 가중치 `15/35/30/15/5` |
| 스킬 | 기존 11종; 총 35 레벨; 기본 가격과 반복 비용 성장 `×1.6` |
| 저장 | 키 `shard-storm-v1`, schema3; 이전 bank·levels·기록·옵션 유지; pending 정산 및 1회 지급 |
| 실험 | Fresh Lab, 격리 세이브, 기존 경제·전투 A/B·로그 지원 |
| QA | 구현 보고서 기준 단위 테스트 94 PASS, 20초 자동 벤치마크 및 브라우저 QA |

v0.9 기본 자동 입력 5시드 중앙값: 20초 Run 149킬 / 1,942 Raw / 122 Photon / 연쇄킬 비율 49%. v0.9 보고서의 *자동 입력 수치*이며 사람 플레이 수치가 아니다. 5회 누적 구매량은 빌드 정책에 따라 3~4Lv, 10회는 7~12Lv였다. **현재 속도가 지나치게 빠르다고 단정하고 추가 너프부터 하지 않는다.**

### 0.2 필수 유지 원칙

1. 기본 20초 직접 파괴, 수동 타깃 선택, 홀드·드래그 가능, 순차 전파를 유지한다. 자동 조준·자동 공격으로 전환하지 않는다.
2. 별도 Sector/Round 화면을 만들지 않는다. 도형은 기존 화면에서 Run 누적 파괴 수에 맞춰 혼합 보충한다.
3. 기존 네 도형과 변종, 콤보5/10/20, 모션과 충돌, 기초 11스킬, Refinery/Skip/Play Again을 회귀 보호한다.
4. 이미 구매한 스킬·Photon·정산 기록을 몰수하지 않는다. 희귀 자원은 현금 상품/유료 확률 상품이 아니다.
5. 총 50 Run은 기본 전투 시간만 약 16분 40초임을 인정한다. 이는 ‘3~4시간 플레이를 검증했다’는 뜻이 아니다. M7은 별도 장기 플레이 설계다.
6. 아래 수치는 **구현 가능한 시작 프리셋과 검증 목표**이며 사람 테스트를 통과한 최종 밸런스 수치가 아니다.

## 1. 제품 목표와 핵심 지표

### 1.1 유저 경험 목표

| 누적 Run | 기대 상태 (가설) | 주요 콘텐츠 |
|---|---|---|
| 1~5 | 매 1~3판 의미 있는 구매, 파괴 빌드 방향의 초기 선택 | 기존 노드 성장; Discovery Rank1·Prism 접근 |
| 6~20 | 적어도 2가지 빌드의 강점·약점 체감, 전술 타깃 선택 | Rank2, Core Ore, Catalyst, Hex Shield, 새 Cascade/Refinery 노드; 후반 Rank3 시도 |
| 21~50 | Reactor/Ancient를 중심으로 전략 변화, Catalyst 소비와 다음 목표 존재 | Rank3~4, Reactor Node, Ancient Core, 희귀 노드, 장기 빌드 차별화 |

### 1.2 목표 판단 방식

- 첫 1~3 Run에 구매 가능 노드가 존재하되, 플레이어가 원하는 고비용 노드를 위해 저축할 수 있다. 특정 구매를 강제하지 않는다.
- 5회 시점: 구매와 관계없이 다음 해금·강화 목표가 하나 이상 보이고, 전체 신규 콘텐츠는 소진되지 않는다.
- 20회 시점: Crusher / Cascade / Reactor 등 세 전략의 차이를 수치와 플레이 기록으로 비교할 수 있다. 서로 모든 차원에서 동일하거나 한 빌드가 전 구간 완전 우위면 조정 대상으로 기록한다.
- 50회 시점: 희귀 도형 또는 고급 노드의 실제 획득·상호작용 경로가 존재하고, 여전히 미구매 선택지가 남는 것을 우선 목표로 한다.
- 실제 사람 테스트의 재도전 의향, 클릭 실패감, 새 목표 이해도를 자동 시뮬레이션과 별도 수집한다.

## 2. M5 — 경제·성장 속도 검증 및 영구 진행

### 2.1 M5-01: Baseline 고정 및 계측

- 먼저 `feat/v09-short-run-progression` 최신 HEAD와 단위 테스트, 벤치마크 실행 결과를 캡처한다.
- 신규 변경 전 5시드 `[31415, 1, 7, 42, 99]` / 3구매 정책 `Crusher/Cascade/Reactor` / Fresh, LegacyMax 프로필 / 1·3·5·10·20·50 Run 누적 지표를 자동 생성한다.
- 각 시나리오의 플레이 입력 정책, Run별 설정, 소요시간, 구매 우선순위, 테스트용 재화 여부를 기록한다.
- 아직 M6가 추가되기 전 기준선을 남기고, M5/M6 추가 이후 같은 설정으로 다시 실행한다. 다른 시뮬레이션 룰셋을 같은 그래프에 ‘동일조건’으로 혼합하지 않는다.

필수 Run 데이터: `runId, seed, profile, inputPolicy, ruleset, configuredDuration, actualDuration, runTier, directKills, chainKills, bestChain, rawBase, rawOreBonus, rawSkillBonus, rawEarned, refineryPayout, bankBefore, bankAfter, rewardsBySource, skillLevels, purchasedSkills, upgradesAffordable, refineryMultiplier, fps, tickP95, capHits, skippedEvents, motionMisses, refinerySkip`.

필수 계정 데이터: `totalRuns, lifetimeDestroyed, knownHistoryKills, discoveryRank, catalystBalance, spentPhoton, earnedPhoton, ranksReachedAtRun, firstRareFoundAtRun, highTierShapesEncountered, purchasedSkillIds, unlocksSeen`.

### 2.2 M5-02: 영구 Discovery Rank

`Run Tier`(현재 한 판의 누적 파괴로 결정)와 `Discovery Rank`(정산된 여러 판의 누적 파괴로 결정)를 **서로 다른 축**으로 저장한다.

| Rank | `lifetimeDestroyed` 최소치 | Rank 해금 |
|---|---:|---|
| 0 | 0 | 기본 4종, 기존 11노드, 기본 Refinery |
| 1 | 300 | Prism Ore, Precision Fracture, Yield Stabilizer |
| 2 | 1,200 | Core Ore, Catalyst, Hex Shield, Fragment Relay/Kinetic Reach/Rare Separator |
| 3 | 3,500 | Reactor Node, Resonance Layer, Salvage Scanner |
| 4 | 8,000 | Void Ore, Ancient Core, Catalyst Channel |

정확한 Rank 함수: `max(rank where lifetimeDestroyed >= threshold)`. Rank 변경은 **Refinery 정산 완료 후** 수행하고 다음 Run부터 새로운 스폰·스킬 가용 상태에 반영한다. Run 중 Rank 상승 없음. 새로고침/중복 정산에서 Rank·누적 파괴가 중복 증가하면 안 된다.

기존 schema3의 `lifetimeDestroyed`는 v0.9 이후 정산된 정확한 누적치이며 그대로 유지한다. schema1/2에서 마지막 20 Run만으로 전체 누적을 복원하지 않는다. 이전 기록은 `knownHistoryKills`에 독립 보존하고 ‘확인 가능한 과거 기록’으로 표기한다. LegacyMax 사용자에게는 새로운 Rank 목표를 제공하되 은행 잔액만으로 Rank/Catalyst 조건을 건너뛰지 못하게 한다.

**UX:** 스킬 화면 상단에 `Discovery Rank 2 — 1,570/3,500 destroyed` 형태의 바와 다음 해금 미리보기를 표시. Rank 상승 시 동일 결과 화면에서 0.7초 이하의 한 번만 재생되는 배너/새 노드 하이라이트. 새로운 이동 화면·확인 팝업은 금지. 필요한 툴팁과 다음 Run 즉시 진행을 유지한다.

첫 Rank 달성 후 해당 콘텐츠가 다음 Run에서 곧바로 보이지 않더라도 이유를 설명한다(‘현재 Run 45킬부터 등장’ 등). 최초 Rank1/2/3/4 달성 후 조건이 충족되는 **다음 적격 Run에서 한 번** 신규 콘텐츠를 스폰 후보로 우선 고려하는 웰컴 플래그를 둔다. 해당 Run이 조건을 만족하지 않으면 플래그를 유지하고, 화면 한복판에 강제 스폰하거나 별도 단계 이동하지 않는다.

### 2.3 M5-03: 광석 등급, Raw 보너스, Catalyst

`oreGrade`는 원래 `shapeType`, `modifier`와 독립된 속성이다. 스폰 시 독립 RNG에서 한 번 결정하며, 등급은 인스턴스 생존 중 고정한다.

| 등급 | Rank 조건 | 실제 스폰 확률(적격 스폰 기준) | 완전 파괴 보너스 | Catalyst |
|---|---|---:|---:|---|
| Common | 0 | 나머지 | +0 Raw | 0 |
| Prism | 1 | 8.0% | +15 Raw | 0 |
| Core | 2 | 2.0% | +60 Raw | +1 |
| Void | 4 | 0.5% | +180 Raw | +2 |

예: Rank2는 Prism 8%, Core 2%, Common 90%; Rank4는 Prism 8%, Core 2%, Void .5%, Common 89.5%. 확률은 도형 추첨과 별도로 해금된 등급에서만 적용하고 **가중치를 조건에 따라 재분배하는 대신 나머지를 Common으로 둔다**. 미해금 등급은 절대로 등장하지 않는다. 독립 RNG 스트림으로 모션·배치·기본 도형 스폰 결정성과 뒤섞지 않는다.

- 보너스 Raw는 실제 HP 제거와 고유 파괴 보너스 **이외** 한 번만 지급한다. 직접/파편/파동 파괴 모두 같은 드롭. 피해 누적 때가 아닌 **최종 파괴 이벤트**만 드롭한다.
- Catalyst는 **Run 종료 후 Refinery 1회 정산 때** 계정에 추가한다. Run 중 얻는 Catalyst는 화면에 `Pending Catalyst`로 미리보기만 표시한다. Refresh 중복 지급 금지.
- `Ore Reward`의 소유자·사망 원인·획득 수를 이벤트 로그에 기록한다. Catalyst는 Photon으로 직접 변환/매도/구매할 수 없다.
- 기본 도형 외곽선 색/형태를 유지하고, ore는 중앙 작은 픽토그램 + 고대비 대비 테두리/라벨로 명확히 표시한다. 시각 옵션 OFF가 보상 확률·HP·실제 판정에 영향을 주지 않도록 한다.
- 희귀 등급이 전체 Raw에서 차지하는 비중 `oreRawBonus / rawEarned`를 기록한다. 처음엔 15% 초과 시 **수정 후보로 표시**하되 즉시 보상을 잘라내는 하드 캡으로 사용하지 않는다.

### 2.4 M5-04: 경제 조정 정책

1. **기본 live 경제는 v0.9 그대로 유지:** `conversionRate=.06`, Refinery 10토큰, 슬롯 `[.8,1,1.1,1.3,1.6]`, 기존 11개 스킬 초기 가격·성장 `1.6` 유지.
2. 신규 스킬은 추가 비용과 Rank/Catalyst의 기회비용으로 성장 수명을 늘린다. 비용 데이터는 `config.js` 한곳에서 설정한다.
3. `cost_x3 / cost_x6`는 기존처럼 격리 A/B에서만 이용하고 실제 세이브의 기존 업그레이드를 강제로 가격 인상하거나 초기화하지 않는다.
4. 환산식은 `floor(sum(tokenRaw * conversionRate * (effectiveSlotMultiplier)))`; **Raw 구성 요소(HP, nativeBonus, oreBonus, skillBonus)**를 분리 기록하되 최종 Raw 합계로만 가공한다.
5. `Yield Stabilizer`를 소유한 경우 가공 슬롯 추첨 결과 자체는 재추첨하지 않는다. Lv1일 때 ×0.8 슬롯만 ×1.0으로 취급, Lv2일 때 추가로 ×1.0 슬롯만 ×1.1로 취급한다. 원래 슬롯과 실제 슬롯 둘 다 로그에 남긴다. 레벨 효과는 현재 Run **시작 스킬 스냅샷**으로 결정한다. 게임 종료 후 해당 노드 구매로 이전 정산액을 바꾸지 않는다.
6. Refinery는 기존처럼 최대 1.2초 연출, Skip 즉시 결과, 실제 지급은 정확히 1회. Catalyst도 같은 정산 원자성 경계에 묶는다.
7. 게임 플레이가 비정상적으로 느리거나 빠른 원인을 찾을 때는 순서대로 `스폰/충돌 → 목표 도형 도달율 → ore 드롭 → Photon 변환/가격 → Rank 문턱`을 한 변수씩 점검한다.

### 2.5 M5-05: 구매 UX와 장기 목표

- 기존 스킬 트리 11개와 연결선을 유지하며 `Refinery` 가지 및 신규 노드를 화면에 추가한다. Rank 미달 노드는 어둡게 보여주되 다음 Rank/조건을 볼 수 있다. 완전히 숨겨져 목표를 모르게 만들지 않는다.
- 스킬 상세는 `현재 효과 / 다음 레벨 변화 / Photon 비용 / Catalyst 비용 / Rank 조건 / 선행 스킬 / Max 레벨`을 전부 표시한다.
- 구매는 RESULT 화면에서만 가능, `bank >= cost && catalystBalance >= catalystCost && rank >= requiredRank && all prerequisites`일 때만 승인한다. Photon과 Catalyst는 한 트랜잭션으로 동시에 차감되며 실패 시 모두 유지한다.
- ‘모두 구매’ 버튼을 만들어 빠른 콘텐츠 소진을 유도하지 않는다. 한 레벨 구매 후 실제 다음 비용과 대체 노드를 비교하게 한다.
- 기존 세이브 내 이전 구매는 유효하게 유지. 신규 8노드는 모두 0에서 시작. 다음 목표 카드(최대2개)를 결과 화면 상단에 제공하고 과도한 알림은 금지한다.

## 3. M6 — 신규 도형, 상호작용, 스킬 확장

### 3.1 M6-01: 신규 도형 3종의 정확한 메커니즘

**공통:** `shapeDefinition`/고유 이벤트를 데이터 기반으로 등록한다. 기본 4종의 우선순위·안내 배치·모션·모디파이어를 회귀 보존한다. 새로운 형태의 고유 메커니즘은 장식과 독립적이며 파동/파편은 동일한 실제 게임 시간에서 순차 전파된다.

#### A. Hex Shield — 보호 거점

| 규칙 | 시작값 |
|---|---|
| 출현 | Discovery Rank2 이상 **및 현재 Run Tier2(45킬) 이상** |
| 기본 HP / 보상 | 8 HP / 파괴 보너스 +20 Raw |
| 스폰 가중 | 적격 스폰의 6%; 최대 동시 3개 |
| 움직임 | 회전 가능, 드리프트 최대 4px |
| 고유 효과 | 주변 일반 도형 최대 2개에 `wardSourceId` 연결(거리 85px 이내, 중복 Ward 금지) |

- **Ward**: 보호 받는 일반 도형이 피격될 때 해당 타격의 실제 HP 피해를 `max(0, incomingDamage - 1)`로 감소시킨다. HP가 줄지 않은 피해는 Raw를 발생시키지 않는다. Ward가 없는 도형에는 적용하지 않는다.
- Hex 본체의 첫 **직접 타격**은 피해량이 4 이상이면 장갑 균열이 표시되고 정상 피해; 직접 피해 3 이하 또는 파편·파동은 첫 피격에 한해 최대 1HP 피해로 제한한다. `shieldBroken` 이후에는 모든 정상 피해가 적용된다. 기존 강력한 직접 스킬 구매에 선택 가치가 생긴다.
- Hex 완전 파괴 시 게임시간 `+0.03s`에 **비피해 해제 파동**을 생성, 파동 속도 650px/s·반경 85px. 파동이 Ward 대상에 실제 접촉할 때 연결을 끊는다. Hex 사망 후에도 해제파가 도달하기 전까지는 잠깐 Ward가 남으며, 대상이 이동해 반경을 벗어나는 등 미접촉 사례는 사망 시각+0.25초에 안전하게 자동 해제한다. 해제파는 피해·Raw 없이 지연 인과관계를 표현하며, Run 종료 시 남은 Ward 참조를 전부 정리한다.
- Ward는 대상 파괴, 보호 원본 파괴, 다음 Run 시작 시 참조를 정리한다. 해제 파동 후 새로운 영구 Ward가 남거나 참조 메모리 누수가 발생하지 않아야 한다.
- **왜 먼저 클릭하는가:** Hex를 선택해 부수면 주변의 연쇄 효율이 회복된다. 클릭 우선순위를 바꾸는 목표 도형이다.

#### B. Reactor Node — 체력 단계형 파동

| 규칙 | 시작값 |
|---|---|
| 출현 | Rank3 이상 **및 Run Tier3(100킬) 이상** |
| HP / 파괴 보너스 | 12 HP / +35 Raw |
| 스폰 가중 | 적격 스폰의 3%; 최대 동시 2개 |
| 첫 단계 | HP가 최초로 6 이하가 되는 순간, 게임시간 `+0.03s`에 파동 1회 발사. 반경 75px, 피해 2, 속도 650px/s |
| 두 번째 단계 | HP가 0이 되는 순간, `+0.11s`에 파동 1회 발사. 반경 110px, 피해 3, 속도 650px/s |

- 첫 단계와 파괴 단계의 트리거는 각 인스턴스당 최대 1회. 한 번에 12→0으로 파괴된 경우에도 **두 이벤트를 예약하되 순차 발사**한다. 시간 종료 이전 발사·접촉만 실제 피해/수익을 만든다.
- 파동의 `hitIds`, chain lineage, 기존 depth/events/waves cap을 그대로 적용. 중첩 파동이어도 원래 파동별 피해는 가능하지만 같은 파동이 같은 대상을 두 번 맞히지 않는다.
- Reactor 외곽에 50% 에너지 눈금과 분리된 사망 파동 표식을 넣는다. 신규 자산 없이 Canvas/SVG로 구현한다.
- **왜 먼저 클릭하는가:** 완전 파괴 이전에도 폭발을 만들 수 있어, 한 판 안에서 파동의 타이밍을 조절할 수 있다.

#### C. Ancient Core — 단계 해제형 고가치 목표

| 규칙 | 시작값 |
|---|---|
| 출현 | Rank4 이상 **및 Run Tier4(200킬) 이상** |
| HP / 파괴 보너스 | 30 HP / +120 Raw |
| 스폰 | 적격 보충 시 0.6%; 동시 1개, 한 Run에 최대 2개 |
| 움직임 | 느린 회전만, 드리프트 없음. 일반 도형보다 큰 원형 판정이 실제 모습과 일치 |
| 체력 단계 | 잔여 HP `<=22`, `<=15`, `<=7` 첫 도달 시 각각 단계 발동 |

- 각 단계는 게임시간 `+0.03s`에 작은 방사 파편 2개(피해1·거리90px)와 충격파 1개(반경60px·피해1·650px/s)를 발생시킨다. 단계별 1회, 진행 깊이/이벤트 한도 적용. 보너스 Raw는 **최종 파괴 때만 +120**.
- 한 타격이 여러 임계값을 넘어가면 해당 단계들을 이벤트 순서 `stageIndex=1,2,3`으로 예약하되 각각의 실제 충돌을 계산하고, UI 연출은 겹칠 때 시각 상한 안에서 합친다. 원본 도형이 이미 사망해도 사망 당시 정당하게 예약한 효과만 시간 내에 처리한다.
- 완전 파괴 시 별도 `+2 Catalyst` 지급(oreGrade의 Catalyst 보너스와 합산 가능; 이벤트별 출처 식별). 한 번만 지급한다.
- 정상 시간 종료 시 보스 종료 화면이나 추가 연장 시간을 강제하지 않는다. Ancient를 시간 내 파괴하지 못했다면 파괴 보너스·Catalyst는 지급하지 않는다.
- **왜 먼저 클릭하는가:** 여러 강타를 투자해 단계별 파편과 충격파를 의도적으로 연결하는 고급 타깃이다.

### 3.2 M6-02: 스폰 가중치, 배치, 모션

- 기본 스폰은 기존 Tier 배열의 4종 가중치를 유지하되, 특수 도형이 적격일 때 먼저 특수 도형 확률을 판정한다. 남은 확률에서 기존 4종을 기존 비율대로 정규화해 뽑는다. 튜토리얼 첫 4연쇄 구성은 변경하지 않는다.
- 한 종류가 cap에 도달하면 강제 재시도 루프 대신 그 스폰 시도를 일반 도형으로 폴백한다. 스폰은 기존 .2초×3, 충돌/경계/피해 이벤트 정책을 유지한다.
- 기존 Cluster/Arc/Bridge/Scatter 보존. 추가 배치: `Shield Pocket`(Hex 후보가 있을 때 주변 Ward 가능 1~2개 위치를 우선 계획), `Tether Pair`(Rank2 이후 전체 새 군집 계획 중 최대8%, 일반 도형 2개가 반대 위상으로 저속 이동). Tether는 공격력·보상이 아닌 ‘어느 타이밍에 클릭할까’의 시각 리듬만 추가한다.
- Tether Pair는 기존 기본 모션 앵커 기준 각각 **최대 6px 변위**, 충돌 경계 여유 `radiusSum +12px + 2*maxDrift`를 확보하고 두 인스턴스는 동일 시간 함수의 반대 위상 사용. 미리 준비된 위치가 안전하지 않다면 기존 정적 배치로 폴백. 화면 밖 이동·도형 겹침·충돌 유령 히트 금지.
- 추가 메커니즘은 기존 motion.js와 물리 중심 API를 사용. 렌더 위치와 실제 클릭/파편/파동 접촉 위치가 일치해야 한다.
- `Visual Variety OFF`/`Modifier Marks OFF`는 물리·보상을 바꾸지 않고, `Motion OFF`는 기존 안전한 정적 앵커 위치와 같은 경제/도형 배치를 비교할 수 있어야 한다.

### 3.3 M6-03: 신규 스킬 8종 (기존 11개와 별도)

**공통 비용:** `nextCost = ceil(baseCost * 1.6^currentLevel)`. Catalyst 비용은 아래 지정된 각 레벨의 고정 수량(순서대로)이며 Rank/선행조건을 모두 충족해야 한다. 신규 스킬은 최초 Lv0, 기존 스킬 레벨을 변경하지 않는다.

| ID / 표시명 | 가지 | Rank | 선행조건 | Max | 최초 Photon | Catalyst 소비(Lv별) | 정확한 작동 |
|---|---|---:|---|---:|---:|---|---|
| `precisionFracture` / Precision Fracture | Destroy | 1 | Crush Power Lv2 | 2 | 180 | 0/0 | Cracked를 직접 최종타로 파괴하면 Lv1 파편2개, Lv2 파편3개를 60px 방사. 피해1, 분열·반사·다시 유발 없음; 추가 Raw +10/Lv(대상당1회) |
| `yieldStabilizer` / Yield Stabilizer | Refinery | 1 | 없음 | 2 | 220 | 0/0 | Lv1 ×0.8 슬롯을 ×1.0으로 보정. Lv2 추가로 원래 ×1.0 슬롯을 ×1.1로 보정; 슬롯 RNG는 그대로 |
| `rareSeparator` / Rare Separator | Refinery | 2 | Yield Stabilizer Lv1 | 2 | 350 | 2/4 | Core Ore 완전 파괴 추가 Raw +40×Lv, Lv2부터 한 Run에서 **첫 Core Ore 파괴에만** 추가 Catalyst +1 |
| `fragmentRelay` / Fragment Relay | Cascade | 2 | Shard Power Lv2 | 2 | 520 | 4/6 | 주 파편에 의한 최종 파괴 후 진행 방향으로 Relay 보조 파편 1개 발사. Lv1 피해1·80px, Lv2 피해2·90px; Chain당 최대4회. Relay 스스로 Relay/계승/반사를 유발하지 않음 |
| `kineticReach` / Kinetic Reach | Cascade | 2 | Shard Range Lv1 | 2 | 420 | 2/3 | 회전 중인 **원본 도형**에서 발사된 주 파편의 비행거리 +30px/Lv. 발사 순간 원본 각속도 기준; 목표 자동 추적 없음, Square/Star 파동에는 미적용 |
| `resonanceLayer` / Resonance Layer | Reaction | 3 | Chain Amplifier Lv2 | 2 | 650 | 6/8 | Reactor가 발생시킨 파동이 Charged 타깃을 타격하면 그 타깃 중심에서 0.08초 후 소형 여진(피해1·반경40+10×Lv px) 1회 발생. 파동당 최대2개, 여진은 자기 자신/다른 Resonance 재발동 불가 |
| `salvageScanner` / Salvage Scanner | Utility | 3 | Photon Boost Lv1 | 2 | 700 | 6/8 | Run 시작 시 희귀 등급을 1초 강조 표시. 추가로 Core 출현 확률 +0.5%p/Lv(일반 등급에서만 차감), Rank4면 Void +0.1%p/Lv(일반에서만 차감); 확률과 실제 시도·당첨 로깅 |
| `catalystChannel` / Catalyst Channel | Legacy | 4 | Rare Separator Lv1 + Resonance Layer Lv1 | 1 | 1400 | 24 | Ancient Core의 HP단계 파동이 닿은 첫 2개의 주변 일반 도형에 Channel 표식을 1초 부여. 표식 도형을 직접 파괴하면 작은 파편2개(피해1·70px) 발생; 한 Ancient당 최대2표식, 2차 Channel 재발동 불가 |

**스킬 해석 규칙:**

- 모든 신규 보조 파편·여진은 `damageSource`, `chainId`, `generationDepth`, `triggeredBySkill`을 로그에 기록한다. 기존 caps를 절대 무시하지 않는다. 0초 이후 예약 이벤트는 처리하지 않는다.
- `precisionFracture`는 **직접 최종타인 경우만**. 직접 공격으로 이미 파괴되지 않았다면 이후 파편 킬에 소급 적용하지 않는다. Lv2도 대상당 추가 Raw는 최대 20.
- `fragmentRelay`의 발동 원인은 **주 파편의 final kill**이며, 작은 분열 파편·Relay 파편·파동 사망에서는 발동 금지. 4회 제한은 Chain ID당이고 새 Chain ID에는 초기화.
- `resonanceLayer`는 Reactor가 없는 Rank0~2 플레이에서 비활성인 고급 조건부 기능이다. 다른 사각형/별 파동을 일괄 강화하지 않는다.
- `salvageScanner`는 표시와 확률 변화라는 **게임플레이 능력**이다. 단순 시각 OFF 토글이 실제 확률을 끄면 안 된다. 미해금 등급이 확률 보너스로 등장하는 오류 금지.
- `catalystChannel`은 명시한 RareSeparator+Resonance의 수렴 조건이지만 다른 가지 선택을 강제하지 않는다. 고급 한 노드만 복합 조건으로 두고, Rank1~3에는 비선형 분기·선택의 기회비용을 유지한다.
- 트리 노드 UI는 Rank·소비 Catalyst·경제적 효과와 전투 효과를 구분해 설명하며, 기존 11 노드는 위치를 필요 이상 재배치하지 않는다.

### 3.4 M6-04: 발견/도형/스킬 상호작용 의도

| 플레이 상황 | 기대 선택 | 직접적 결과 |
|---|---|---|
| Hex 옆에 도형 다수 | Hex 먼저 직접 파괴 vs 주변 Chain 우회 | Ward가 풀리며 연쇄 수익·파편 경로 변화 |
| HP 절반 가까운 Reactor | 직접 타격으로 임계값 통과 | 부분 손상만으로도 짧은 파동이 시작됨 |
| Core Ore + Cracked | 높은 드롭값 타깃 우선 처리 | Raw/Catalyst 효율 및 Precision 조건부 발동 |
| Ancient + 다수 Charged | Ancient 단계 조절 | 파동으로 여러 반응을 순서대로 연결 |
| 충돌이 잦은 회전 군집 | Kinetic Reach 투자 | 회전 도형 파편의 후속 도달 범위 확장 |
| 큰 파편 연쇄 | Fragment Relay 투자 | 주 파편 킬 뒤 짧은 약한 파편 한 번 더 연결 |

단순히 피해량만 키우는 것이 아니라 **어떤 도형을 먼저 부술지**가 바뀌는지 사람 플레이로 확인한다.

## 4. 공통 구현·데이터·안전 규격

### 4.1 권장 변경 파일 (현재 구조와 대조해 조정)

| 영역 | 대상 예시 | 역할 |
|---|---|---|
| 밸런스 | `config.js` | Rank·OreGrade·shapeTypes·specialEffects·신규 업그레이드·spawn weights; 시작 프리셋 한곳 선언 |
| 진행 | `progression.js`, `skill-tree.js` | Rank 계산, 구매 자격, 선행 조건, 스킬 파생 수치, 이전 11개 유지 |
| 전투 | `game.js`, `entities.js`, `effects.js`, `motion.js` | 특수 도형, Ward, 파동/파편, 고유 능력, 실제 접촉과 이벤트 순서 |
| 재화 | `refinery.js`, `economy.js` | Raw 출처 분리, Ore/Catalyst 보상, Yield 적용, 1회 정산 |
| 저장 | `storage.js` | schema4, 기존 v1/v2/v3→v4 무손실 마이그레이션, transaction ID 및 새 필드 |
| 화면 | `app.js`, `renderer.js`, `visuals.js`, `index.html`, `style.css` | Rank 진행, 희귀 표식, 특수 도형·스킬 툴팁·노드, 과한 팝업 제한 |
| QA | `tests/`, `artifacts/`, `docs/` | 결정성/회귀/성장 자동 실험/브라우저 입력·스크린샷/보고서 |

### 4.2 Save schema4 권장

기존 키 `shard-storm-v1` 유지. **`saveVersion:4`로 올리면 v1/v2/v3/4를 모두 명시적으로 로드**해야 한다. 현재 v3 로더의 `[1,2,C.saveVersion]`를 그대로 두고 `C.saveVersion=4`만 바꾸면 **기존 v3 저장을 거부하는 심각한 버그**가 발생한다.

개념적 구조:

```js
{
  saveVersion: 4,
  bank, levels: { /* 11개 기존 + 신규 8개 */ },
  bestStats, lastRuns, options,
  totalRuns, lifetimeDestroyed, knownHistoryKills, discoveryRank,
  catalystBalance, milestoneWelcomeFlags: {},
  pendingSettlement: null, lastSettlementId,
  legacyExtraTimeLevel, timeRespecUsed
}
```

- 과거 은행·기존 11스킬·환불 권리·기록·옵션을 변형 없이 이전. 누락 신규 노드만 Lv0.
- pending settlement 구조에는 `runId, rawBase, rawOreBonus, skillRawBonus, payout, catalystPayout, totalDestroyed, oreKills, milestoneProgress, shapeUnlockEvents, saveSchema`가 들어가며 payout / Catalyst / lifetime이 함께 확정된다. 진행 중 새로고침 뒤 같은 settlement ID로 복구한다.
- 한 저장 오브젝트의 정산 트랜잭션으로 **bank, catalystBalance, totalRuns, lifetimeDestroyed, rank, lastRuns, lastSettlementId**를 함께 갱신한다. 중간 실패 시 재적용하더라도 ID를 확인해 한 번만 반영한다.
- 테스트용 Fresh Lab/가격 실험/강제 스폰·재화 지급은 sandbox 내에서만 동작; 실저장 접근 금지. JSON export에 현재 스키마/해금 정보를 포함한다.
- 병합 실행 중 중복 클릭/visibility 변경/결과창 재진입 등에서 한 정산 ID의 재적용을 금지. 음수·NaN·비정상적으로 큰 금액·잘못된 신규 스킬 값을 안전하게 거부 또는 개별 무시하되, 정상적인 기존 진행은 리셋하지 않는다.

### 4.3 이벤트 및 결정성

- 게임 로직은 기존 고정틱 1/60s, 예약 이벤트의 시간→우선순위→ID 안정 정렬, 게임시간 기반 효과를 유지한다.
- 파편·파동·타깃 이동 접촉은 현재 실제 world pose를 사용하고, 임의의 프레임 속도에 따른 결과 차이를 테스트로 탐지한다.
- RNG 스트림 `spawn / modifier / motion / ore / refinery / cosmetics`는 독립 관리한다. 신규 Ore RNG 도입으로 v0.9 오리지널 생성 RNG 시퀀스가 불필요하게 달라지지 않도록 한다.
- 효과 데미지의 중복 처리 방지 키 예: `(waveId,targetId)`, `(shapeId,stageIndex)`, `(shapeId,oreDrop)`, `(chainId,relayOrdinal)`, `(settlementId)`.
- 새 이벤트 때문에 기존 안전 cap(파편150, 깊이10, chain events400, waves64, scheduled1024 등)을 무시하지 않는다. 상한에서 가짜 보상 생성 금지, cap 이유를 기록한다.

## 5. 자동 밸런스 실험 / QA 수락 기준

### 5.1 M5 밸런스 실험

- 5개 고정 시드, Fresh 3구매 전략(Crusher/Cascade/Reactor) ×50 Run = **750 연속 Run**. 각 경로의 1/3/5/10/20/30/50회 누적 레벨, 은행·Catalyst, Rank, 발견 도형, 가동한 스킬, Rank별 도달 Run, 미구매 유효 노드 기록.
- 같은 정책과 시드로 `M5_ONLY`와 `M5_M6_ON`을 비교하되 물리 결과·드롭 차이는 각각 실제 관측대로 보고한다. LegacyMax 5시드×최소10 Run 별도. 사람 input과 자동 input은 절대로 평균 합치지 않는다.
- `motionON/OFF`, `refineryON/OFF`, `oreON/OFF` 비교는 Fresh Lab/격리 시뮬레이션에서만 실행한다. OFF로 영구 저장을 오염시키지 않는다.
- Rank1/2/3/4 목표치300/1200/3500/8000에서 off-by-one 테스트. 5·20·50 Run의 목표가 과도하게 이르거나 늦을 경우 데이터를 표로 제시하고, **명시된 threshold 변경은 설정·보고서에 이유를 기록**한다.
- 50 Run 내 전부 Max인 빌드가 발생하면 ‘콘텐츠 조기 소진’ 경고. 50 Run 내 Rank4에 아예 도달할 수 없으면 평균 파괴 수와 실제 출현 타이밍을 분해해서 분석한다. 둘 다 테스트에서 인위적 보정을 하거나 자동 보상을 쏟아 해결하지 않는다.

### 5.2 전투 및 스킬 단위 테스트 필수

1. Rank0/1/2/3/4 경계값·업데이트 타이밍 및 기존 legacy save의 정확성.
2. oreGrade 독립 RNG/확률 경계/미해금 차단/원래 shape, modifier, HP/스폰 동일성.
3. 각 Ore 보너스와 Catalyst 직접/파편/파동 마지막 파괴에서 정확히 한 번 지급.
4. Hex 직접4와 직접3·파편 공격의 장갑 차이; Ward 피해 감소·해제·사망·고아 참조 정리.
5. Reactor HP6 도달·한 번에 12→0·중복 타격·0초 종료에서 1단계/2단계 정확성.
6. Ancient HP22/15/7·동시 다중 임계 통과·한 Run2회 스폰/동시1개·최종 보너스/Catalyst.
7. Rank와 Run Tier **AND 조건**, 기존 4종과 튜토리얼 4연쇄 회귀, 특수 스폰 폴백.
8. Tether 이동 목표 클릭/파편/파동 최초 접촉, 움직임 OFF/일시정지/경계 안전.
9. 신규 스킬 8개 모든 효과(상세 수치 포함), 조건/수준·선행/Photon/Catalyst·MAX/구매 실패.
10. Fragment Relay/Resonance/Channel의 자기 재귀·타 이벤트 상한과 1회 조건.
11. 기본 refinery 슬롯 RNG와 Yield Stabilizer의 결과·재시작 결정성, Skip/Play Again/Refresh/Back 중복 정산 방지.
12. 스키마 1/2/3/4 로드·재저장, 기존 Extra Time refund/기록 보존, 새 노드 결측치 기본0.
13. 동일 시드와 입력 정책 결정성, 장식 OFF 전투/수익 동치, 합성 효과의 caps 및 안전한 종료.
14. 실험/테스트 지급·강제 스폰/50 Run simulation이 실제 localStorage와 무관함을 검증.

### 5.3 브라우저 QA 필수

- Chrome/Playwright의 격리 프로필을 사용해 **실제 포인터** 클릭/홀드/드래그 20초 Run 최소 3회; Rank2·Rank3·Rank4 전용 프로필에서 각각 특수 도형 실제 피격/연쇄 캡처. 치트·fixture는 명확히 표시하고 일반 플레이 실측과 분리한다.
- Result/Refinery/Skill 구매/Rank 진행/해금 상세/소비 Catalyst/새로고침/뒤로 가기/Replay 흐름 확인. 콘솔 오류 0; 모든 화면에서 Play Again 1클릭 가능.
- 960×540 기준과 좁은 브라우저 창 크기에서 Rank바·스킬 트리·Refinery의 가시성 확인. 일반 브라우저에서 실제 탭 전환은 수동 별도 확인.
- 성능: 기존 v0.9 baseline 대비 동일 장치·동일 workload tick P95 증가율과 파편/파동 cap 발생 원인을 보고한다. QA 데스크톱 20초 동안 평균 FPS 60 이상을 **성능 목표**로 두되, 하드웨어 조건/관측 방법도 명시한다.
- 사람 검증: 신규 도형 식별성, 클릭 우선순위 선택 변화, 각 빌드의 차별성, 다시 하고 싶은 정도(1~5), Rank 다음 목표의 이해, Refinery Skip 비율을 최소 5~10 Run 기록. 사람 재미 만족은 자동 QA PASS로 선언하지 않는다.

## 6. Codex 구현 순서 / 커밋 계획

| 단계 | 작업 패키지 | 선행 의존성 | 완료 조건 |
|---|---|---|---|
| 0 | Preflight + baseline snapshot | 없음 | 최신 HEAD·기준 94-test 결과 또는 실제 차이 설명; live save 보호 |
| M5-A | schema4 + Rank 정산 + UI | 0 | 정확한 Lifetime/Rank, v1-3 무손실, 정산1회 |
| M5-B | OreGrade + Catalyst + 보상 로그 | M5-A | 4등급 독립 추첨, Catalyst 1회 지급, 장식/전투 분리 |
| M5-C | 구매 조건 + Refinery/선택 경로 + 밸런스 계측 | M5-B | Rank/Catalyst/기존 스킬 보존, Fresh 50 Run 분석 |
| M6-A | Hex Shield + Shield Pocket + Tether Pair | M5-A | Ward·동적 충돌·타깃 우선순위 실제 동작 |
| M6-B | Reactor Node + Ancient Core | M6-A | 체력 단계 순차 효과·도형별 중복 보상 방지 |
| M6-C | 신규 8 Skill + 그래프/설명 | M5-C, M6-B | Skill 모두 실제 작동, 새로운 빌드 경로 최소3개 |
| M6-D | 통합 경제 재시뮬레이션 + 실제 브라우저 QA | 전부 | 테스트/스크린샷/보고서/결과 재현성 |

권장 작업 브랜치 `feat/m5-m6-progression-content`. **현재 v0.9의 최신 구현 브랜치를 실제 코드 기준**으로 사용하고, 문서 브랜치나 main의 구형 v0.7을 잘못 기준으로 시작하지 않는다. 이미 다른 사람 작업이 있으면 기존 작업을 덮어쓰지 않는다. 단계마다 테스트·원인 기록·커밋; 통합은 PR과 최종 보고서로 진행한다.

## 7. 범위 외 (M7/M8로 넘길 기능)

Prestige 강제 리셋, Artifact/Relic 장착·세트, 유료 확률형 상자/판매, 자동공격 전환, Sector 이동 화면, 서버 저장/계정 시스템, 복잡한 3D 물리, 엔진 교체, 멀티플레이는 **이번 M5/M6 범위에서 구현하지 않는다**. Ancient Core는 M6에 포함하지만 ‘보스전 전용 화면’은 만들지 않는다. M7에서 Relic/Prestige 필요성을 판단한다.

## 8. 최종 납품물 및 DoD

1. 플레이 가능한 수정 코드 + 단계별 커밋/PR + 변경 범위/새 실행 방법.
2. `docs/Shard_Storm_M5_M6_Implementation_Report.md`: 최종 확정 수치, Rank/스킬/보상 표, v0.9 비교, 수동 확인 필요 항목, 알려진 한계.
3. `artifacts/m5-m6-balance.json` 및 가독성 있는 1/3/5/10/20/30/50 Run 비교표; 테스트 로그 및 브라우저 캡처.
4. `README.md` 최신 상태, 마이그레이션, 경제/Skill/Rank 설명. `npm test`, `npm run benchmark`, `npm run benchmark:balance` 유지 또는 신규 명령 분명히 문서화.
5. 모든 신규 8스킬·3특수 도형·4OreGrade·Rank0~4·Catalyst·Refinery·데이터 저장/복구가 실제 플레이와 QA에서 작동할 것. P1/P2라고 미뤄 둔 과거 항목을 이번 구현 완료로 허위 보고하지 않는다.
6. 기존 클릭/홀드/드래그·4연쇄 안내·실제 순차 파동·20초 종료·스킬11종·최초 저장/정산 규칙의 회귀 테스트 통과.
7. 자동 QA는 통과하더라도 사람의 재미·반복 의욕은 아직 검증 전일 수 있다. 정확히 분리해 보고한다.

**완료 판단:** 20초 한 판의 밀도를 해치지 않고 5·20·50회 동안 기존 수치 성장에 더해 해금된 새 타깃·자원·스킬 조합을 실제로 경험할 수 있으며, 어느 저장 단계에서도 이중 지급이나 기존 진행 손실이 없다.