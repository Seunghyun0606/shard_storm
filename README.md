# Shard Storm — M9.0~M11

M9.0~M11의 기능 구현과 자동 QA를 완료했습니다. **19도형(신규12)·secondary trait8종·49스킬(신규30)/100레벨·Signature10종 중3개·Evolution15형태 중2계열·Codex19종×4단계·Elite6종·schema8**입니다. 기존20초 Run·클릭/홀드/드래그·primary Modifier3종·Relic/Contract/Anomaly·재화·구매 레벨을 보존합니다.

전체 **307 PASS/0 FAIL/skip0**. 기존 benchmark·balance·M5/M6 및 M7/M8/M9/M10 회귀를 통과했습니다. 현재 통합 코드의 실제 Chrome20초 포인터 검증은 **28 Run/콘솔 오류0**입니다. M9 성장38,250 Run, M10 **72,000 Run/240경로**, M11 **54,000 Run/180경로**를 완료했습니다. M10 Form 비교200 Run, M11 강화 조합 FX ON/OFF60 Run, 별도 단독 CPU 비교 M10/M11 각90 Run도 PASS입니다. [검증 자료 색인](artifacts/M9_M11_Evidence_Index.md), [현재 Chrome 집계](artifacts/m11-browser-qa-summary.json).

|단계|구현|전투 통합 커밋|보고서|
|---|---|---|---|
|M9.0|확대 화면/Focus/DPR/타격감/Reduced Motion|ab47fbc|[Implementation](docs/Shard_Storm_M9_0_Implementation_Report.md) · [Balance](docs/Shard_Storm_M9_0_Balance_Report.md)|
|M9|신규6도형/4trait/4배치/발견/schema6|17dcc954|[Implementation](docs/Shard_Storm_M9_Implementation_Report.md) · [Balance](docs/Shard_Storm_M9_Balance_Report.md)|
|M10|신규30스킬/Signature/Evolution/검색/schema7|2f75e4f|[Implementation](docs/Shard_Storm_M10_Implementation_Report.md) · [Balance](docs/Shard_Storm_M10_Balance_Report.md)|
|M11|신규6도형/4trait/Codex/Elite/schema8/무손실 저장|d0834c5|[Implementation](docs/Shard_Storm_M11_Implementation_Report.md) · [Balance](docs/Shard_Storm_M11_Balance_Report.md)|

Codex/Elite는 TITLE/RESULT의 CODEX 패널에서 확인하고 최대2개 과제를 추적합니다. Signature/Evolution은 소유와 활성화를 분리하며 정산 후 교체합니다. 신규6종 Portal Pair/Parasite Link/Phase Crystal/Chain Beacon/Shifter/Prism Lens는 기존 Arena에 혼합 등장합니다. [Codex 화면](artifacts/m11-prismLens-codex.png) · [Elite](artifacts/m11-elite-collection.png) · [49노드](artifacts/m10-49-skill-tree.png) · [620px Replay](artifacts/m11-prismLens-narrow-result.png).

같은 `shard-storm-v1` 키를 유지하며 schema1~7을 읽습니다. 사용자 승인 A에 따라 전체 최근20기록을 UTF-8/LZ4/base64+길이/CRC32로 무손실 저장합니다. 기존20기록7.83MB→1.92MB, 현재 MAX32초20기록10.30MB→2.66MB로 압축한 뒤 실제 Chrome 저장·새로고침2회·전체 기록 해시 동일성을 확인했습니다. 손상된 원본은 보존하고 내보낼 수 있습니다. [저장 검증](docs/Shard_Storm_Save_Capacity_Decision.md), [승인된 Catalyst Extraction 규칙](docs/Shard_Storm_M10_Rule_Decision.md).

실행: `npm start` → http://127.0.0.1:4173. 별도 터미널에서 다음 명령을 실행합니다.

```powershell
npm test
npm run benchmark
npm run benchmark:balance
npm run benchmark:m5-m6
$env:M7_RUNS='1' # 회귀 smoke; 과거 전체300Run 결과와 구분
npm run benchmark:m7-m8
$env:CONTENT_WORKERS='6'
npm run benchmark:m9
npm run benchmark:m10
npm run benchmark:m11
$env:PLAYWRIGHT_MODULE=Join-Path $env:TEMP 'shard-storm-qa/node_modules/playwright'
$env:QA_BASE_URL='http://127.0.0.1:4173'
npm run qa:m9-0
npm run qa:m9
npm run qa:m10
npm run qa:m11
npm run qa:storage
npm run qa:storage:current
```

Playwright 설치가 필요하면 앱 밖에 `npm install --prefix "$env:TEMP/shard-storm-qa" playwright`를 사용합니다. QA는 설치된 Chrome과 별도 임시 context를 사용합니다. 전체 성장 실험은 CPU 시간이 필요하며 소스 서명이 같은 경로별 gzip 체크포인트에서 재개합니다. `M10_RUNS=1`/`M11_RUNS=1`은 별도의 smoke 결과이며 전체300Run 검증을 대신하지 않습니다. 단독 CPU 측정은 모든 성장 worker 종료 후 수행했으며 브라우저 FPS와 구분합니다.

현재 M11 Normal 자동 성장(구매에 따라20~32초)의 시드5개 중앙값을3빌드로 비교하면 다음과 같습니다. 실제 사람의 성장 속도나 재미를 뜻하지 않습니다.

|Run|구매 레벨|Photon 잔고|기술 insight|
|---|---:|---:|---:|
|50|78~82|119~252|16~17|
|100|100|2,912~5,922|17~18|
|200|100|116,651~123,917|17~18|
|300|100|232,723~241,473|18~19|

기존 가격·기본 Refinery .06·기본 생성 .20초×3은 유지했습니다. 알려진 밸런스 문제는100레벨 구매 소진 후 재화 잉여와 Elite 빈도입니다. 현재3%는 적격 생성 시도마다 누적되어 M11 전체13,500 Run 중12,847회(95.2%) 등장했습니다. Run당1회 상한과 보상1회 처리는 지켰으나 희귀성은 후속 비교가 필요합니다. 기존512 iteration/tick 상한에서 남은 물리가 생략될 수 있는 제한도 보고서에 공개했습니다.

사람이 검증할 항목은 타깃 우선순위·Phase 타이밍·Portal/Prism 조준·Pentagon 같은 고유 기술의 접근성·빌드 교체 후 재도전 이유입니다. [사람 플레이 가이드](docs/Shard_Storm_M9_M11_Human_Playtest.md). Shader/Bloom/정교한 생성 연출/진짜 물리 slow motion/논리 Arena 확대/전용 audio는 [Deferred TODO](docs/Shard_Storm_Deferred_VFX_TODO.md)로 유지합니다. [단계별 작업 기록](docs/Shard_Storm_M9_M11_Work_Log.md).

## 과거 M9 검증 기록 (아래 수치는 당시 기준)

- FOCUS toggles a viewport-sized field; logical coordinates remain960x540. Backing resolution follows CSS/DPR up to2. DEV options include Combat FX/Shake/Reduced Motion.
- New shapes: Splitter/Fuse Bomb/Conductor/Mirror/Gravity Well/Repair Node. The collapsible Shape Ecology guide explains each mechanic. Echo contributes only to visible combos, with0Raw/no permanent or reward-objective progress.
- `npm run qa:m9-0`, `npm run qa:m9`, `npm run benchmark:m9`. `CONTENT_WORKERS` sets benchmark processes. Per-path source-hashed gzip checkpoints support resume; short `CONTENT_RUNS` smoke data is never reported as full300Run validation.
- Adaptive.18/.16 spawning is available only in isolated experiments. Normal spawning and prices remain unchanged.
- [Resume work log](docs/Shard_Storm_M9_M11_Work_Log.md); [M9.0 report](docs/Shard_Storm_M9_0_Implementation_Report.md).

