# Shard Storm M7 · M8 Implementation Report

PRD commit511c6d4840470ecd63312df7e200d33a421c7a76, 기준 M6 commit0c80bf3. docs/m7-m8-relic-contract-anomaly에서 feat/m7-m8-relic-contract-anomaly를 생성했습니다. 초기파일·원격fetch·문서전체·118개기준테스트를 확인한 후 구현했습니다.

## 기능 상태

- M7: 6Relic/2슬롯, 실제 정산 업적·Rank AND 해금, Photon+Catalyst 동시 제작, 영구소유, 장착/해제/교체/다음Run snapshot, 조건별 실제효과와 비용/패널티, 비차단 Blueprint 배너 구현·검증.
- M8 Contracts: 10종×3단계/활성3, 누적 정산·초과이월 없음·다음 단계 재수락·RESULT 포기·배지, 실제원인분류·각Chain 임계점1회·동일Ward 대상1회 구현·검증.
- M8 Anomalies: 6종/Normal/후보최대3, 저장seed+확정Run수+offerIndex, 소비는 정상시작 시점, 실제Run-local 움직임/밀도/변종/특수확률/Ward 규칙, 성공/실패/독립추가Photon 구현·검증.
- 저장: 동일shard-storm-v1/schema5, schema1..4의 정상재화/구매/기록/기존pending 보존. 신규업적은0부터이며 구20Run을 합산하지 않습니다. 신규 잘못된ID/중복/카운터만 정규화합니다. 정산계획·업적·계약·성공보상·Photon/Catalyst를한 pending object와 단일persist로 확정하며 animation/Skip/Replay/Refresh는 같은 계획을 사용합니다.
- 기존기능: 기본20초(ExtraTime최대32), 직접/홀드/드래그, 순차전파,7도형/19스킬/Modifier/Refinery/콤보, 실험 저장분리 보존.

## 커밋

```text
652fa5e style: separate contract titles, objectives and reward rows
68ca1b9 test: mark injected QA profiles and generate data-backed milestone reports
6607b0e test: protect checkpoint reuse with full physics and input dependency signature
6502ca9 test: verify physical chain15 completion and zero-bonus anomaly settlement
df00dd5 fix: display equipped relic damage in next-run preview
f194032 fix: refresh meta selections after reset and clarify result-only relic crafting
4561dc9 test: verify native wave ownership and existing M6 MAX growth profile
8a4594b fix: block relic reactivation throughout Ancient auxiliary lineage
af594a7 test: add resumable growth matrix, M6 parity profiling and real pointer meta-system QA
d29f47c feat: integrate ten staged contracts and six run-local anomalies with atomic rewards
e45288f feat: add schema5 relic ownership, six causal effects and two-slot loadout UI
7bef92e test: capture M6 baseline before M7 M8
```

문서/최종QA 아티팩트 커밋과 push는 최종 git log 및 사용자 보고에 포함합니다. 외부배포·데이터삭제는 수행하지 않았습니다.

## 주요파일

config.js(정확한테이블/schema), relics.js(소유/제작/통계), contracts.js(단계/계획), anomalies.js(제안/선택/규칙), run-metrics.js(실제원인/512로그상한), settlement-validation.js/progression.js/storage.js(원자적계획/저장/호환), game.js/content.js/effects.js(전투효과/정확한실행계측/보조파편재귀차단), app.js/relic-ui.js/meta-ui.js/index.html/style.css/renderer.js(START/RESULT/HUD), tests/m7-m8*.js/.mjs(단위/69,420Run/브라우저/성능/보고서), README/QA로그/스크린샷.

## 검증

- npm test: **153 PASS / 0 FAIL**, 기존118개 유지.6종실제Relic/5쌍조합/6종위험규칙및성패/10Contract×3단계/저장호환/원인계측/0초중단/정산복구/후보안정성.
- npm run benchmark: PASS, 기존60초 golden720/13625Raw 및844/15291 유지.20초 smoke164/163Photon 및193/174 유지.
- npm run benchmark:balance: PASS(기존486Run).
- npm run benchmark:m5-m6: PASS(기존1573Run); 정산성장1550Run 비교에서7개핵심파괴·경제필드 차이0, summary동일. 압축before/after 원본을별도보존하며 과거파일을덮어쓰지않았습니다.
- npm run benchmark:m7-m8: PASS, 69,420 실제Run; 모든경로300회를 실행. [경제보고서](Shard_Storm_M7_M8_Balance_Report.md).
- npm run qa:m7-m8: PASS, 실제 Chrome 154.0.8037.98, 분리된임시프로필, 20초6Run의 Normal/2Relic/성공/실패/Contract완료/schema4복구. 콘솔/page 오류0. 추가 UI20초 fixture는6개실제제작(4230Photon/86Catalyst), 장착중복차단/3계약/포기/재로드미차감을검증했습니다.
- 포인터는 page.mouse click/down/move/up이며 전투 직접 호출로 브라우저Run을 대체하지 않았습니다. 좁은620px에서Play Again/스크롤 접근 가능. Fresh Lab real save미수정. Rank4/제작조건/계약79 진행은 **fixture**, 자연 fresh해금과 구분합니다.

