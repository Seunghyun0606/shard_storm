# M11 Collection & Advanced Shapes — Implementation Report

## 실제 구현

기존13종에 Portal Pair/Parasite Link/Phase Crystal/Chain Beacon/Shifter/Prism Lens를 추가해19종입니다. Polarized/Resonant/Time Locked/Fragmented로 secondary trait8종이며 기존primary와 독립된 stream/슬롯을 유지합니다. 기존20초 Run·클릭/홀드/드래그·순차 파편/파동·49스킬/100레벨·Signature10중3·Evolution15형태중2계열·Relic/Contract/Anomaly를 보존했습니다.

Portal은 pair 안전 배치 후 원자적으로 생성합니다. main당1회 통과, 남은 거리/lifetime 보존, 첫 Gate만 ore 추첨을 보장합니다. Parasite는 실제 양수 피해를 .04초 후 최대1HP×2로 복사하며 복사 피해는 재귀하지 않습니다. Phase는 게임 시계1.4초(.9/.5)와 실제 충돌 시점으로 판정하며 보호 중 direct0/non-direct≤1입니다. Beacon은 자신이 죽은 동일 Chain의 정상10킬일 때 .05초 후130px/피해2 파동을 발동합니다. Shifter는 .2초 예고,1.3초마다25~35px 안전 leap를 하며 이전 좌표의 ghost 충돌을 제거합니다. Lens는 실제 native Square/Star 접촉당 ±35도 sector2개를 최대2회 생성합니다. main의 정식 접촉 굴절과 M10 Prismatic Cascade를 별도로 연결했습니다. sector 반각12도는 PRD의 좁은 sector를 구현한 값이고 고비용 시각 굴절은 TODO입니다.

Codex19×4단계, 정상 사망·19고유 행동, 정산 후 순차 해금, unique insight≤19, 추적2개를 구현했습니다. II badge/IV 별칭·테두리는 코스메틱이고 재화를 지급하지 않습니다. Elite6종은 Rank/insight/Run Tier4와3% 적격 조건을 적용합니다. 한 Run1회, 전체 구성원 안전 배치 후 commit, primary HP×1.5 올림/Raw+50/Catalyst+3 정산1회입니다. 별도 전투 화면·라운드는 없습니다.

## 저장·정산

schema8은1~7의 은행·Catalyst·기존49레벨·Signature/Evolution·Relic·Contract·후보·기록·기존 pending을 보존합니다. 과거 Codex 카운트는 추정하지 않고 출시 후부터 집계한다고 UI에 표시합니다. 신규 delta를 pending에 동결하고 complete에서 정확히1회 확정합니다. 오래된 pending에 신규 보상을 소급 계산하지 않습니다. fixture/sandbox는 실제 세이브를 쓸 수 없습니다.

사용자 승인 A에 따라 shard-storm-v1 동일 키에 동기 UTF-8/LZ4/base64+길이/CRC32를 도입했습니다. 전체20최근 기록의 상세 이벤트를 삭제하지 않고 기존 plain JSON도 읽습니다. 손상/미래 schema/잘린 JSON은 원본을 보존하고 쓰기를 차단하며 원문 export를 제공합니다. [저장 결정과 증거](Shard_Storm_Save_Capacity_Decision.md).

## 변경 파일

- advanced-defs.js/advanced-shapes.js: 6종·4trait의 정의, 충돌·phase·link·sector·leap 실제 이벤트.
- codex.js/codex-ui.js/elites.js: 19행동 counter/76단계/2pin,6복합 encounter/원자적 배치/예산.
- game.js/effects.js/content.js/ecology.js/run-metrics.js: 생성·순차 collision·lineage·상한·계측 통합.
- config.js/storage.js/save-codec.js/progression.js: save8·동결 delta·기존 pending·동일 키 무손실 codec.
- app.js/renderer.js/index.html/style.css: 19도형 표현, Codex/Elite 탭, 결과 배너, pending 추적, 복구 원본 export.
- tests/m11*/save-codec*: 신규 단위/성장/Chrome/격리 성능/보고서. 과거 QA는 압축을 decode한 후 동일 assertion을 유지합니다.

## 검증과 스크린샷

전체 **307 PASS/0 FAIL**, 기존 테스트 삭제·skip 없음([로그](../artifacts/m11-unit-final-current.txt)). 신규 M11의63개 테스트는6도형/4trait/19기술 양성·음성/Elite6/마이그레이션/중복 정산/실제 M10 합성을 포함합니다. codec8개 테스트와 실제20 full record Chrome 저장/reload/원문 export/pending1회도 PASS입니다.