`npm test` **179PASS/0FAIL**, 기존 benchmark 및486Run balance,1573Run M5/M6,650Run M7/M8 smoke를 검증했습니다. M9 성장 실험은5seed·3build·Fresh/LegacyMax·20/ExtraTime·ON/OFF와 추가 비교를 포함한 **38,250실제Run/165경로**입니다. 단독 성능90Run, Chrome 포인터5Run 및 기존 M7/M8 포인터6Run 모두 PASS·콘솔 오류0입니다. 자동 입력은 사람의 재미 검증과 구분합니다.

```powershell
npm test
npm run benchmark
npm run benchmark:balance
npm run benchmark:m5-m6
$env:M7_RUNS = '1' # 회귀 smoke; 전체300Run과 구분
npm run benchmark:m7-m8
$env:CONTENT_WORKERS = '6'
npm run benchmark:m9
node tests/m9-performance.mjs # 성장 worker 종료 후 단독 실행
# 별도 터미널에서 PORT=4174로 npm start
$env:PLAYWRIGHT_MODULE = Join-Path $env:TEMP 'shard-storm-qa/node_modules/playwright'
$env:QA_BASE_URL = 'http://127.0.0.1:4174'
npm run qa:m9
npm run qa:m7-m8
node tests/m9-report.js
```

[M9 구현·알려진 제한](docs/Shard_Storm_M9_Implementation_Report.md) · [50~300Run 밸런스·상한·성능](docs/Shard_Storm_M9_Balance_Report.md) · [신규6도형](artifacts/m9-fixture-six-shapes.png) · [좁은 결과 화면](artifacts/m9-rank3-result.png). 기존512 iteration/tick 상한 도달과50Lv 이후 재화 잉여를 보고서에 공개했습니다. 기본.20×3/가격/Refinery.06은 유지합니다.

## Historical M8 report below

# Shard Storm — playable prototype M7 · M8

현재 구현 기준은 [M7·M8 PRD](docs/Shard_Storm_M7_M8_Relic_Contract_Anomaly_PRD_v1.0.md)입니다. 기본20초, 기존7도형·19스킬/50Lv·순차 연쇄·Modifier·Refinery·콤보를 유지합니다.

- **Relic 6종 / 장착2개:** 실제 정산된 업적과 Rank로 설계도를 해금하고, RESULT에서 Photon+Catalyst로 제작합니다. 영구 소유이며 슬롯을 비우거나 교체할 수 있습니다. 효과와 사거리·피해·지연 등의 기회비용을 카드에서 확인하세요.
- **Contract 10종 / 활성3개:** START/RESULT에서 수락, RESULT에서 포기합니다. 여러 Run의 실제 사건을 정산할 때 누적하고, Ⅰ/Ⅱ/Ⅲ 목표는1/2/4배입니다. 완료 보상은1회이며 다음 단계는 다시 수락합니다. Ⅲ 완료는 영구 배지입니다.
- **Anomaly 6종 / 다음 후보3개 + Normal:** Rank에 맞는 저장된 후보 중 선택합니다. 기본은 Normal입니다. 선택은 다음 Run만 바꾸고 성공 보너스는 기본 Refinery의8~15%, 최대60 Photon입니다. 실패해도 기본 보상은 유지됩니다. 새로고침은 후보를 재추첨하지 않습니다.
- **START/RESULT:** 펼칠 수 있는 Loadout/Contracts/Next Run 섹션을 제공합니다. Run 중에는 선택이 고정되고, HUD는 한 계약과 위험 이름만 표시합니다. 정산 결과는 Refinery/Contract/Anomaly Photon과 Catalyst를 구분합니다.
- **schema5 저장:** 기존 `shard-storm-v1` 키와 schema1..4의 재화·스킬·기록·미완료 정산을 보존합니다. 새 Relic 업적은0부터 시작하며 과거 기록으로 추정하지 않습니다. Fresh Lab과 개발자 지급/강제 생성은 실제 저장과 분리됩니다.

실행은 `npm start` → **http://127.0.0.1:4173**. 외부 게임 엔진이나 새 에셋 없이 Canvas/Vanilla JavaScript를 확장했습니다.

```powershell
npm test
npm run benchmark
npm run benchmark:balance
npm run benchmark:m5-m6
npm run benchmark:m7-m8
node tests/m7-m8-performance.mjs
# 별도 터미널에서 npm start 실행
$env:PLAYWRIGHT_MODULE = Join-Path $env:TEMP 'shard-storm-qa/node_modules/playwright'
$env:QA_BASE_URL = 'http://127.0.0.1:4173'
npm run qa:m7-m8
node tests/m7-m8-ui.mjs
node tests/m7-m8-report.js
```

Playwright가 없으면 앱 외부에 `npm install --prefix "$env:TEMP/shard-storm-qa" playwright`로 설치합니다. Chrome은 `CHROME_PATH`로 지정하며 QA는 임시 프로필만 사용합니다. 성장 실험은 기본300Run/230경로+420개별 비교로 CPU 시간이 필요합니다. 게임규칙 해시를 포함한 경로별 gzip checkpoint가 있어 중단 후 같은 명령으로 재개합니다. `$env:M7_WORKERS='6'`으로 병렬 프로세스 수, `$env:M7_RUNS='3'`으로 별도 smoke 실험을 지정할 수 있습니다. smoke는300Run 완료 근거로 사용하지 않습니다. stdout을 UTF-8로 보존하려면 `node tests/log-command.mjs artifacts/m7-m8-benchmark.txt npm run benchmark:m7-m8`을 사용하세요.

기능·검증·커밋·한계는 [구현 보고서](docs/Shard_Storm_M7_M8_Implementation_Report.md), 5~300Run 성장·2Relic 조합·4선택 정책은 [밸런스 보고서](docs/Shard_Storm_M7_M8_Balance_Report.md)와 `artifacts/m7-m8-*` 원본에 기록합니다. 단위 테스트153개, 기존 회귀 및 브라우저 로그는 해당 보고서를 기준으로 확인하세요. 자동 입력과 Chrome 포인터 QA는 사람의 재미·장기 재도전 의향 검증과 구분합니다. 기존 가격·.06 변환율·Rank 기준은 유지했습니다.

[Fresh 결과](artifacts/m7-m8-fresh-fresh-result.png) · [제작6종 fixture](artifacts/m7-m8-fixture-crafted-six.png) · [Anomaly 성공 fixture](artifacts/m7-m8-fixture-success-result.png) · [좁은창](artifacts/m7-m8-fixture-narrow.png)

## M5 · M6 기록 (이하 과거 기준)

아래 schema4/118-test/M7 범위 밖 표현은 M6 당시 기록입니다. 현재 상태는 위 M7·M8와 최신 보고서를 기준으로 확인하세요.

[M5·M6 명세](docs/Shard_Storm_M5_M6_Development_PRD_v1.0.md)를 v0.9 완성본에 구현했습니다. 기본20초, 직접 클릭/홀드/드래그, 순차 연쇄와 기존4도형·11스킬·Modifier·Refinery·콤보를 유지합니다. 현재 스킬은 **19개 / 총50레벨**입니다.