| 조건 | M6 P95 중앙값ms | M7M8 Normal P95 중앙값ms |
| --- | --- | --- |
| Rank0/0Lv | 0.1 | 0.1 |
| Rank4/50Lv | 0.23 | 0.23 |

5seed×2프로필×3반복×2버전=60Run, M6와무장OFF Normal의파괴/Raw/Refinery가동일합니다. 브라우저평균FPS 142.1; tickP95 범위 0.30~0.70ms. 성능은기기/헤드리스/백그라운드계측영향을받고 사람기기 전부를보장하지 않습니다. 실제contact error/late/duplicate counter는원본records에 있습니다.

## 스크린샷

[Fresh 결과](../artifacts/m7-m8-fresh-fresh-result.png) · [2Relic fixture](../artifacts/m7-m8-fixture-loadout-start.png) · [실제6개제작 fixture](../artifacts/m7-m8-fixture-crafted-six.png) · [Anomaly 성공](../artifacts/m7-m8-fixture-success-result.png) · [실패](../artifacts/m7-m8-fixture-failure-result.png) · [계약](../artifacts/m7-m8-fixture-contract-result.png) · [스킬](../artifacts/m7-m8-fixture-skills.png) · [좁은창](../artifacts/m7-m8-fixture-narrow.png).

## 발견·수정

Siphon 충전은 예약상한에 막힌 공격에서 소비하지 않도록 실제damage 실행으로이동. Anomaly 후보는정산후 totalRuns를반영하도록seedKey를검증. Ancient추가보조파편 lineage의 Relic 재발동차단태그를파편/고유/계승효과에전파. pending 계약완료목록의ID/단계/금액도계획과일치해야복구. 장착중복select항목비활성화로화면오해방지. unknown prototype ID는기존정상은행/레벨을보존하며무시. 테스트fixture의Rank4는실제lifetime8000을넣어마이그레이션원칙과일치시켰습니다.

## 한계와 사람 검증

실제사람의재도전의욕·위험이해·조건별조준은 아직 검증하지 않았습니다. 자동density정책은이미잘알고있는좌표를정확히공격하므로판별/이동조준난도를평가할수없습니다. 브라우저자동화의경제초기조건 fixture를실유저성장으로보고하지않습니다. 로컬저장은단일프로필persist의원자적계획이고외부편집/과거세이브복원까지서버로차단하는시스템은아닙니다. 여러탭동시플레이의최신상태병합을새서버/동기화구조로확장하지않았습니다.

사람5~10Run: 2슬롯의패널티를읽고조합을바꾸는가, Hex/Cracked/Reactor/Ancient를기존클릭대상보다먼저선택하는가, Normal선택이의도적인가, Anomaly실패에도기본정산을이해하는가, 결과화면수락/포기/다음목표가부담을늘리지않는가, 재시도점수1~5/Skip비율/결과체류시간을측정하세요. 초기/20/50/100/200/300성장은경제보고서와원본에서구분합니다. 미완료장기흥미를스킬가격인상·재화초기화로숨기지않았습니다.

추가 UI 수정: Crackling Edge 장착/해제 시 NEXT RUN 피해 표시를 Relic snapshot의 실제 피해 값으로 갱신합니다. 실제 포인터 QA에서 기본3→장착2 표시와 저장 후 복원을 확인했습니다. 초기화 버튼의 기존 사용자 확인은 유지하고, 확인 후 새 메타 화면도 갱신합니다. QA 과정에서 실제 사용자 초기화를 실행하지 않았습니다.

## 개별 콘텐츠 수락 상태

| Relic | Rank | 해금 카운터/목표 | 제작 Photon/Catalyst | 효과·기회비용 | 상태 |
| --- | --- | --- | --- | --- | --- |
| Ricochet Coil | 1 | mainShardWallBounces / 30 | 250 / 4 | 주 파편 반사 +1 · 거리 -40px (최소120) | 구현·검증 완료 |
| Wave Condenser | 1 | nativeWaveKills / 50 | 360 / 6 | Square/Star 고유 피해 +1 · 반경 ×.85 반올림 | 구현·검증 완료 |
| Crackling Edge | 1 | directCrackedKills / 30 | 420 / 10 | Cracked 직접 최종타 뒤 .03초 보조55px/1 · 직접 피해 -1 (최소1) | 구현·검증 완료 |
| Hex Siphon | 2 | wardReleasesFromHexDeath / 25 | 700 / 16 | Hex 해제 충전 최대2 · 다음 성공 직접 피해 +1 · 4초 만료/Run6소비 | 구현·검증 완료 |
| Reactor Governor | 3 | reactorStageWaveExecuted / 40 | 900 / 18 | Reactor 단계 피해 +1 · 지연 +.08초 (.11/.19초) | 구현·검증 완료 |
| Ancient Resonator | 4 | ancientKills / 4 | 1600 / 32 | Ancient 각 단계 보조 파편1 / 피해1 / 75px · 다른 도형 미적용 | 구현·검증 완료 |

