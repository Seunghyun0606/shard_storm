# M10 Skill Expansion — Implementation Report

## 구현 상태

49개 노드/100개 구매 레벨(기존19+신규30), Signature10종 중 최대3개, Evolution5계열×3형태 중 최대2계열을 연결했습니다. 구매와 활성화는 별도이며 미소유 자동 장착은 없습니다. 기존 가격·스킬·세이브를 보존했습니다. schema1~6→7에서 신규 영역만 정규화하고 pending 정산은 재계산하지 않습니다.

## 핵심 변경 파일

- expansion-defs.js/builds.js/build-ui.js: 정의·가격·선행조건·소유·활성 슬롯·프리셋·UI.
- expansion.js/game.js/content.js/ecology.js/effects.js: 신규30 실제 전투·경제 발동, 벽 접촉 시점 분할, 정확한 lineage·실행 카운터·중복 방지,15 Form 합성.
- config.js/storage.js/progression.js/settlement-validation.js: schema7과 기존 pending 보존, Refinery Calibration 별도 가산·검증·1회 정산.
- app.js/index.html/renderer.js/skill-tree.js/style.css: 49노드 그래프, 검색·분기, 활성 표시, 레벨 전후 효과,620px/Focus UI.
- tests/m10*:30능력·15형태·저장·슬롯·정산·A안 테스트,240경로 성장,200Run Form 비교, 실제 Chrome QA.

## 검증

단위 **236 PASS / 0 FAIL / 삭제·skip 없음** ([로그](../artifacts/m10-unit-final.txt)). Chrome 155.0.8059.79 실제20초6Run PASS, 콘솔 오류0 ([결과](../artifacts/m10-browser-results.json)). Fresh만 자연 계정이고 나머지 빌드는 명시된 격리 fixture입니다. 전체 성장72000Run과 Form 비교200Run PASS. 기존 benchmark(legacy18+short2), balance486Run, M5/M6 1573Run, M7/M8 650Run(230성장 smoke+420효과 A/B), M9 165Run smoke PASS. 이전 마일스톤의 전체 장기 결과는 별도로 보존했습니다. M11 통합 후 전체307단위와 현재 코드의 M10 포인터6Run 회귀도 PASS이며 artifacts/m11-regression에 구분했습니다.

스크린샷: [49노드](../artifacts/m10-49-skill-tree.png), [검색](../artifacts/m10-skill-search.png), [빌드 슬롯](../artifacts/m10-signature-evolution-title.png), [좁은 결과 화면](../artifacts/m10-Signature3-narrow-result.png). 검색 결과가 그래프 아래에서 잘리던 문제를 compact 배치로 수정했습니다.

## 확인·수정한 문제

원래 Catalyst Extraction 조건은 매 클릭 새 Chain을 만드는 전투와 충돌했습니다. [사용자 승인 A안](Shard_Storm_M10_Rule_Decision.md)을 실제 Game.attack과 이후 Reactor 연쇄로 검증했습니다. 다른 Chain/Echo/기한 이후 지급은 없습니다. 사전 벽 미리보기로 Momentum을 너무 일찍 발동하지 않도록 실제 벽 접촉에서만 처리했습니다. 보조 proc의 native/stage 분류와 Relic 재귀 플래그, 방어 보너스의 공유 cause 잔존, Ancient 다중 문턱을 수정했습니다.

## 남은 범위

고비용 전용VFX·Shader·물리 slow motion은 Deferred TODO입니다. M11 Portal/Phase/Prism의 추가 연동·Codex·Elite는 M11 보고서에서 검증합니다. 자동 QA는 사람의 재미나 장기 유지 시간을 입증하지 않습니다. 브랜치 feat/m9-m11-content-expansion, 전투 통합 커밋2f75e4f. 경제 수치는 [Balance Report](Shard_Storm_M10_Balance_Report.md)를 참조하세요.