- **Discovery Rank0~4:** 정산 완료 누적 파괴300/1200/3500/8000에서 해금합니다. 같은 Run 중 Rank가 바뀌지 않습니다. 결과 화면에 다음 목표와 새 도형의 Run 문턱을 표시합니다.
- **광석:** Prism8%/+15Raw, Core2%/+60Raw/+1Catalyst, Void.5%/+180Raw/+2Catalyst. Rank1/2/4부터 독립 추첨하며 형태·Modifier와 분리됩니다. 사망 때 한 번만 드롭하고 Catalyst는 정산에서만 계정에 지급합니다.
- **신규 도형:** Hex(Rank2+45킬)의 Ward, Reactor(Rank3+100킬)의 절반/사망 파동, Ancient(Rank4+200킬)의3단계 파편·파동과 최종Catalyst2. 같은 화면에 혼합 등장합니다. Shield Pocket과 안전한 Tether Pair도 사용합니다.
- **신규8스킬:** Precision Fracture / Yield Stabilizer / Rare Separator / Fragment Relay / Kinetic Reach / Resonance Layer / Salvage Scanner / Catalyst Channel. Rank·선행·Photon·Catalyst를 동시에 만족해야 RESULT에서 구매할 수 있습니다. 정확한 수치와 비용은 [구현 보고서](docs/Shard_Storm_M5_M6_Implementation_Report.md)를 확인하세요.
- **저장:** 동일 키 `shard-storm-v1`, schema4. v1/2/3/4를 읽고 정상적인 은행·구매레벨·환불권·기록·옵션을 보존합니다. 신규8노드만0으로 추가합니다. 확인 가능한 과거 기록과 정확한 lifetime은 별도로 유지합니다. 정산 중 새로고침·Skip·Replay·뒤로 가기로 Photon/Catalyst/누적이 중복 지급되지 않습니다.
- **격리:** Fresh Lab, 가격×3/×6, Ore/Refinery OFF, 강제 생성과 테스트 지급은 실제 저장과 분리합니다. 실험 종료나 새로고침으로 기존 프로필에 돌아갑니다.

실행: `npm start` → **http://127.0.0.1:4173**. 의존성 없는 HTML5 Canvas/Vanilla JS입니다. `D`로 개발자 패널을 열고 `Fresh Lab`에서 기존 세이브를 보존한 새 계정 테스트를 할 수 있습니다.

```powershell
npm test
npm run benchmark
npm run benchmark:balance
npm run benchmark:m5-m6
node tests/m5-m6-performance.js
# 다른 터미널에서 npm start를 실행한 상태
$env:PLAYWRIGHT_MODULE = Join-Path $env:TEMP 'shard-storm-qa/node_modules/playwright'
$env:QA_BASE_URL = 'http://127.0.0.1:4173'
npm run qa:m5-m6
node tests/m5-m6-report.js
```

Playwright가 없으면 앱 외부의 위 QA 경로에 설치하세요: `npm install --prefix "$env:TEMP/shard-storm-qa" playwright`. Chrome 실행 파일은 `CHROME_PATH`로 지정할 수 있습니다. 자동 QA는 별도의 임시 브라우저 프로필에서 실행합니다. `tests/m5-m6-baseline.js`는 원본 소스를 사용하는 기준 커밋81559ce에서만 실행하며 현재 기준선을 덮어쓰지 않습니다.

변경 전94개, 현재 **118 PASS / 0 FAIL**. 기존 테스트를 삭제하지 않았습니다. M5_ONLY750판·통합750판·Legacy50판 및 비교/재현성23판을 기록합니다. 기본 `.06` 변환율, 슬롯과 기존 가격/×1.6을 유지했습니다. **자동 입력에서50판 안에 모든 스킬이 소진되는 성장 목표 미달**과 후반 Catalyst 잉여를 [밸런스 보고서](docs/Shard_Storm_M5_M6_Balance_Report.md)에 명시합니다. 자동 통과를 사람의 재미 검증으로 간주하지 않습니다. 사람5~10판에서 타깃 우선순위·조건부 스킬·다음 목표 이해·재도전 의욕을 확인해야 합니다. M7 Prestige/Artifact/Relic은 범위 밖입니다.

[Hex](artifacts/m5-m6-rank2-hex.png) · [Reactor](artifacts/m5-m6-rank3-reactor.png) · [Ancient](artifacts/m5-m6-rank4-ancient.png) · [Refinery 스킬](artifacts/m5-m6-skills-refinery.png) · [좁은창](artifacts/m5-m6-narrow-result.png)

## v0.9 P0 기록 (이하 과거 기준)

아래 미구현/P1/P2/94-test/schema3 표현은 v0.9 당시 기록이며, 현재 상태는 위 M5·M6와 최신 보고서를 기준으로 보세요.

[v0.9 기획서](docs/Shard_Storm_v0.9_Short_Run_Deep_Progression_PRD.md)의 **P0**를 v0.8 완성본에 구현했습니다. HTML5 Canvas 2D + Vanilla JavaScript 구조와 기존 파괴감·콤보·11노드 트리를 유지합니다. 현재 수치·저장·충돌·경제·QA 결과는 [v0.9 P0 보고서](docs/Shard_Storm_v0.9_P0_Implementation_Report.md)에 있습니다. P1/P2의 광석·촉매·신규 노드·신규 도형은 아직 구현하지 않았습니다.

## 실행과 조작

Node.js 20 이상에서 의존성 설치 없이 실행합니다.

```powershell
npm start
```

**http://127.0.0.1:4173** 에서 `START RUN`. 기본 **20초** 동안 클릭하거나 누른 채 드래그하세요. 중앙 안내 Triangle은 최초 클릭의4연쇄를 유지하며, 이후 도형은 조금씩 회전·드리프트합니다. 누적 파괴15/45/100/200/400/750에 따라 같은 화면에서 해금·보충되며 타이머를 초기화하지 않습니다.

HUD의 **Raw Shards**는 전투 재료입니다. 종료 후 같은 결과 화면의 **Shard Refinery**에서10토큰·5슬롯으로 Photon을 확정하고 한 번 정산합니다. 연출은1.2초이며 `SKIP` 또는 `PLAY AGAIN`으로 바로 끝낼 수 있습니다. 스킬 노드를 선택해 `강화`하고 재도전하세요. Extra Time은 Lv당+2초로 **22~32초**가 됩니다. 기존 보유 레벨은 유지하며, 해당 사용자는 기존에 구매한 시간 스킬 비용만1회 선택적으로 반환할 수 있습니다.

`D` / `DEV [D]`: 개발자 패널. 수동 일시정지 버튼·탭 비활성화 일시정지·선택적 Web Audio 합성음도 있습니다. 버튼 해제, 아레나 이탈, 창 포커스 상실 시 홀드가 멈춥니다.

서버 종료는 `Ctrl+C`. 포트 변경은 `$env:PORT = '4174'; npm start`. Python 대안은 `python -m http.server 4173 --bind 127.0.0.1`. ES Modules 때문에 `file://` 실행은 지원하지 않습니다. 저장은 프로토콜·호스트·포트별이므로 기존 저장을 이어가려면 같은 주소를 사용하세요.

## v0.9 P0 변경·저장·검증

