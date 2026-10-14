# Shard Storm v0.9 P0 구현·검증 보고서

기준 소스 `feat/v08-gameplay-depth`의 dbcc5d2. 명세는 `docs/v09-short-run-progression`에서 가져왔으며 구현 브랜치는 `feat/v09-short-run-progression`입니다. P0를 구현했고 P1/P2는 확장 범위로 남겼습니다.

## 구현 상태

| P0 | 구현 / 검증 |
| --- | --- |
| 20초 Run | 20/22/32초, Extra Time +2초×6, 한 타이머. 15/45/100/200/400/750 누적 해금, 기존 살아 있는 도형 보존, 새 종류 우선 보충. |
| Motion | Rotate35% / Drift25% / Both30% / Static10%. 결정적 motionSeed, 최대 변위6px(Star4px), 낮은 속도, 일시정지/토글 연속성, 첫 안내4연쇄 유지. |
| 충돌 | 현재 월드 좌표로 클릭·렌더. 이동 파편과 목표의 연속 경로에서 보수적 전진으로 최초 접촉 계산. 파동은 실제 접촉할 때만 예약. 고정 미래 위치 예약은 Motion OFF에서만 사용. |
| Refinery | Raw를10묶음으로 나누고5슬롯을 독립 RNG로 먼저 확정. rate .06, 가중 평균1.075, 마지막에 한 번 floor. 1.2초 연출 / Skip / 즉시 Play Again. |
| 저장 | 동일 키, schema3. v1/v2 은행·11레벨·기록·옵션 보존. pending 정산을 애니메이션 전에 저장하고 완료/Skip/새로고침/뒤로 가기에서 중복 지급 방지. |
| 경제 / 격리 | 기존 가격·성장1.6 유지. Fresh Lab과 테스트 재화/구매/정산은 메모리 복사본만 사용. legacy_tiers/v09_short 비교. |
| 기존 시간 스킬 | 레벨 보존, 60~90→20~32초 안내. 원하면 기존 Extra Time에 지불한 누적 비용만1회 환불. 실제 자동 초기화 없음. |

## 자동 테스트와 기준선

변경 전 npm test 70/70 PASS. 변경 후 94/94 PASS(기존70개+신규24개), 0 FAIL. 기존 테스트를 삭제하지 않았습니다. 이전 고정 물리·60초·티어 검사는 명시적 LegacyGame 비교 fixture에서 그대로 유지하며, 변경된 시간/티어/변환/모션은 신규 생산 Game 테스트로 별도 검증합니다. schema 기대값2→3과 기본 시간20/22/32 기대값은 명세 변경 때문에 갱신했습니다.

`npm run benchmark`: 기존 v0.8 60초 회귀18판 + 새20초 smoke2판 PASS. v0.8 Seed31415의 720파괴/13,625 Raw와 강화844/15,291은 기준선과 같습니다. `npm run benchmark:v08-balance`도 보존한 기존 전체 비교 PASS. `npm run benchmark:balance`: 새 비교150판, Utility35판, Fresh/Legacy 성장300판, 재현성1판 = 총486판 PASS. 모든 시드는 [31415,1,7,42,99].

입력은 모두 자동: 밀도/HP 점수로 목표를 선택하고 도출 스탯의 반복 간격을 사용합니다. 목표의 현재 월드 중심을 조준하는 동일 정책이며 Motion ON/OFF의 절대 조준 좌표는 달라집니다. v0.9 두 모드는 동일한 드리프트 안전 간격을 예약해 초기 배치 차이가 비교를 오염시키지 않도록 했습니다. 역사적 v0.8 ruleset만 원래 간격을 씁니다. 사람의 클릭 능력·재미·학습효과로 해석하지 않습니다.

## 기본 빌드 20초 비교 (5시드 중앙값)

| 조건 | 파괴 [범위] | Raw | Photon | 연쇄 % | 최고 Chain | cap | 스텝 P95 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| v08_20 | 208 [172~234] | 3287 | 3287 | 66.3 | 18 | 0 | 0.061 |
| v09_static | 162 [123~170] | 2260 | 140 | 52.8 | 10 | 0 | 0.027 |
| v09_motion | 149 [113~164] | 1942 | 122 | 49.0 | 10 | 0 | 0.060 |
| v09_no_refinery | 149 [113~164] | 1942 | 116 | 49.0 | 10 | 0 | 0.052 |
| v09_no_modifiers | 144 [122~151] | 1809 | 113 | 46.0 | 8 | 0 | 0.049 |
| v09_legacy_tiers | 183 [180~234] | 3162 | 206 | 62.8 | 17 | 0 | 0.063 |

v08_20은 시간만20으로 바꾼 기존 규칙이며 Raw가 곧 Photon인 비교용입니다. 나머지는 v0.9 변환을 사용합니다. v09_static↔v09_motion은 같은 초기 배치·티어·경제에서 움직임을 비교합니다. legacy_tiers 비교에도 v0.9의 안전 간격·정산·종료 보완이 적용되므로 역사적 v08_20과 완전 동일한 규칙은 아닙니다.

