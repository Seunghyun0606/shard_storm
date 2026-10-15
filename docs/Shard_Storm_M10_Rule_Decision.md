# M10 Catalyst Extraction — 구현 전 규칙 확인

상태: **2026-10-15 사용자가 A안을 승인했습니다.** Hex/Reactor 직접 최종타로 시작한 동일 Chain이 이후 일반10킬을 달성할 때 Catalyst1을 지급합니다. 기존 클릭별 Chain 분리, Echo 제외, 레벨별 Run 상한1/2와 정산1회를 유지합니다. 아래 비교표는 결정 당시의 검토 기록입니다.

## 명세와 실제 전투의 충돌

[M10 PRD §1.5](Shard_Storm_M10_Skill_Expansion_PRD_v1.0.md)의 조건은 `Chain≥10인 Hex/Reactor 직접 kill 때 Catalyst+1, Run≤1→2`입니다. 기존 `Game.attack()`은 매 클릭마다 `newChain()`을 호출하고 직접 피해를 즉시 `flush()`합니다. 직접 최종타 시점에는 새 Chain의 일반 파괴 수가 1입니다. 이전 클릭의 Chain10은 다른 Chain이므로 이 조건에 합산할 수 없습니다.

실제 `Game.attack`을 사용하는 격리 재현: `node tests/m10-extraction-repro.mjs`. [원본 결과](../artifacts/m10-extraction-rule-conflict.json)에서 이전 Chain1은 일반10킬, Hex 직접 최종타는 새 Chain2의 일반1킬입니다. 화면 연쇄를 합치거나 Echo를 포함해 조건을 꾸미지 않았습니다.

새 테스트 초안에서 같은 chainId로 직접 피해를 여러 번 넣는 fixture는 일반 플레이의 이 문제를 입증하지 못합니다. 따라서 해당 초안은 통합 QA 완료 근거가 아닙니다. 신규30스킬 실발동 완료로 보고하지 않습니다.

## 선택 가능한 두 안

| 선택 | 실제 규칙 | 유지·변경되는 의미 |
|---|---|---|
| A · 권장 | Hex/Reactor를 직접 처치해 시작한 **그 Chain**이 이후 일반10킬을 달성하면 Catalyst1을 예약 지급 | 직접 처치 조건과 클릭별 Chain 분리를 유지. 지급 판정을 직접 사망 순간에서 동일 Chain의 이후10킬 달성 순간으로 연기 |
| B | Hex/Reactor 최종타 때 **그 Chain**이 일반10킬 이상이면 직접·연쇄를 모두 허용해 지급 | 사망 시점 판정을 유지. 직접 최종타 전용 조건을 연쇄 최종타까지 확대 |

두 안 모두 가격850 Photon/Catalyst8, 레벨별 Run 지급 상한1/2, Echo 제외, 시한 이후 무효, pending 정산1회 및 sandbox 격리를 유지합니다. 다른 Chain의 파괴 수를 합산하지 않습니다. A라면 동일 직접-origin Chain이 종료되기 전10킬을 달성하지 못했을 때 지급하지 않습니다.

## 통합 후 검증 (2026-10-15)

사용자 승인 A안을 실제 Game.attack 경로에 연결했습니다. 직접 Reactor 처치로 시작한 동일 Chain의 이후 정상10킬 지급, 서로 다른 Chain/Echo/시한 이후 배제, Run 상한1/2 및 중복 정산 방지를 자동 테스트로 검증했습니다. 현재 schema7, 49노드/100레벨, Signature10종 중3개, Evolution15형태 중2계열이 실제 플레이에 연결되어 있습니다. 단위236PASS, Chrome6개20초Run PASS/콘솔오류0, 15형태 비교200Run PASS입니다. 240경로×300Run 경제 비교는 별도 실행 중이며 완료 전 결과를 완료 근거로 사용하지 않습니다.

## 결정 전 준비 기록 (아래는 과거 상태)

M10의 `expansion-defs.js`, `builds.js`, `expansion.js`, `build-ui.js`와 테스트·benchmark·브라우저 스크립트는 **연결 전 초안**입니다. CONFIG·Game·저장은 아직 M9/schema6이며 신규 모듈을 import하지 않습니다. Evolution15형태 비용/소유/중복/슬롯의 순수 상태 검사는 통과했지만30종 전투·schema7·49node UI·성장 실험·브라우저 QA는 미검증입니다.

선택 후에는 이 문서에 결정을 기록하고 기존 M9 기준선을 보존한 다음, Game 이벤트/정확한 벽 반사/전도/Fuse/모션/Refinery·정산에 M10 모듈을 연결합니다. 직접 `Game.attack`으로 Catalyst 조건의 실제 양성·음성 사례를 검증해야 합니다. 일반 회귀의19스킬 fixture를 신규49스킬 MAX로 바꾸지 않습니다. M10 완료 검증·커밋 후 M11 전체 범위를 계속 진행합니다.