- **모션/충돌:** 최대 드리프트6px(Star4px), 느린 회전. 클릭·렌더는 현재 월드 좌표를 공유합니다. 파편은 목표의 연속 이동 경로에서 접촉을 계산하고, 파동도 실제 최초 접촉만 예약합니다. Motion OFF는 고정 대상 경로를 사용합니다. 두 v0.9 모드는 같은 안전한 초기 앵커 간격을 써서 비교합니다.
- **경제:** `floor(sum(tokenRaw × .06 × slotMultiplier))`, 슬롯×0.8/1/1.1/1.3/1.6, 가중치15/35/30/15/5, 기대 배율1.075. 기존 스킬 가격과 성장1.6은 그대로입니다. 원재료와 실제 정산 Photon을 분리합니다.
- **세이브:** 키 `shard-storm-v1` 유지, schema3. v1/v2 bank·levels·bestStats·lastRuns·options 보존, 과거 수익 재가공 없음. 애니메이션 전에 확정 pending 결과를 저장하고 완료/Skip/새로고침/뒤로 가기에서 재추첨·중복 지급을 막습니다. 저장 차단 시에는 기존 안내대로 현재 세션만 유지됩니다.
- **Fresh Lab:** `D` → `Fresh Lab`은 새 계정으로 시작하는 메모리 실험입니다. 실제 은행·레벨을 덮어쓰지 않습니다. `Refinery OFF`도 자동으로 격리 실험에 들어가×1 변환만 비교합니다. `legacy_tiers` / `v09_short`, 기존 생성·가격·빌드 프리셋도 선택할 수 있습니다. 종료 버튼이나 새로고침으로 실제 세이브로 돌아옵니다.
- **기록:** 신규5초 구간과 기존10초 구간, Raw/가공 수익·시드·빌드·입력 정책·프로필·접촉 오차·상한·지연. 과거20개 기록 합계는 `knownHistoryKills`로 구분하며 전체 lifetime을 거짓 복원하지 않습니다. rank/catalyst는 P1 준비 필드이며 실제 해금은 없습니다.

```powershell
npm test
npm run benchmark
npm run benchmark:balance
npm run benchmark:v08-balance
node tests/v09-report.js
```

변경 전70/70, 현재 **94 PASS / 0 FAIL**. 기존70개 회귀는 정적 v0.8 비교 규칙에서 유지하고 새20초·이동·Refinery·schema3는24개 신규 검사로 확인합니다. v1/v2를 읽는 현재 버전 기대값과 새 기본 시간 기대값은 명세에 맞게 변경했습니다. 테스트를 삭제하지 않았습니다.

`benchmark`는 구형60초 회귀18판+신규20초2판입니다. `benchmark:balance`는5시드의 비교150판, Utility35판, Fresh/Legacy의1/3/5/10 Run 성장300판, 재현성1판(총486판)을 실행합니다. 보존한 구형 전체 경제 비교도 별도 스크립트로 통과했습니다. [단위 테스트](artifacts/v09-unit-results.txt), [밸런스 원본](artifacts/v09-balance-results.json), [보고서](docs/Shard_Storm_v0.9_P0_Implementation_Report.md).

새20초 Motion ON 기본 빌드 자동 입력은5시드 중앙값 **149파괴 / 1,942 Raw / 122 Photon**입니다. 기존 가격으로5판 후에도 대부분의 강화가 남았습니다. 전략별 실제 누적 구매·Utility20/22/32초 비교와 범위는 보고서를 참고하세요. **자동 결과를 사람의 재미·정확도로 간주하지 않습니다.** 기존 올맥스 계정의 새로운 구매 동기는 P1 확장 전까지 남은 한계입니다.

실제 브라우저 QA:

```powershell
$env:PLAYWRIGHT_MODULE = Join-Path $env:TEMP 'shard-storm-qa/node_modules/playwright'
$env:QA_BASE_URL = 'http://127.0.0.1:4173'
node tests/v09-browser.mjs
node tests/visibility-check.mjs
node tests/v09-report.js
```

Chrome의 분리된 테스트 프로필에서20초 실제 포인터 Run4회, 구매·Replay, Motion/Modifier/Refinery 비교, 실제 가공 중 새로고침 복구, 뒤로 가기, v2 기존 세이브와 격리 환불을 확인했습니다. 콘솔/페이지 오류0개. 모의 visibility는 실제 OS 탭 전환과 구분합니다. [브라우저 결과](artifacts/v09-browser-results.json).

- [20초 플레이](artifacts/v09-01-baseline-playing.png)
- [Shard Refinery](artifacts/v09-01-baseline-refinery.png)
- [정산과11노드 트리](artifacts/v09-01-baseline-result.png)
- [새로고침 직전의 확정 결과](artifacts/v09-04-refresh-recovery-refinery.png)

사람5~10판에서 확인할 것: 짧은 Run의 재도전 의욕, 회전/넉백 중 클릭 실패, 큰 연쇄의 빈도, 정산 기대감과 Skip 비율, 첫 구매1~3회와5/10판 성장 목표. 다음 P1은 Discovery Rank0~2·Prism/Core·촉매·신규5노드·Hex/Reactor이며, P2와 Prestige는 별도 보류 범위입니다.

## v0.8 기록 (이하 과거 기준)

아래 시간·수익·schema2·QA 수치는 v0.8 당시 기록입니다. 현재20초 규칙과 저장은 위 내용을 기준으로 보세요.

## v0.8 신규 기능과 실험

**STEP 1 — 콤보:** 같은 Chain의 5/10/20 파괴에 CASCADE / OVERLOAD / SHARD STORM을 한 번씩 기록합니다. 화면에는 높은 단계의 배너 하나와 최대 6개 작은 팝업만 표시하고, 강조·합성음은 0.25초 재사용 제한을 둡니다. 사운드 동시 음 수는 최대 8입니다. 피해·Photon·타이머 배율은 없습니다. `Combo Feedback` / `Sound` 토글은 게임플레이를 바꾸지 않습니다.

**STEP 2 — 변종:** Cracked는 원래 maxHP를 유지하고 `ceil(maxHP×0.5)` HP로 시작합니다. 이미 사라진 HP에는 보상을 주지 않습니다. Charged는 Triangle/Pentagon 고유 주 파편+1, Square/Star 고유 반경×1.25, 파괴 보너스×1.20(Photon Boost와 곱한 뒤 한 번 올림)입니다. 피해량·속도·계승 보조 능력은 그대로입니다. Cracked의 굵은 균열/빠진 모서리, Charged의 점선 이중 링/발광 코어, Enhanced의 갑옷 표식으로 구분합니다.

| 누적 파괴 | Cracked | Charged |
|---|---:|---:|
| 0~11 | 0% | 0% |
| 12~29 | 10% | 0% |
| 30~54 | 10% | 5% |
| 55+ | 12% | 8% |

Enhanced 추첨을 먼저 하고, 비-Enhanced에만 상호 배타적으로 적용합니다. Charged 동시 최대2, 초과는 normal로 폴백합니다. 첫 안내 배치는 유지합니다. Modifier는 독립된 게임플레이 RNG 스트림에서 스폰 시도마다 한 번 추첨하며 OFF/Enhanced/배치 실패에도 같은 추첨 횟수를 소비합니다. 코스메틱 RNG와는 별개입니다. `Modifiers OFF`는 이후 생성만 일반형으로 바꾸고 기존 도형을 변환하지 않습니다. `Modifier Marks OFF`는 표식만 바꿉니다.

**STEP 3 — 생성 진단:** 10초 구간별 직접/연쇄 파괴·Photon·마일스톤·밀도·종류/변종/HP·생성 실패·상한을 기록합니다. 빈 화면 누적 시간과 0.5초 이상 횟수, 상한 원인, 초별 파편 피크, 브라우저 FPS/고정 틱 P95도 수집합니다. 로그에는 시드·빌드·입력 정책·시간·실험 설정·토글 변경이 들어갑니다.

| 생성 프리셋 | 보충 | 군집 확률 |
|---|---|---:|
| baseline (실제 기본) | .20초 ×3 | .60 |
| spread | .20초 ×3 | .45 |
| fast | .15초 ×3 | .60 |
| fast_spread | .15초 ×3 | .45 |