Chrome 155.0.8059.79 실제20초7Run(자연 fresh1+명시된 도형 fixture6), 실제 mouse click/hold/drag/Focus/620px Replay, Codex/Elite/49노드, 콘솔 오류0. 추가 실제 포인터로 Phase guard 직접0→취약 첫 타2(Reinforced)→다음3을 확인했습니다. Codex19badge/19title/19border는 획득을 주입한 표시용 fixture로 검증했으며 자연 성장 증거가 아닙니다.

[Portal](../artifacts/m11-portalGate-overview.png) · [Phase](../artifacts/m11-phaseCrystal-overview.png) · [Shifter](../artifacts/m11-shifter-overview.png) · [Prism](../artifacts/m11-prismLens-overview.png) · [Codex](../artifacts/m11-prismLens-codex.png) · [Elite](../artifacts/m11-elite-collection.png) · [Mastery 표시 fixture](../artifacts/m11-codex-mastery-fixture.png) · [620px 결과](../artifacts/m11-prismLens-narrow-result.png) · [저장 원본 보호](../artifacts/storage-recovery-original.png).

54,000Run/180경로와60강화 조합 FX A/B, 단독90Run 성능/OFF 정확 일치가 PASS입니다. [Balance Report](Shard_Storm_M11_Balance_Report.md)에 실제50/100/200/300 성장·자연 기술/Elite 빈도·상한·제한을 기록했습니다. 기존 회귀와 브라우저 재실행은 artifacts/m11-regression에 분리해 이전 보고서 증거를 덮어쓰지 않습니다.

현재 코드의 기존 benchmark20/기본 balance486/M5M6 1573/M7M8 650(230성장 smoke+420효과 비교)/M9 smoke165/M10 smoke240도 PASS입니다. 현재 Chrome 총28실제20초 Run은 M11 7+M9 5+M7M8 6+M10 6+M5M6 4이며 모두 콘솔 오류0입니다. [집계](../artifacts/m11-browser-qa-summary.json). M7/M8과 M5/M6의 과거19노드 기대값은49개와 기존19노드의 보존 검사로 갱신했습니다. M5/M6의 기존20개 선행 연결·구매·광석·FPS·Rank·새로고침 검사는 유지했습니다. 클릭 직후 wall-clock 응답에 의존하던 timer 검사는 실제 기본20초 설정·종료 시간을 직접 확인하도록 고쳤고 정산 검사는 유지했습니다. CSS960px 고정 검사는 확대된 화면에서 정확한 논리960×540 변환 검사로 갱신했습니다. 실패와 수정 후 결과를 함께 보존했습니다.

## 발견한 오류와 수정

복사 피해가 main의 small=false를 물려 Hollow에2피해를 주던 오류를 복사 최대1로 고쳤습니다. Phase 보호 direct0이 Reinforced 방어를 소모하지 않도록 판정 순서를 고쳤습니다. Shifter 전후 motion 구간을 분리해 teleport 중 허위 보간을 차단했습니다. Lens sector를 nativeWave로 잘못 세거나 실행하지 않은 파동을 Codex로 인정하지 않습니다. 길어진 기록의 실제 Chrome QuotaExceededError를 재현하고 승인된 전체 무손실 압축으로 해결했습니다.

## 남은 한계와 후속

기존512 tick iteration 상한과 유한 localStorage 할당량은 유지합니다. 자동 전투와 격리 fixture는 사람의 재미 검증이 아닙니다. 고비용 Bloom/Shader/도형별 조립 생성/진짜 물리 슬로모션/논리 Arena 확장/전용 audio는 [Deferred TODO](Shard_Storm_Deferred_VFX_TODO.md)로 남겼습니다. 사람은 목표 설명·조준 순서·희귀 기술 정체·빌드 교체 후 재도전 의향을 검증해야 합니다.

현재3% Elite 판정은 생성 시도마다 누적되므로 M11 전체 실험의 95.2% Run에 등장했습니다. 희귀성은 아직 밸런스 문제이며, 기존 경제와 함께 다음 실험 후보로 기록했습니다. 구현 동작 확인과 희귀함·장기 재미의 달성은 구분합니다.

실제 사용자 검증의 조건·질문·기록 표는 [사람 플레이 가이드](Shard_Storm_M9_M11_Human_Playtest.md)에 구분했습니다.

브랜치 feat/m9-m11-content-expansion. M11/codec 통합 커밋 d0834c5, 최종 QA와 보고서는 이후 커밋에 기록합니다.
