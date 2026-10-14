# Shard Storm M5·M6 구현 보고서

브랜치 `feat/m5-m6-progression`, 기준 `f90d7de`. 명세 전체를 읽고 v0.9의20초·직접/홀드/드래그·순차 효과·기존11스킬·Modifier·세이브·콤보를 유지하며 확장했습니다. M5와 M6의 기능을 구현했습니다. 자동 성장의50판 소진 목표는 미달이며 사람 재미는 검증 전입니다.

## 기능과 검증

| 기능 | 상태 |
| --- | --- |
| Rank0~4 | 정산에서만 정확한 lifetime 갱신, 임계값 테스트, Welcome 다음 적격 Run, 진행바·해금문턱 |
| Schema4 | 1/2/3/4 로드, 새8노드0, 정상 보유 은행·레벨·환불권·기록·옵션 보존, 과거 기록 별도 |
| Ore/Catalyst | 독립 RNG, Common/Prism/Core/Void, 마지막 파괴1회, 직접/파편/파동 동일, pending→정산 |
| Refinery | 기존 .06/10토큰·슬롯, Yield 원래/실제 배율 로그, 1.2초/Skip/새로고침 동등 지급 |
| 구매 | RESULT 정산 후 Rank·선행·Photon·Catalyst 동시 확인/차감, 실패 시 보존,19노드 |
| Hex | HP8/bonus20, Ward2개/85px, 피해-1, 최초장갑, .03 해제650px/s, .25 안전 해제 |
| Reactor | HP12/bonus35, HP6 .03초75px/2, 죽음 .11초110px/3,각각1회 |
| Ancient | HP30/bonus120, HP22/15/7 단계별.03초 파편2/1/90px+파동60/1, 최종Catalyst2 |
| 배치/모션 | Shield Pocket/Tether Pair≤8% 추첨, 안전 실패 폴백, 물리 pose로 클릭·연속 충돌 |
| 신규8스킬 | 전부 실제 효과 단위 및 합성/재귀/상한 검사, 고급 실제 파동 접촉에서 Resonance/Channel 검증 |

## 신규 스킬 확정값

| 스킬 | Rank | Photon 최초 | Catalyst/Lv | 선행 | MAX 효과 |
| --- | --- | --- | --- | --- | --- |
| Precision Fracture | 1 | 180 | 0/0 | crushPower Lv2 | Cracked 직접 최종타: Raw +20 · 파편 3개 / 피해1 / 60px · 재유발 없음 |
| Fragment Relay | 2 | 520 | 4/6 | shardPower Lv2 | 주 파편 최종타: 피해2 / 90px · 최대4/Chain · 재귀/반사 없음 |
| Kinetic Reach | 2 | 420 | 2/3 | shardRange Lv1 | 회전 원본 주 파편 거리 +60px · 추적/파동 미적용 |
| Resonance Layer | 3 | 650 | 6/8 | chainAmplifier Lv2 | Reactor→Charged: .08초 뒤 피해1 / 60px · 최대2/파동 · 재귀 없음 |
| Salvage Scanner | 3 | 700 | 6/8 | photonBoost Lv1 | 첫1초 희귀 강조 · Core +1%p · Rank4 Void +0.2%p |
| Yield Stabilizer | 1 | 220 | 0/0 | 없음 | 원래 ×.8→1 / ×1→1.1 |
| Rare Separator | 2 | 350 | 2/4 | yieldStabilizer Lv1 | Core Raw +80 · 첫 Core 추가 Catalyst 1/Run |
| Catalyst Channel | 4 | 1400 | 24 | rareSeparator Lv1 + resonanceLayer Lv1 | Ancient당 최초2 일반 도형 표식1초 · 직접 파괴 파편2/피해1/70px · 재귀 없음 |

## QA

시작94개 → 현재118개 PASS /0FAIL. 기존 테스트 삭제 없음. schema 기대값3→4, 전체 노드11→19만 계약 변경에 맞춰 갱신했습니다. npm test / npm run benchmark / npm run benchmark:balance PASS. benchmark:m5-m6 1573 Run PASS. qa:m5-m6 Chrome20초4Run PASS, 콘솔 오류0.

기존 v0.9 실제 포인터 회귀도 PASS: 추가20초4Run, v2은행/기존11레벨/ExtraTime32초·1회 격리 환불·정산 새로고침·Back·Fresh Lab·모션 일시정지. 트리19/edge20와 schema4만 현재 계약에 맞췄으며 이전 기능 검사를 제거하지 않았습니다. [회귀 결과](../artifacts/m5-m6-v09-browser-results.json).

동적 접촉·시간 종료·효과/보상 1회·신규8능력·신규3타깃·구매 실패·Raw 합계·격리 저장을 검사합니다. 결과 화면의 Rank·트리·Refinery와 Replay가 같은 화면에 남습니다. 실제 사용자 저장소는 열거나 초기화하지 않았습니다.