기존 스폰 시계의 epsilon+나머지 연산이 연속 틱에 중복 보충하는 오류를 수정했습니다. `.20` 기본값은 유지하며, 이제 지정한 간격대로 보충합니다. 이 수정 때문에 v0.7의 파괴 수와 단순 동일값 비교는 성립하지 않습니다. 수정 전 원본도 보존했습니다.

**STEP 4 — 경제 샌드박스:** 개발자 패널에서 Crusher / Cascade / Reactor / Utility 빌드, 기존 가격 / ×3 / ×6을 비교합니다. 기존 11노드·선행조건·성장1.6·가격은 실제 저장에 그대로 적용합니다. 실험은 세이브의 깊은 복사본을 쓰고, 실험 Photon 지급·강제 생성·구매·정산·기록을 저장하지 않습니다. `동일 Seed 새 Run`도 격리 세션입니다. `실험 종료 · 기존 저장으로 복귀`를 누르거나 새로고침하면 실제 재화/강화로 돌아옵니다. 가격 프리셋은 보상을 바꾸지 않습니다.

실험 방법: `D` → 생성/가격/빌드 선택 → 테스트 시간을 `60`으로 지정 → `격리 실험 Run 시작`. Extra Time의 실제 효과는 시간을 비우고 ExtraTime/PhotonBoost/UtilityMax 빌드로 실행하세요. `PLAY AGAIN`은 해당 실험 세션의 구매 결과를 이어갑니다. `동일 Seed 새 Run`은 실험에서 소유한 레벨을 유지하고 새 판을 시작합니다.

세이브 키 `shard-storm-v1`, schema2, 기존 bank/11스킬/bestStats/lastRuns를 유지했습니다. v1→v2 기존 로딩도 회귀 검사합니다. 신규 Run 필드는 optional이며 과거 기록을 삭제하지 않습니다.

## v0.8 자동 QA와 비교 결과

```powershell
npm test
npm run benchmark
npm run benchmark:balance
node tests/balance-report.js
```

**현재 단위 테스트 70 PASS / 0 FAIL**, 기존48개 유지+신규22개. `benchmark` 18판, `benchmark:balance` 231개 실제 시뮬레이션 PASS. 시드 `[31415,1,7,42,99]`, 동일 밀도/HP 입력 정책과 스탯의 반복 간격으로 생성 설정50판·빌드·11노드·1/3/5회 성장 경로를 비교합니다. 같은 조건은 캐시해 재사용합니다. 원본 [밸런스 JSON](artifacts/v08-balance-results.json), [테스트 출력](artifacts/v08-unit-test-results.txt), [변경 전](artifacts/v08-before.json), [스폰 시계 수정 직전](artifacts/v08-before-cadence-fix.json).

| 5시드 / 60초 / 기본 빌드 중앙값 | Modifier OFF | Modifier ON | ON / fast_spread |
|---|---:|---:|---:|
| 완전 파괴 | 663 | 695 | 768 |
| 연쇄 비율 | 70.3% | 72.4% | 73.0% |
| Photon | 12,426 | 13,466 | 14,288 |
| 최고 Chain | 23 | 24 | 30 |
| 안전 상한 | 0 | 0 | 0 |

50판의 생성 비교에서 0.5초 이상 빈 화면·스폰 실패는 0회였습니다. 상한이 발생한 경우는 깊이 제한이며 상한값을 올리지 않았습니다. 기본/강화/최대 강화와 여러 시드의 범위·밀도·상한은 보고서를 참고하세요.

기존 가격으로는 자동 입력 첫 판에 전체35Lv를 살 수 있습니다. ×3은 첫 판19~20Lv / 3판35Lv, ×6은 첫 판9~11Lv / 3판28~29Lv / 5판35Lv입니다. `fast_spread`와 `cost_x6`을 다음 사람 비교 후보로 제안하지만 실제 기본값으로 승격하지 않았습니다. **자동 입력 결과는 사람의 재미·구매력을 입증하지 않습니다.**

브라우저 QA는 임시 폴더의 Playwright를 사용하고 사용자 브라우저와 분리된 새 프로필만 조작합니다. 서버를 실행한 상태에서:

```powershell
$env:PLAYWRIGHT_MODULE = Join-Path $env:TEMP 'shard-storm-qa/node_modules/playwright'
$env:QA_BASE_URL = 'http://127.0.0.1:4173'
node tests/browser-check.mjs
$env:QA_PHASE = '2'
node tests/v08-browser.mjs
node tests/visual-check.mjs
node tests/visibility-check.mjs
node tests/balance-report.js
```

Playwright가 없으면 아래 v0.7 QA 절차의 임시 설치 명령을 사용하세요. 최종 브라우저 결과와 실제 입력60초 플레이, 스킬 구매·유지, 변종·콤보·격리 세션 검증 상태는 [v0.8 보고서](docs/Shard_Storm_v0.8_Balance_Report.md)에 기록합니다. 모의 visibility 검사는 실제 탭 전환과 구분합니다.

- [실제 콤보](artifacts/v08-combo-live.png), [Chain20 표시 fixture](artifacts/v08-combo-20.png)
- [삼각/사각 변종 fixture](artifacts/v08-modifiers-triangle.png), [오각/별 변종 fixture](artifacts/v08-modifiers-pentagon.png)
- [개발자 패널](artifacts/v08-developer-lab.png), [격리 구매 결과](artifacts/v08-sandbox-result.png)

화면 fixture는 표시 검사용 합성 상태라고 캡처에 명시했습니다. 라이브 연쇄와 실제 포인터 검증은 별도로 기록합니다. 아직 남은 사람 검증: 첫10초 연쇄 인지, 콤보 단계 가독성, Charged를 일부러 먼저 클릭하는지, 강화 전후 체감, 다시 하고 싶은 정도. 일반 브라우저의 실제 탭 전환과 합성음의 주관적 청감도 수동 확인이 필요합니다.

## v0.7 구현·QA 기록 (이하 과거 기준)

아래 수치와 스크린샷은 v0.7 당시 결과입니다. 현재 테스트 수·성능·변종·실험 지급 동작은 위 v0.8 내용과 보고서를 기준으로 보세요.

## v0.6 진단과 개선 순서

수정 전 기존 테스트 26개 통과와 로컬 서버 실행을 확인했습니다. 기존 `area()`는 범위 전체를 즉시 타격했고, 직접 클릭은 짧은 플래시·조각만 있었으며, 도형은 정규 다각형, 구매 화면은 5개 카드, 저장은 버전 1이었습니다.

기존 `Game`, 충돌·보상·해금·저장 함수를 재사용하면서 클릭 VFX → 실제 파동과 예약 발사 → 코스메틱/배치 → 기존 5종 그래프 → 신규 P1 6종 → 회귀/브라우저 검증 순서로 확장했습니다. 기본 시간·누적 해금·기존 5종 효과·가격·최대 레벨과 1회 정산을 유지했습니다.

## 실제 구현 내용

### 클릭 반응

- 성공 타격: 클릭 위치의 8→26px 링(0.12초), 흰 플래시(0.055초), 1.08→1.0 반동(0.10초), 2~4개 파손 조각(0.15초).
- 빈 공간: 희미한 작은 링(0.07초), 피해·재화 없음.
- 부분 손상: HP 비율 3단계, 도형별 `damageSeed`로 균열과 깎이는 모서리를 고정.
- 클릭 링은 장식 전용입니다. 실제 광역 공격은 Impact Pulse 구매 후 별도의 **점선 공격 파동**으로 생성합니다.
- 클릭 VFX는 풀을 재사용하며 활성 링 24개로 제한합니다. 파티클·사망 연출도 각각 상한을 적용합니다. 장식 수 감소가 실제 피해·보상을 바꾸지 않습니다.