기존 v0.8 60초 기본 수익 중앙값13,466 Photon → 새20초 Motion ON 중앙값122 Photon. 시간·티어·안전 배치·변환이 함께 바뀐 결과입니다. 최초 가격을 ×6하거나 기존 구매를 초기화하지 않았습니다. Raw와 Photon을 별도 기록하며 과거 photonsEarned를 재가공하지 않습니다.

## Utility와 새 계정 성장

| 빌드 | 고정20초 Raw / Photon | 실제 시간 | 실제 Photon | 20초 정규화 Photon |
| --- | --- | --- | --- | --- |
| Baseline | 1942 / 122 | 20 | 122 | 122.0 |
| ExtraTime | 1942 / 122 | 22 | 159 | 144.5 |
| PhotonBoost | 2137 / 134 | 22 | 175 | 159.1 |
| UtilityMax | 2417 / 152 | 32 | 308 | 192.5 |

| 프로필 / 전략 | 1판 누적 구매Lv | 3판 | 5판 | 10판 | 10판 남은Lv |
| --- | --- | --- | --- | --- | --- |
| fresh / Crusher | 1 | 3 | 4 | 8 | 27 |
| fresh / Cascade | 1 | 2 | 3 | 7 | 28 |
| fresh / Reactor | 0 | 2 | 4 | 12 | 23 |
| legacy_max / Crusher | 0 | 0 | 0 | 0 | 0 |
| legacy_max / Cascade | 0 | 0 | 0 | 0 | 0 |
| legacy_max / Reactor | 0 | 0 | 0 | 0 | 0 |

구매 수는 노드 종류 수가 아니라 레벨 수(전체35)입니다. 전략은 선택한 가지를 먼저 강화하고 다음 목표의 비용을 모으는 정책입니다. Reactor의 첫 판0회는 130 Photon의 Chain Amplifier를 기다리는 선택이며, 싼 다른 노드 구매를 강제로 막은 결과가 아닙니다. 5판 뒤에도 대다수 레벨이 남습니다. 기존 올맥스 계정은 은행·레벨이 보존되며 P0의11노드에서는 새 구매가 없습니다. 그 계정의 장기 목표 해결은 P1의 Discovery/Ore/새 노드가 필요합니다.

## 충돌·성능 증거

자동 동적 비교의 파동 접촉 검사 9891회, 파편 접촉 검사 6265회. 최대 양의 접촉 거리 오차는 파동 9.997e-7px / 파편 9.992e-7px. 지연 파동 접촉 0회. 허용오차를 작게 둔 접촉 계산이며 화면 크기의 판정 후광을 추가하지 않았습니다.

샘플링한 순간 최대 이동속도 5.853px/s, 앵커 대비 최대 관측 변위 5.966px. 모션 프로필별 실제 생성 수·할당 회전속도 범위도 motionMeasurements에 기록합니다. maxMotionSpeed는 프로필 속도의 상한 계산값이며 maxObservedSpeed와 구분합니다.

이 값은 체크한 접촉의 위치 일치입니다. 모든 가능한 궤적에서 누락이 절대 없다는 증명은 아닙니다. 분석적 교차·접선·이동 타깃·보호시간·늦은 생성·겹친 파동·경계·종료·시드 사례를 단위 테스트로 함께 검사했습니다. 초당 파편 피크, missedClicks, projectileHitRate, 프로필, cap 종류와 skipped events를 원본 JSON에 보존했습니다. Renderer의 의도적 recoil/넉백 offset은 물리 중심에 중복 적용하지 않습니다.

## 실제 브라우저 QA (자동 포인터)

Chrome 154.0.8037.98, 20초 Run 4회. PASS, 콘솔/페이지 오류 0개. 직접 클릭·홀드·드래그, 구매·새로고침·Replay, Motion/Modifier/Refinery 비교, 실제 가공 중 새로고침 복구, 뒤로 가기, 기존v2 올맥스, 선택적 환불과 Fresh Lab 격리를 검사했습니다.

| Run | 파괴 | Raw → Photon | 평균 FPS | 고정틱 P95 ms | 정산 대기 초 |
| --- | --- | --- | --- | --- | --- |
| 01-baseline | 158 | 2112 → 139 | 129.5 | 0.200 | 0.169 |
| 02-upgraded | 163 | 2425 → 145 | 129.8 | 0.200 | 1.206 |
| 03-fresh-off | 150 | 2101 → 126 | 129.7 | 0.200 | 0.001 |
| 04-refresh-recovery | 200 | 2791 → 177 | 129.7 | 0.200 | 새로고침 복구 |

고정틱 P95는 브라우저 시뮬레이션 처리 시간이고 렌더링 FPS와 다른 지표입니다. 자동 비교의 simulationStepP95에는 타깃 선택도 포함됩니다. 정산 중 새로고침 사례는 기다린 시간을 추정해 채우지 않고 복구로 표시합니다. 결과 화면 전체 체류 시간은 Play Again을 누른 관측 사례만 기록했습니다. 실제 OS 탭 전환은 별도 수동 확인이 필요하며 모의 visibility handler 검사와 구분합니다.

