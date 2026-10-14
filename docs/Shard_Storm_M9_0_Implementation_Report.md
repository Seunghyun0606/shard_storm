# M9.0 Playfield & Feedback implementation

기준 M8 `7cc28670937b9a6598d839d46699e5c47e2da3ac`, 기획 브랜치 HEAD `f03d9ee9ceca6b270ba6f4da2c1dae00ceecf22d`. 원격 fetch, 6개 기획서 전체 및 기존 소스·보고서를 확인하고 `feat/m9-m11-content-expansion`에서 순서대로 개발합니다. 시작 시 미커밋 변경은 없었습니다. 기준선 커밋 `19c843e`는 실제153개 테스트, 기존 benchmark/486Run balance 및 실제 Chrome20초6Run을 기록합니다. 과거69,420Run은 이번 재실행 횟수에 포함하지 않습니다.

## 구현

- main1440px, 표시 field 최대1440px/Focus viewport fit. 논리960×540 및 arena32..928/78..512 보존. Focus는 CSS 방식이며 항상 EXIT FOCUS 버튼 노출. 작은 화면 TITLE/RESULT 스크롤과 sticky Replay 유지.
- ResizeObserver, resize/pageshow/visibility 복귀 시 DPR최대2 backing pixels 보정. 논리 포인터는 CSS rect를 기준으로 유지.
- Combo5/10/20은 상단 CHAIN HUD의 라벨·색을 바꾸고 도형 위 큰 배너/작은 콤보 문자 제거. 첫 클릭 가이드는 원형 강조로 유지. 계약/Anomaly/Rank/Catalyst는 y72 안전 영역.
- 실제 공격 결과의 hit/miss, 최종 사망, Reactor/Ancient 강조, Field Cleared. 표시는 별도 `CombatPresentation` 상태이며 RNG·피해·시계·정산 호출 없음. hit 최소120ms, 표시 사건32개, FieldClear220ms/쿨다운3s. 실제 마지막 도형 사망에서만 발생.
- spawn grace150ms 동안 alpha .15→1와 기존 scale 유지. 목표 윤곽과 hit 좌표는 보존하며 흔들림은 비상호작용 장식만 최대2 CSSpx/250ms 쿨다운. 이 방식은 시각적 조준 오차를 방지합니다.
- cosmetic pseudo slow는 입자 위치/잔상 render curve만 늦춤. simulation dt/스폰/파편/정산/시간 배율 변화 없음.
- CombatFX/Shake/ReducedMotion boolean 저장(schema5 유지). OS reduced-motion 우선. 개발자 옵션에서 토글; 기존 옵션·세이브 정상 병합.

## 검증

- `npm test`:159 PASS/0 FAIL(기존153+신규6). 5seed×4옵션의 실제20초/Rank4/기존MAX/2Relic/Anomaly 전투에서 kills/Raw/Catalyst/Chain/계약·Anomaly/접촉 결과 정확히 동일.
- `npm run benchmark`: PASS. 60초720/13625Raw,844/15291Raw;20초164/163Photon,193/174Photon 유지.
- `M7_RUNS=1 npm run benchmark:m7-m8`:650 실제Run(230개1Run 성장 smoke+420개효과비교) PASS. 전체300Run 재실행으로 보고하지 않음. 원본 `artifacts/m9-0-m7-m8-smoke-results.json`.
- `npm run qa:m9-0`: Chrome154.0.8037.98,6viewports×DPR1/2×Focus/Normal=24레이아웃; 실제20초4pointerRun, 중간resize/pause/hold/drag/reload/Skip/Replay 검증. console/page errors0. Rank4/MAX 및 Chain/FieldClear는 QA fixture이며 자연성장과 구분.
- `npm run qa:m7-m8`: 실제20초6Run 회귀 PASS. 신규 화면에서도 제작·장착·계약·성패·기존save복구·정산1회·620px Replay 보존.
- 화면을 직접 확인해 fixture 렌더가 앱 RAF에 덮이던 QA 버그를 고침. 상단 HUD 라벨 중복도 제거. [포인터 플레이](../artifacts/m9-0-rank4-playing.png), [결과](../artifacts/m9-0-fresh-result.png), [FieldClear fixture](../artifacts/m9-0-fixture-chain-field-clear.png).

## 경제·한계

밸런스 수치를 바꾸지 않았습니다. 시각효과 OFF와 ON의 수익·원인계측이 같으며 성장 속도/후기 재화 잉여 문제는 M8 분석 그대로입니다. CPU/P95는 실행 환경에 따라 변하며 동시 벤치마크의 값을 기기 전체 성능 보장으로 일반화하지 않습니다. 포인터 자동화는 사람의 타격감·멀미·재도전 의향 검증이 아닙니다. 사람 테스트: 넓어진 화면에서 타깃을 읽는가, Focus 결과 스크롤이 편한가, 흔들림/ReducedMotion 취향, 큰 연쇄를 상단 HUD만으로 인지하는가.

M9/M10/M11은 아직 별도 후속 개발 단계입니다. 이 보고서는 전체 완료 보고가 아닙니다. 고비용 보류 목록: [M9.0 Visual TODO](Shard_Storm_M9_0_Visual_TODO.md), [공통 Deferred TODO](Shard_Storm_Deferred_VFX_TODO.md).