### 실제 순차 전파

- 사망한 도형의 고유 효과·계승은 게임 시간 **+0.03초**에 예약합니다. UI `setTimeout`을 쓰지 않습니다.
- Square는 **650px/s**, Star는 **720px/s**로 실제 파동을 확장합니다. 파동의 반경과 피해 시간은 같은 시뮬레이션 시간에서 계산합니다.
- 접촉 거리 규칙은 `max(0, 중심 거리 - 대상의 원형 히트 반경)`입니다. 이 거리에 외곽 링이 도달할 때만 피해가 발생합니다. 생성 직후 범위 전체의 HP를 미리 깎지 않습니다. 범위 경계와 대상의 히트영역이 겹치는 경우도 포함합니다.
- 도형은 판정상 고정되어 있으므로 거리/속도로 실제 도달 이벤트를 예약합니다. 새로 생성된 도형도 아직 지나가지 않은 파동에 등록하되 생성 보호 0.15초를 지킵니다. 파동의 `hitIds`/`registeredIds`로 중복을 방지합니다.
- 모든 이벤트는 `scheduledTime → priority → eventId`로 안정 정렬합니다. 고정 틱을 다음 이벤트·가장 빠른 파편 접촉 시점에서 나눠 처리하므로 앞선 사건으로 이미 파괴된 도형이 나중 파편을 잘못 흡수하지 않습니다.
- 파편은 기존 선분 대 원형 검사, 최초 충돌 1회, 직선 이동, 누적 거리·수명, 반사를 유지합니다. Pentagon의 소형 파편은 재분열·반사가 없습니다.
- 0초에 입력·생성·피해·예약 이벤트를 중단하고 효과를 정리합니다. 도달 예정이더라도 시간 종료 후 추가 보상은 없습니다.

### 프로시저럴 도형과 배치

- 형태는 3각/4각/5각/5개 돌출 별로 구별합니다. 외곽선은 청록 `#6ADFEF`, 분홍 `#F4A6D2`, 보라 `#C7ADFF`, 금색 `#FFD884`로 고정합니다.
- 별도의 코스메틱 시드에서 기본 크기 13~21px, 형태·비율·꼭짓점·명도·채도·투명도·무늬를 한 번 생성해 저장합니다. 원형 히트 반경은 최소 16px이며 생존 중 바뀌지 않습니다. 변종 꼭짓점은 기본 반경 안에 정규화합니다.
- Triangle은 서로 다른 꼭짓점 거리로 좁고 넓은 모양을 만들면서 기본 세 방향의 120도 간격을 유지합니다. 표시된 꼭짓점과 실제 고유 파편 방향이 일치합니다. 추가 Shard Bloom 파편은 사이 방향을 사용합니다.
- 내부 재질은 `matte / bright / deep`, 무늬는 `none / inset / split-line / center-core`. Enhanced는 코스메틱과 별개로 원본 HP+2, 이중 외곽선·갑옷 표식을 항상 표시합니다.
- **Visual Variety OFF는 표시만 변경합니다.** HP·원형 히트영역·배치·파편·보상이 동일하게 재현됩니다. 장식 RNG도 게임플레이 RNG와 분리했습니다.
- Cluster는 3~5개 군집, Arc는 4~6개 곡선, Bridge는 두 묶음과 중간 연결 위치, Scatter는 분산 위치를 계획합니다. 보충은 여전히 0.2초마다 최대 3개여서 한 패턴은 여러 틱에 걸쳐 배치됩니다.
- 모든 패턴에서 경계·반경 합+12px 간격·80회 시도 제한·파편 경로 회피를 적용합니다. 실패 시 작은 군집, 그 뒤 균일 분포로 폴백하며 강제 겹침은 없습니다. 후반에는 군집 규모와 Star 주변 앵커 선택 확률을 높입니다. 잭팟을 강제로 만들지 않습니다.

**PRD 충돌의 최소 해석:** 기존 “후보의 군집 60% / 분산 40%”와 신규 패턴 표의 “Scatter 20%”는 동시에 만족할 수 없습니다. 기존 60/40을 도형 후보마다 유지하고, 군집 후보 안에서 Cluster:Arc:Bridge를 **35:25:20으로 정규화**해 선택합니다. 위치 실패의 균일 폴백 때문에 실제 배치의 Scatter 비율은 더 높아질 수 있습니다. 로그는 성공한 배치 패턴을 집계합니다.

### 스킬 트리와 저장

CORE에서 Destroy / Cascade / Reaction / Utility 네 가지로 분기하는 SVG 그래프입니다. 11개 노드와 11개 연결선을 선언적 데이터로 렌더링하며, 선택 시 현재/다음 효과·가격·선행조건을 표시합니다. locked / available / affordable / purchased / max 상태와 연결선이 구매 즉시 갱신됩니다. 모든 P0/P1 노드는 실제 효과·구매가 구현되어 있습니다.

| 스킬 | 효과 | 첫 가격 / 최대 Lv | 선행조건 |
|---|---|---:|---|
| Crush Power | 직접 피해 3+Lv | 60 / 5 | 없음 |
| Shard Power | 주 파편 피해 3+Lv | 90 / 5 | 없음 |
| Shard Range | 거리 180+50×Lv px | 70 / 3 | Shard Power 1 |
| Chain Amplifier | Square/Star 피해 +Lv, 반경 +15×Lv | 130 / 3 | 없음 |
| Extra Time | 시간 60+5×Lv 초 | 120 / 6 | 없음 |
| Crush Speed | 간격 max(0.14, 0.20−0.02×Lv) 초 | 150 / 3 | Crush Power 1 |
| Impact Pulse | 성공 직접 타격마다 반경42·피해1의 파동 | 260 / 1 | Crush Power 2 |
| Ricochet+ | 주 파편 반사 1+Lv 회 | 170 / 2 | Shard Range 1 |
| Shard Bloom | Triangle 3+Lv, Pentagon 2+Lv 주 파편 | 290 / 2 | Shard Power 2 |
| Echo Catalyst | 계승 보조 피해 1+Lv | 240 / 2 | Chain Amplifier 1 |
| Photon Boost | 완전 파괴 보너스만 ×(1+0.10×Lv), 올림 | 180 / 3 | Extra Time 1 |

반복 가격은 기존과 같은 `ceil(baseCost × 1.6^현재Lv)`. 게임 중 구매 불가, 잠금·잔고 부족·MAX는 구매 불가입니다. Impact Pulse는 클릭 대상을 제외하고 해당 클릭 Chain에 귀속되며 고유 Square 효과로 오인하거나 계승을 일으키지 않습니다. Shard Bloom도 주 파편당 소형 분열은 정확히 2개입니다. Photon Boost는 제거 HP의 1:1 보상을 증폭하지 않습니다.

`getDerivedStats(levels)` 한 곳에서 게임 능력치를 합성하며 게임, UI 효과 설명, 다음 효과가 같은 수치를 사용합니다. 트리 정의는 중복 ID·없는 참조·순환·불가능한 최소 레벨을 검사합니다.

저장 키 **`shard-storm-v1`을 유지**하고 schema `saveVersion`만 1→2로 올립니다. 이전 bank, 기존 5개 levels, bestStats, lastRuns(최대20), 기존 옵션은 보존하고 신규 레벨은 0, 신규 비교 옵션은 ON으로 추가합니다. 마이그레이션은 앱 시작 시 저장합니다. v0.6에서 Shard Power 없이 산 Shard Range도 효과·레벨을 보존하지만 **추가 구매**는 새 선행조건을 충족해야 합니다. 손상된 데이터·차단된 저장은 안전하게 처리하며 세이브 삭제는 명시적 확인을 거칩니다.