## 검수 중 발견·수정한 문제

- 움직이는 대상에 기존 미래 파동 예약을 쓰면 위치가 어긋납니다. Motion ON에는 실제 최초 접촉을 쓰고, 토글로 ON 전환할 때도 기존 미래 예약을 취소·재평가합니다.
- OFF 비교에서 안전 간격이 달라 모션의 순수 효과와 배치 차이가 섞일 수 있었습니다. v0.9 두 모드의 초기 앵커를 동일하게 만들고5시드 검사했습니다.
- 새 종료 처리에서 마지막 틱의 종료 전 이벤트까지 버릴 수 있었습니다. 정확한 종료 직전은 처리하고 종료시각과 그 이후는 중단합니다. 가시 지연 건너뛰기는 지나간 피해를 재생하지 않습니다.
- 지연 통계가 Impact의 제외 대상과 최종 반경 밖 대상을 missed hit로 셀 수 있었습니다. 실제 도달 가능 범위·제외·보호시간을 확인해 고쳤습니다.
- 정산 중 실험 모드 진입이나 캐시된 결과 복귀가 이전 pending/은행을 다시 쓸 수 있어, 확정된 결과의 저장 ID 확인과 pageshow 복구를 연결했습니다.
- 신규 모션 badge의 회전, 스킬 구매 중 가공 상태, 결과 화면 최소 높이와 Replay 가시성을 확인·보완했습니다.

## 세이브와 남은 범위

bank/levels/bestStats/lastRuns/options는 보존합니다. schema3의 lifetimeDestroyed/totalRuns는 v0.9 정산 이후 실제 카운터이며, 과거20개 기록의 파괴 합계는 knownHistoryKills로 따로 둡니다. discoveryRank/catalystBalance는 P1 준비 필드0이며 해금·광석·촉매를 구현한 것으로 보고하지 않습니다. 실제 세이브 JSON 내보내기 버튼도 제공합니다.

P1: Discovery Rank0~2, Prism/Core·촉매, Refinery/Cascade/Destroy 신규5노드, Hex Shield/Reactor Node. P2: Rank3~4/Ancient Core, Cache/Relic. Prestige는 보류. 현재11노드 외 가짜 구매 버튼은 없습니다.

사람5~10판 체크: 20초 집중도/한 판 더 하고 싶은 정도, 회전·넉백 목표 클릭 실패, Triangle 발사 방향과 순차 파동 인과관계, 큰 콤보의 빈도·가독성, Refinery 기대감과 Skip 비율, 최초 구매1~3회와 5/10판 다음 목표. 기본 변환 .06과 슬롯은 유지했습니다. 사람이 첫 판130 미만으로 Reactor를 선택하지 못하는 빈도, Motion에서 최고 Chain이 낮아지는 정도를 먼저 관찰한 뒤 전환율/티어/해금 리듬을 한 변수씩 조정하세요.

이번 P0에서는 추가 Human Gate 결정이 필요하지 않았습니다. 20초·충돌 위치·schema3·정산·격리는 명세가 지정한 범위입니다. 신규 재료/노드의 실제 해금과 가격은 P1 작업으로 남겼습니다.

## 변경 파일 / 증거

| 파일 | 내용 |
| --- | --- |
| config.js / game.js | 20초/티어/모션·정산 설정, 실제 world pose, 동적 접촉, Raw/5초 로그, 종료·지연 처리 |
| motion.js / effects.js | 결정적 회전·드리프트, 연속 파편/원형 상대 경로 접촉 |
| refinery.js / progression.js / storage.js | 10토큰 가공 계획, 1회 정산·pending 복구, v1/v2→v3, 선택 환불 |
| app.js / renderer.js / index.html / style.css | Raw HUD, 같은 Result 내 Refinery/Skip/트리, Motion/Refinery 비교, Fresh Lab, 시간 안내·내보내기 |
| tests/helpers.js / 기존 *.test.js | 기존70개 정적 회귀 유지; 명세에 바뀐 버전·시간 기대값 갱신 |
| tests/v09.test.js / simulation.js / benchmark.js | 신규24개, 20초와 구형 규칙 비교, 접촉 오차 계측 |
| tests/v09-balance-benchmark.js / v08-balance-benchmark.js | 새486판 및 보존한 구형 경제 비교 |
| tests/v09-browser.mjs / v09-report.js / README / docs / artifacts | 브라우저4판, 저장·복구·UI 증거, 현재 수치·관측 한계 |

- [변경 전 기준](../artifacts/v09-before-v08.json), [94개 테스트](../artifacts/v09-unit-results.txt), [새 밸런스 원본](../artifacts/v09-balance-results.json), [브라우저 결과](../artifacts/v09-browser-results.json)
- [플레이](../artifacts/v09-01-baseline-playing.png), [Refinery](../artifacts/v09-01-baseline-refinery.png), [정산+스킬](../artifacts/v09-01-baseline-result.png), [새로고침 직전](../artifacts/v09-04-refresh-recovery-refinery.png)