| Contract | Rank | 실제 카운터 | Ⅰ/Ⅱ/Ⅲ 목표 | Ⅰ/Ⅱ/Ⅲ Photon | Ⅰ/Ⅱ/Ⅲ Catalyst | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| Precision Duty | 0 | directKills | 80/160/320 | 75/112/150 | 0/0/0 | 구현·검증 완료 |
| Chain Hunter | 0 | chain10 | 5/10/20 | 100/150/200 | 0/0/0 | 구현·검증 완료 |
| Fragment Route | 1 | primaryShardKills | 90/180/360 | 130/195/260 | 0/0/0 | 구현·검증 완료 |
| Wave Tactic | 1 | nativeWaveKills | 80/160/320 | 120/180/240 | 0/0/0 | 구현·검증 완료 |
| Crackdown | 1 | directCrackedKills | 25/50/100 | 110/165/220 | 0/0/0 | 구현·검증 완료 |
| Hex Liberator | 2 | wardReleasesFromHexDeath | 18/36/72 | 175/262/350 | 2/4/6 | 구현·검증 완료 |
| Core Collector | 2 | coreOreKills | 12/24/48 | 145/217/290 | 2/4/6 | 구현·검증 완료 |
| Reactor Engineer | 3 | reactorStageWaveExecuted | 25/50/100 | 200/300/400 | 3/6/9 | 구현·검증 완료 |
| Anomaly Pilot | 2 | anomalyWins | 4/8/16 | 180/270/360 | 2/4/6 | 구현·검증 완료 |
| Ancient Hunter | 4 | ancientKills | 3/6/12 | 280/420/560 | 6/12/18 | 구현·검증 완료 |

| Anomaly | Rank | 전투·성공 조건 | 보너스 | 상태 |
| --- | --- | --- | --- | --- |
| Fast Orbit | 0 | 드리프트/회전 속도 ×1.5 (기존 상한) · 움직이는 도형 직접12파괴 | 10%/최대60 | 규칙·성공·실패 검증 완료 |
| Dense Field | 0 | Tier 밀도 ×1.20 (최대32) · 한 Chain15 달성 | 8%/최대60 | 규칙·성공·실패 검증 완료 |
| Fragile Matter | 1 | 비Enhanced Cracked +8%p · Cracked 직접6파괴 | 10%/최대60 | 규칙·성공·실패 검증 완료 |
| Overcharge | 1 | Charged 확률 ×1.75/상한2 · Rank3 Reactor ×1.5 · Charged/Reactor3파괴 | 11%/최대60 | 규칙·성공·실패 검증 완료 |
| Fortified | 2 | Hex 확률 +4%p · Ward 피해감소2 · Hex 사망 Ward2해제 | 12%/최대60 | 규칙·성공·실패 검증 완료 |
| Unstable Core | 3 | Reactor ×1.5/Rank4 Ancient ×3 (상한 유지) · 실제 Reactor파동3 또는 Ancient1파괴 | 15%/최대60 | 규칙·성공·실패 검증 완료 |

자동 비교의 실패율은 구현 실패와 구분합니다. Dense Field의 자연 자동60회 실패와 강제 물리 fixture 성공은 경제 보고서에 함께 기록했습니다. 인간의 목표 달성 난도는 아직 검증하지 않았습니다.

실험 캐시 서명: bd32fcaae200380dff3f0bb8d1fc354f89ff85bb597b2844d0574665d022230e. 전투·물리·경제·저장 기본값·입력 정책의23개 의존 파일을 포함하며 줄바꿈을 정규화합니다. 이 정확한 서명에만 기존 fcc4754bea2b 기록을 호환 재사용합니다. 마지막 검증 명령은 완료된230개 성장 경로를 재사용하고420개 효과 비교를 다시 실행했습니다. 캐시의69,000회와 효과420회가 데이터셋69,420회입니다. native emitter ID의 순수 진단 태그만 집계 서명에서 제외하며, 해당 필드의 실제 소유권은 별도 단위 테스트로 확인했습니다.