## 개발자 패널 / 안전장치

독립 토글: **Sequential Propagation**, **Visual Variety**, **Inheritance**, **Ricochet**, Damage VFX, Sound. 기본은 앞 5개 ON, Sound OFF입니다. 순차 전파 OFF는 생성된 파동의 범위 피해를 즉시 처리하는 비교용이며 결과에 OFF를 기록합니다. 이미 발사된 파동은 생성 당시 규칙을 유지합니다.

표시: 남은 시간, 직접/연쇄 파괴, 최고 Chain, Run·은행 Photon, Tier, 현재/목표 도형, 파편, 파동, 예약 효과, FPS, 상한 횟수, 시드, 첫 연쇄 시점, 평균 연쇄 지속 시간. 같은 시드 새 판, 테스트 시간, 종류별 생성, 테스트 Photon 지급, JSON 복사, 확인 후 초기화 도구도 유지합니다.

Run 로그는 실제 파괴·보상·해금 시간·평균 연쇄 지속 시간·생성 재질/패턴·비교 토글·도중 변경을 기록합니다. 지원 코드의 최신 로그에는 빌드 레벨과 긴 가시 프레임 지연의 생략 시간/이벤트 수도 기록합니다. 테스트 지급·강제 생성은 일반 재미 측정과 구분하세요.

활성 파편150, Chain 깊이10, Chain당 피해 이벤트400의 기존 제한을 유지하고 파동64, 예약 이벤트1024, 틱 내부 반복512 상한을 추가했습니다. 상한에서는 후속 실제 사건을 중단하고 횟수를 기록하며 가짜 보상을 만들지 않습니다. 1/60초 고정 시뮬레이션, 최대 8틱 catch-up, `requestAnimationFrame` 렌더링을 유지합니다. 큰 가시 프레임 지연에서는 실제 시간은 소비하고 지나간 미처리 사건을 폐기하여 늦은 유령 공격을 방지합니다. 아직 미래인 파동 도달은 유지합니다. 숨김/수동 일시정지 시간은 소비하지 않습니다.

## 테스트 실행과 결과

```powershell
npm test
npm run benchmark
```

v0.7 당시 자동 테스트 **48/48 통과**. PRD §13의 28항목, 기존 직접 공격/파편/분열/반사/보상/해금/정산/가격/시간 회귀, 파동 도달 순서, 정확한 0.03초 예약, VFX 무피해, 코스메틱 재현, 저장 마이그레이션, 선행조건, 모든 P1 능력치와 실제 홀드·추가 파편·추가 반사·Pulse·보너스, 동시 파동, 120개 대상 부하를 포함합니다. 실제 탭 전환은 아래 별도 제한을 참고하세요.

벤치마크 **18판 완료**: 기본/강화/A-B 6판 + 시드·최대 강화 스트레스 12판. 모든 판은 비교를 위해 60초로 고정합니다. 자동 입력 정책은 밀도/HP 효율 기반이고 반복 간격은 실제 도출 스탯을 사용합니다. 사람의 재미 평가나 렌더링 FPS로 해석하지 않습니다.

| 고정 시뮬레이션 · Seed31415 · 60초 | 기본 | Crush+1 / Shard+1 | 기본 / 순차 전파 OFF |
|---|---:|---:|---:|
| 완전 파괴 | 1011 | 1167 | 704 |
| 연쇄 파괴 | 826 | 934 | 507 |
| 최고 Chain | 43 | 37 | 27 |
| Photon | 19348 | 21950 | 13231 |
| 평균 연쇄 지속 | 498ms | 463ms | 220ms |
| 안전 상한 | 9 | 2 | 0 |

강화 후 전체 연쇄 파괴량은 늘었지만 최고 Chain은 이 시드에서 감소했습니다. 입력·치명타 소유·이후 배치가 달라지므로 한 지표가 항상 단조 증가한다고 가정하지 않습니다. Visual Variety OFF 결과는 기본과 동일한 파괴·보상이었습니다. 시뮬레이션 스텝 P95는 이 환경에서 약 0.2ms 이하였습니다. 원본: [simulation-results.json](artifacts/simulation-results.json), [단위 테스트 출력](artifacts/unit-test-results.txt).

브라우저 QA는 게임 런타임 의존성이 아닙니다. Playwright를 별도 임시 폴더에 설치하고 서버를 실행한 상태에서 실행합니다. Chrome 경로가 다르면 `CHROME_PATH`를 지정하세요.

```powershell
$qaPath = Join-Path $env:TEMP 'shard-storm-qa'
npm install --prefix $qaPath playwright --no-audit --no-fund
$env:PLAYWRIGHT_MODULE = Join-Path $qaPath 'node_modules/playwright'
node tests/browser-check.mjs
node tests/visibility-check.mjs
node tests/visual-check.mjs
```

격리된 테스트용 브라우저 프로필만 초기화합니다. 사용자 브라우저의 기존 저장을 삭제하지 않습니다. Chrome **154.0.8037.98**에서 실제 포인터 홀드/드래그 입력으로 **각 60초 3판**을 완료했습니다. 최종 재검증 결과:

| 실제 브라우저 자동 입력 | 기본 | Crush+1 / Shard+1 | 같은 강화 / 순차·다양성·계승 OFF |
|---|---:|---:|---:|
| 완전 파괴 | 817 | 1001 | 967 |
| 직접 / 연쇄 | 170 / 647 | 193 / 808 | 200 / 767 |
| 최고 Chain | 39 | 43 | 25 |
| Photon | 14940 | 19523 | 18194 |
| 평균 연쇄 지속 | 512ms | 490ms | 315ms |
| 평균 FPS | 128.48 | 128.28 | 128.65 |
| 앞10초 / 뒤10초 FPS | 128.09 / 128.47 | 128.27 / 128.19 | 128.63 / 128.83 |
| 안전 상한 | 11 | 9 | 2 |

세 판 모두 안내 클릭의 4개 파괴, 약 **0.156초** 첫 연쇄, 네 도형 출현을 확인했습니다. 실제 은행에서 Crush/Shard 총150 Photon을 구매하고 새로고침 후 강화가 유지됐습니다. 11개 노드/11개 SVG 연결선, 잠금 정보, 모든 P1 구매 경로, MAX, 잔고 부족, 리사이즈 클릭, 미정산 새로고침 미지급, 정산 1회, 재플레이, 독립 토글, 그래프 전용 스크롤과 재시작 가시성을 확인했습니다. 최종 콘솔/페이지 오류는 **0개**. [브라우저 결과](artifacts/browser-results.json)에 원본을 저장했습니다.

`visual-check.mjs`도 **통과**했습니다. 실제 UI로 신규 스킬을 구매하고 다음 판에서 직접 피해5로 Star HP9→4, 실제 Impact 파동, 65초 시간, 반복0.18초, 반사2회, Triangle/Pentagon 파편4/3개, 계승 피해2, 파괴 보너스×1.10을 확인했습니다. 일시정지한 월드에서 세 비교 토글을 바꿔도 HP/위치/시간이 유지됐고, 다음 성공 타격의 보너스도 확인했습니다. [v07-visual-proof.json](artifacts/v07-visual-proof.json)에 결과가 있습니다. QA의 소수 간격 비교는 JavaScript 부동소수 표현을 고려해 허용오차로 검사합니다. `visibility-check.mjs`의 모의 `document.hidden` 전환도 시간 정지·복귀 시 점프 방지 검사를 통과했습니다. [visibility-results.json](artifacts/visibility-results.json).