## 발견·수정

- 결과창 높이를 늘리자 CSS aspect-ratio가 폭까지 늘려 왼쪽을 잘랐습니다. arena 폭100%를 명시하고 좁은창/실제 DOM 경계와 스크린샷을 확인했습니다.
- Kinetic Reach가 최대 Range에서 기존 .5초 수명에 잘려 +60px를 다 이동하지 못했습니다. 해당 주 파편만 거리 기반 수명을 적용하고390px 테스트를 추가했습니다.
- Tether 후보 중 두 번째 안전 배치가 실패하면 첫 도형이 고정되어 남을 수 있었습니다. 기존 정상 모션으로 폴백합니다.
- Ancient의0px drift에도 일반 여유12px와 명목 크기를 더해60px 파동이 안전한 이웃에 닿기 어려웠습니다. 특수 도형 주변은 실제 판정 반경·각 도형 drift·앵커 간격을 사용하고 실제 spawn 정책의 Channel 접촉 테스트를 추가했습니다.
- 가시 지연으로 Ward 해제 이벤트가 건너뛰어져도 .25초 안전 참조를 즉시 정리합니다.
- 브라우저 검수의 FPS 필드명/고정틱 ceil 계산 오류를 수정했습니다. 게임 테스트를 약화시키지 않았습니다.
- 촬영으로 pointerleave가 발생해 공격이 중단되는 QA 드라이버 문제를 수정하고 새 도형의 실제 직접 피격 수를 검사했습니다.

## 단계 커밋

```text
81559ce test: capture v0.9 baseline and 50-run progression before M5 M6
48d4135 feat: add schema4 discovery progression and atomic catalyst settlement
d22d213 feat: add independent ore grades and destruction reward accounting
c7f5d8f feat: integrate rank and catalyst skill costs with stabilized refinery and growth instrumentation
2b365ec feat: implement Hex wards, timed release, shield pockets and opposed tether motion
fe490da feat: add sequential Reactor and Ancient health-stage effects and rewards
070a901 feat: implement all eight progression skills with bounded causal effects
cac63f4 feat: integrate discovery goals, ore identities and catalyst purchase UI with browser QA
d2921ae fix: validate Ancient contact spacing and preserve full-range conditional skill effects
b7ec32f test: validate M5 M6 growth, eight browser runs and save compatibility
```

이후 최종 QA/보고서 커밋은 git log와 원격 브랜치에서 확인할 수 있습니다. 모든 단계는 origin/feat/m5-m6-progression에 푸시합니다.

## 파일과 증거

- config.js / discovery.js / storage.js / progression.js: Rank,19스킬, 확률·한도 설정, schema4/정산/구매.
- ore.js / content.js / game.js / motion.js / effects.js(기존 사용): 광석 보상·특수 메커니즘·조건부 능력·모션/충돌.
- refinery.js / economy.js: 원래 슬롯을 보존한 효율·Catalyst 가격/격리.
- app.js / renderer.js / index.html / style.css / skill-tree.js: 목표·희귀 아이콘·특수 도형·확장 트리·동일 결과 흐름.
- tests/m5-m6*.js, *.mjs / artifacts: 기준1500판, 새1573판, 브라우저·합성 테스트, 결과 로그.
- README와 구현/밸런스 보고서: 실행·비교·남은 한계.

- [밸런스 보고서](Shard_Storm_M5_M6_Balance_Report.md) · [50판 데이터](../artifacts/m5-m6-balance.json) · [단위 테스트](../artifacts/m5-m6-unit-results.txt) · [브라우저 결과](../artifacts/m5-m6-browser-results.json)
- [Hex](../artifacts/m5-m6-rank2-hex.png) · [Reactor](../artifacts/m5-m6-rank3-reactor.png) · [Ancient](../artifacts/m5-m6-rank4-ancient.png) · [Refinery 가지](../artifacts/m5-m6-skills-refinery.png) · [하단 스킬](../artifacts/m5-m6-skills-lower.png) · [좁은창](../artifacts/m5-m6-narrow-result.png)

## 남은 제한

확인된 저장 손실·중복 지급·유령 피해는 없습니다. 자동 모든 경로의50판 내MAX, 후반 Catalyst 잉여, 일부 낮은 슬롯/희귀 드롭의 변동성과 고정시드 편향을 밸런스 미달·제한으로 기록합니다. 실제 사람의 재미·장기 재도전은 아직 미검증입니다. 브라우저 계정은 로컬 저장이며 여러 탭/기기 동시 편집용 서버 동기화는 범위 밖입니다. M7 Prestige/Artifact/Relic을 이번 완료 기능으로 보고하지 않습니다.