검수 중 수정: 분산 배치 집계 누락, 삼각형 변형의 표시 꼭짓점/파편 방향 불일치, 홀드 속도의 틱 소수 잔여 시간 손실, 큰 가시 지연 뒤 지난 예약 사건의 늦은 재생. 테스트 기대값도 v0.6의 즉시 폭발에서 v0.7의 실제 전달 시점으로 변경했습니다. 단순히 실패한 테스트를 삭제하지 않았습니다.

## 스크린샷

실제 캡처를 열어 도형 다양성·분홍/금색 파동·파손, 노드/연결선·잠금·상세 정보, 스크롤과 재시작 배치를 확인했습니다.

- [실제 순차 전파 플레이](artifacts/v07-02-baseline-playing.png)
- [스킬 트리 / 기존 강화 구매](artifacts/v07-03-purchased-upgrades.png)
- [강화 후 플레이](artifacts/v07-04-upgraded-playing.png)
- [개발자 비교 패널](artifacts/v07-05-developer-panel.png)
- [P1 구매 완료](artifacts/v07-07-p1-skill-tree.png)
- [하단 신규 노드](artifacts/v07-08-skill-tree-lower.png)
- [실제 Impact Pulse](artifacts/v07-09-impact-pulse.png)

## 변경된 파일

| 파일 | 변경 |
|---|---|
| `config.js` | v0.7 수치, 파동/클릭/변종/패턴, 11종 가격과 선언형 그래프, 비교 옵션, schema2 |
| `game.js` | 기존 월드 확장: 게임 시간 예약, 실제 파동, 시간순 충돌, 클릭 반응, 패턴, P1, 로그·지연 보호 |
| `effects.js` / `entities.js` | 파생 파편 수치, 반사 포함 선분 경로 예측, 경계 접촉 오차 처리 |
| **`skill-tree.js` (신규)** | 정의/검증, 공통 상태·가격·파생 스탯·설명, SVG 그래프 렌더 |
| **`visuals.js` (신규)** | 외형/손상 seed와 다각형·재질·무늬 생성, 클릭 VFX 풀 |
| `renderer.js` | 변종 기하·균열·재질·반동·클릭 링·실제 반경 파동·분해 |
| `progression.js` / `storage.js` | 선행조건 구매, 공통 스탯, 기존 저장 마이그레이션 |
| `app.js` / `index.html` / `style.css` | 트리·상세 정보·비교 패널, UI 적용, 기존 입력/루프 연결 |
| `tests/effects.test.js` / `tests/game.test.js` | 기존 규칙 회귀 + 전달 시점 기대값 변경 |
| **`tests/v07.test.js` (신규)** | v0.7 규칙, P1 실제 효과, 마이그레이션, 중첩/부하/지연 |
| `tests/benchmark.js` / `tests/browser-check.mjs` | 18판 비교·스트레스, 실제 60초·마이그레이션·트리 QA |
| **`tests/visual-check.mjs` (신규)** / `README.md` | 최종 P1 화면/전투 검사, 실행·결과·한계 문서 |

`server.js`, 기존 1회 정산 구조, localStorage 키, 테스트용 정지 검증 도구를 재사용했습니다. 프레임워크나 엔진으로 갈아엎지 않았습니다.

## 남은 한계 / 우선 플레이 테스트

P0/P1 게임 기능의 미구현 노드는 없습니다. 다음은 플레이 평가·검증 한계입니다.

- **사람의 재미는 아직 검증하지 않았습니다.** 자동 입력은 클릭 정확도가 높고 타깃을 잘 고릅니다. 사람 3~5판에서 타격 감각, 순차 전파 인과관계, 다시 하고 싶은 정도를 확인해야 합니다.
- **실제 탭 전환 검증은 남았습니다.** 헤드리스 Chrome은 다른 탭을 활성화해도 `document.hidden`이 바뀌지 않아 재현하지 못했습니다. 모의 visibility 처리와 수동 정지는 통과했습니다. 일반 Chrome에서 탭을 바꾸고 2초 뒤 복귀해 타이머가 유지되는지 확인하세요.
- 최적 자동 입력의 연쇄 비율은 80%대로 관찰 목표25~60%보다 높고, Photon이 빠르게 쌓입니다. 지정 수치를 임의로 낮추지 않았습니다. 사람 입력에 맞춰 비용/밀도를 조정할 후보입니다.
- 안전 상한 때문에 일부 깊은 후속 사건이 잘립니다. 실패나 가짜 정산이 아니라 명세의 보호 장치이며 로그에 남습니다. 최대 강화/큰 군집에서 자주 발생하는지 관찰하세요.
- 작은 도형의 시각 크기와 원형 클릭 영역(최소16px), 시각적 넉백 위치는 완전히 일치하지 않을 수 있습니다. 충돌은 고정된 원형 영역이며 코스메틱 토글로 바뀌지 않습니다.
- 한 시드·토글·강화에서 최고 Chain/점수가 항상 높아지지는 않습니다. 거리·마지막 치명타·이후 배치가 달라집니다. 여러 시드와 입력 정책으로 비교하세요. 실시간 입력은 프레임 시점 차이 때문에 완전히 같은 점수 재현을 보장하지 않습니다.
- 큰 가시 프레임 지연에서는 누락된 물리/피해를 재생하지 않아 점수가 낮아질 수 있습니다. 타이머는 늘리지 않고, 원인을 생략 시간/사건 수로 기록합니다.
- 물리 절단, 실제 넉백 충돌, 화면 흔들림·배경광의 고급 연출, 모바일 최적화, 보스/계정/서버/랭킹은 범위 밖입니다. 저장이 차단되면 현재 세션만 유지하며 화면에 알립니다.

먼저 확인할 플레이 요소:

1. 클릭 즉시 링·플래시·균열·조각이 명중/미스를 구분하고, 홀드 중 과도하게 번쩍이지 않는가?
2. 순차 ON/OFF에서 가까운→먼 도형의 전파와 다음 효과의 원인이 더 잘 읽히는가?
3. 같은 종류의 다른 크기·기하·재질이 단조로움을 줄이면서도 4종과 Enhanced를 알아볼 수 있는가?
4. Arc/Bridge가 군집 간 연결을 만들어 주고, Scatter가 연쇄 사이의 직접 공격 역할을 유지하는가?
5. 스킬 트리의 다음 가지가 다음 판의 동기가 되는가? Crush Speed / Impact Pulse / Bloom / Echo / 보너스의 차이를 체감하는가?

## 먼저 조정할 밸런스 파라미터 5개

게임 수치·비교 기본값·안전 상한은 `config.js`에서 변경합니다. PRD 수치를 바꾸면 테스트 기대값과 실험 기록도 검토하세요.

1. `propagation.delay / squareSpeed / starSpeed`: 클릭 뒤 전파 리듬과 가까운/먼 타깃 간 시간차.
2. `visual.clickLife / flash / recoilLife / clickStart / clickEnd`: 타격 반응의 길이와 화면 혼잡도.
3. `variety.radiusMin/radiusMax/minHitRadius`, 각 종류의 aspect/jitter: 외형 다양성과 클릭 가독성.
4. `clusterChance`, `patterns.*`, `tiers[].target/weights`: 군집·곡선·연결·분산의 균형과 연쇄 비율.
5. `upgrades.*.baseCost`, `costGrowth`, `impact.*`, `crushSpeed.*`, `photonBoostPerLevel`: 빌드 체감과 재화 성장 속도.
