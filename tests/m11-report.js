import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {CODEX_IDS} from '../codex.js';
import {TECHNIQUES,ELITES,ADVANCED_SHAPES} from '../advanced-defs.js';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const data=read('artifacts/m11-balance-results.json'),browser=read('artifacts/m11-browser-results.json'),storage=read('artifacts/storage-codec-browser-results.json'),ui=read('artifacts/m11-ui-browser-results.json'),combined=read('artifacts/m11-combination-results.json'),perf=read('artifacts/m11-performance.json'),browserRegression=read('artifacts/m11-browser-qa-summary.json');
const currentStorage=read('artifacts/storage-current32-results.json');assert.equal(currentStorage.passed,true);assert.equal(currentStorage.fullCurrentM11Runs,20);assert.equal(currentStorage.reloadBankExact,true);assert.equal(currentStorage.reloadRecordsExact,true);
assert.equal(data.passed,true);assert.equal(data.actualRuns,54000);assert.equal(data.sourceFiles.length,180);
for(const r of [browser,storage,ui,combined,perf])assert.equal(r.passed,true);
assert.equal(browserRegression.passed,true);assert.equal(browserRegression.actual20SecondRuns,24);
assert.equal(browser.runs.length,7);assert.equal(storage.fullRecords,20);assert.equal(storage.size.exact,true);assert.equal(combined.actualRuns,60);assert.equal(perf.records.length,90);assert.equal(perf.isolated,true);
assert.equal(data.lateContacts,0);assert.ok(data.maxProjectileError<.002&&data.maxWaveError<.002);
const paths=data.sourceFiles.map(p=>JSON.parse(gunzipSync(readFileSync(p))));
assert.ok(paths.every(p=>p.rows.length===300&&p.spec.signature===data.signature));
const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)],f=n=>Number(n.toFixed(3));
const stageText=a=>a.join('/');
const progression=['|빌드|기능|Run|레벨|Photon 잔고|Catalyst|도형 발견 수¹|Codex I/II/III/IV²|Insight|Elite 누적 생성|','|---|---|---:|---:|---:|---:|---:|---|---:|---:|'];
for(const row of data.summary.filter(r=>r.mode==='Normal'))for(const c of row.checkpoints.filter(c=>[5,20,50,100,200,300].includes(c.run)))progression.push(`|${row.strategy}|${row.feature}|${c.run}|${c.levels}|${c.bank}|${c.catalyst}|${c.uniqueEncounters}|${stageText(c.codexStages)}|${c.insight}|${c.eliteSpawns}|`);
const end=['|빌드|모드|기능|300회 레벨|Photon 잔고|Catalyst|해당 Run 파괴|해당 Run Photon|Insight|','|---|---|---|---:|---:|---:|---:|---:|---:|'];
for(const row of data.summary){const c=row.checkpoints.find(c=>c.run===300);end.push(`|${row.strategy}|${row.mode}|${row.feature}|${c.levels}|${c.bank}|${c.catalyst}|${c.kills}|${c.photon}|${c.insight}|`);}
const m11=paths.filter(p=>p.spec.feature==='M11'),codex=['|도형|300회 정상 처치 중앙값|기술 성공 중앙값|단계 중앙값|Stage III 이상 경로/45|실제 행동 조건|','|---|---:|---:|---:|---:|---|'];
const normal=m11.filter(p=>p.spec.mode==='Normal'),maxed=normal.flatMap(p=>{const row=p.rows.find(r=>r.levels===100);return row?[row.run]:[];});
for(const id of CODEX_IDS){const rows=m11.map(p=>p.rows[299].codex[id]);codex.push(`|${ADVANCED_SHAPES[id]?.name||id}|${median(rows.map(r=>r.kills))}|${median(rows.map(r=>r.techniques))}|${median(rows.map(r=>r.stage))}|${rows.filter(r=>r.stage>=3).length}/45|${TECHNIQUES[id]}|`);}
const elite=['|Elite|실제 생성|Primary 처치|안전 배치 시도|','|---|---:|---:|---:|'];
for(const[id,d]of Object.entries(ELITES)){const r=data.eliteTotals[id]||{};elite.push(`|${d.name}|${r.spawned||0}|${r.kills||0}|${r.attempts||0}|`);}
const capRuns=paths.reduce((n,p)=>n+p.rows.filter(r=>Object.values(r.caps).some(n=>n>0)).length,0),peaks={};
for(const key of ['shards','waves','scheduled'])peaks[key]=Math.max(...paths.map(p=>Math.max(...p.rows.map(r=>r.peaks[key]))));
assert.ok(peaks.shards<=150&&peaks.waves<=64&&peaks.scheduled<=1024);
const performanceTable=['|모드|Rank|Run당 update p95 중앙값(ms)|파괴 중앙값|','|---|---:|---:|---:|'];
for(const mode of ['M10','M11_OFF','M11_ON'])for(const rank of [0,4]){const rows=perf.records.filter(r=>r.mode===mode&&r.rank===rank);performanceTable.push(`|${mode}|${rank}|${f(median(rows.map(r=>r.tickP95ms)))}|${median(rows.map(r=>r.kills))}|`);}
const unit=readFileSync('artifacts/m11-unit-final-current.txt','utf8');assert.match(unit,/307/);assert.match(unit,/fail\s+0|307.*passed|307.*PASS/i);
writeFileSync('docs/Shard_Storm_M11_Balance_Report.md',`# M11 Collection & Advanced Shapes — Balance Report

## 실험 범위와 재현

총 **54,000 실제 전투·정산 Run / 180경로**. 5시드(31415/1/7/42/99)×3빌드×Normal/Adaptive/Anomaly×M8/M9/M10/M11×각300Run입니다. 코드 서명 \`${data.signature}\`. [집계](../artifacts/m11-balance-results.json)의 sourceFiles는 동일 서명의 gzip 체크포인트입니다. 모든 Fresh 경로는 지급 없이 실제 구매 가능할 때만 스킬·Relic·Evolution을 구매합니다. Extra Time은 구매에 따라20~32초입니다. M10의20초 고정 실험과 섞지 않습니다.

동일 Run번호는 seed+Run×7919, 같은 자동 조준 정책을 사용합니다. Anomaly는 저장된 후보에서 선택하며, Adaptive는 격리된 실험 생성 설정입니다. M8/M9/M10 대조 경로는 신기능 flag를 끈 실제 현재 구현이므로 과거 마일스톤 원본과 구분합니다. 사용자 저장에 접근하지 않았습니다. 실험 체크포인트는 측정 후 큰 이벤트 배열만 생략하며, 실제 저장은 전체 내용을 무손실 보존합니다. 자동 입력 결과는 사람의 재미·3~4시간 유지·공략 다양성의 증거가 아닙니다.

## 최초5~300회 성장 — Normal, 시드5개 중앙값

${progression.join('\n')}

¹생성되어 화면에서 만난 유니크 도형입니다. Codex 발견 완료와 다릅니다. ²각 단계 이상을 달성한 도형 수이므로 I/II/III/IV 열은 중첩 누적치입니다. M11 OFF 경로의 Codex0은 의도된 대조 조건입니다. 각 열은 개별 중앙값이므로 동일한 한 계정의 스냅샷을 뜻하지 않습니다.

## 300회 빌드·모드 비교

${end.join('\n')}

## 19개 고유 행동 과제와 장기 목표

M11이 켜진45경로만 집계했습니다. 기술 조건 단위 테스트는19종 모두 양성·음성을 검증합니다. 자동 조준에서0회인 조건을 자연 성장 성공으로 보고하지 않습니다.

${codex.join('\n')}

## Elite 자연 등장과 처치

${elite.join('\n')}

위 수치는 실제 성장 경로에서 해금·Run200처치·안전 배치를 통과한 사건입니다. 별도 단위/Chrome fixture는 이 수에 포함하지 않습니다.6종 전체의 Rank/insight/원자적 배치/처치 보상/실패 fallback/Run당1회는 통제 테스트에서 검증했습니다. Primary의native Raw+50/Catalyst+3만 추가하고, Codex는 Photon/Catalyst를 지급하지 않습니다.

실제 고급 기능 카운터: \`${JSON.stringify(data.advancedActivations)}\`. 이는 정의 호출이 아닌 실제 적용/이동/실행 지점에서 계측합니다.

## 안전 상한과 성능

late contact ${data.lateContacts}, 최대 projectile 오차 ${data.maxProjectileError}px / wave ${data.maxWaveError}px. 상한을 만난 Run ${capRuns}/${data.actualRuns}, 종류별 \`${JSON.stringify(data.caps)}\`. 실제 peak \`${JSON.stringify(peaks)}\`;150shards/64waves/1024scheduled/400chainEvents/10depth/512tickIterations를 유지했습니다. 기존512 iteration cap에 도달하면 남은tick 물리가 생략될 수 있습니다. 이 제한을 숨기거나 cap을 늘려 통과시키지 않았습니다.

성장 worker 종료 후 별도 단독90Run(5시드×Rank0/4×3빌드×M10/M11 OFF/ON)에서 M10 커밋2f75e4f와 M11 OFF의 파괴/Raw/Photon이 모두 동일했습니다. Rank0은0레벨/빈 장착, Rank4는49MAX+Signature3+Evolution2+Relic2+insight19를 주입한 강화 fixture입니다. ON은 신규 도형/Elite 조건을 실제로 적용합니다. 이 표는 인간의 자연 해금 속도나 모든 조합의 최악 부하를 뜻하지 않습니다. 완전 조합은 별도60Run FX ON/OFF에서도 전투·Codex·Elite 결과 일치를 확인했습니다. update CPU만 측정하며 Chrome FPS가 아닙니다.

${performanceTable.join('\n')}

## 밸런스 변경과 사람 검증

기존 가격·Refinery 변환율·자산은 유지했습니다. 새 도형의HP/Raw/확률과trait확률,Elite보상은 PRD 초기값입니다. 수정한 것은 피해 출처 분류·시점·중복 차단 오류이며 포괄적인 성장 둔화가 아닙니다. 세이브 용량은 사용자 승인에 따라 같은 키의 무손실 LZ4/base64로 해결했습니다. 실제20개 완전 기록 ${storage.size.rawCharacters.toLocaleString()}문자→${storage.size.packedCharacters.toLocaleString()}문자, 손상 원본/내보내기/정산1회 검증 PASS입니다. 압축해도 origin 할당량은 유한하며 저장 실패 시 원본을 보존하고 경고합니다.

추가로 현재 M11 MAX49/Signature3/Evolution2/Relic2,3빌드의 서로 다른 seed32초 전투20회를 실행했습니다. 완전 기록 ${currentStorage.rawCharacters.toLocaleString()}문자→${currentStorage.packedCharacters.toLocaleString()}문자, 실제 Chrome 동일 키 저장·새로고침2회·은행/49스킬/20기록 보존 PASS입니다. 이는 별도 강제 성장 fixture의 저장 stress이며 자연 성장이나 사람 포인터 전투가 아닙니다.

현재 경제에서 주의할 수치는 후반 구매 소진과 재화 잉여입니다. Normal15경로 중 ${maxed.length}경로가300회 안에100레벨을 모두 구매했고, 완료 경로의 최초100레벨 Run 중앙값은 ${maxed.length?median(maxed):'없음'}입니다. Normal300회 Photon 잔고 중앙값 ${median(normal.map(p=>p.rows[299].bank))}, Catalyst ${median(normal.map(p=>p.rows[299].catalyst))}입니다. Codex는 이 잉여를 소모시키는 강화 시스템이 아니라 행동 목표입니다. 사람의 구매 정체·기술 공략 빈도를 확인하기 전에는 일괄 가격 변경으로 이 차이를 덮지 않습니다.

사람은 Phase 창을 기다릴 이유, Shifter 예고 뒤 조준·Portal 경로·Prism 파동을 활용하는 선택,19개 기술 설명의 이해,2개 pin의 유용성,insight 문턱에 따른 Elite 정체,Signature3/Evolution2 교체의 재미를 확인해야 합니다. 자동 조준이 놓친 기술의 접근성을 우선 관찰하고, 그 전에는 목표 수치나 기존 가격을 임의로 낮추거나 올리지 않습니다.
`,'utf8');
writeFileSync('docs/Shard_Storm_M11_Implementation_Report.md',`# M11 Collection & Advanced Shapes — Implementation Report

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

Chrome ${browser.browser} 실제20초7Run(자연 fresh1+명시된 도형 fixture6), 실제 mouse click/hold/drag/Focus/620px Replay, Codex/Elite/49노드, 콘솔 오류0. 추가 실제 포인터로 Phase guard 직접0→취약 첫 타2(Reinforced)→다음3을 확인했습니다. Codex19badge/19title/19border는 획득을 주입한 표시용 fixture로 검증했으며 자연 성장 증거가 아닙니다.

[Portal](../artifacts/m11-portalGate-overview.png) · [Phase](../artifacts/m11-phaseCrystal-overview.png) · [Shifter](../artifacts/m11-shifter-overview.png) · [Prism](../artifacts/m11-prismLens-overview.png) · [Codex](../artifacts/m11-prismLens-codex.png) · [Elite](../artifacts/m11-elite-collection.png) · [Mastery 표시 fixture](../artifacts/m11-codex-mastery-fixture.png) · [620px 결과](../artifacts/m11-prismLens-narrow-result.png) · [저장 원본 보호](../artifacts/storage-recovery-original.png).

54,000Run/180경로와60강화 조합 FX A/B, 단독90Run 성능/OFF 정확 일치가 PASS입니다. [Balance Report](Shard_Storm_M11_Balance_Report.md)에 실제50/100/200/300 성장·자연 기술/Elite 빈도·상한·제한을 기록했습니다. 기존 회귀와 브라우저 재실행은 artifacts/m11-regression에 분리해 이전 보고서 증거를 덮어쓰지 않습니다.

현재 코드의 기존 benchmark20/기본 balance486/M5M6 1573/M7M8 650(230성장 smoke+420효과 비교)/M9 smoke165/M10 smoke240도 PASS입니다. 현재 Chrome 총24실제20초 Run은 M11 7+M9 5+M7M8 6+M10 6이며 모두 콘솔 오류0입니다. [집계](../artifacts/m11-browser-qa-summary.json). M7/M8의 과거19노드 기대값은49개와 기존19노드 모두의 보존 검사로 갱신했습니다. 클릭 후100ms 내 응답에 의존하던 timer 검사는 실제 기본20초 설정을 직접 확인하도록 고쳤고 최종20초·정산 검사는 유지했습니다. 이 실패와 수정 후 결과를 함께 보존했습니다.

## 발견한 오류와 수정

복사 피해가 main의 small=false를 물려 Hollow에2피해를 주던 오류를 복사 최대1로 고쳤습니다. Phase 보호 direct0이 Reinforced 방어를 소모하지 않도록 판정 순서를 고쳤습니다. Shifter 전후 motion 구간을 분리해 teleport 중 허위 보간을 차단했습니다. Lens sector를 nativeWave로 잘못 세거나 실행하지 않은 파동을 Codex로 인정하지 않습니다. 길어진 기록의 실제 Chrome QuotaExceededError를 재현하고 승인된 전체 무손실 압축으로 해결했습니다.

## 남은 한계와 후속

기존512 tick iteration 상한과 유한 localStorage 할당량은 유지합니다. 자동 전투와 격리 fixture는 사람의 재미 검증이 아닙니다. 고비용 Bloom/Shader/도형별 조립 생성/진짜 물리 슬로모션/논리 Arena 확장/전용 audio는 [Deferred TODO](Shard_Storm_Deferred_VFX_TODO.md)로 남겼습니다. 사람은 목표 설명·조준 순서·희귀 기술 정체·빌드 교체 후 재도전 의향을 검증해야 합니다.

실제 사용자 검증의 조건·질문·기록 표는 [사람 플레이 가이드](Shard_Storm_M9_M11_Human_Playtest.md)에 구분했습니다.

브랜치 feat/m9-m11-content-expansion. M11/codec 통합 커밋 d0834c5, 최종 QA와 보고서는 이후 커밋에 기록합니다.
`,'utf8');
console.log('M11 full evidence reports written');
writeFileSync('artifacts/M9_M11_Evidence_Index.md',`# M9.0~M11 QA evidence

## Canonical completed growth datasets

- M9: m9-balance-results.json,38,250 actual Runs/165paths. Historical milestone source; see ../docs/Shard_Storm_M9_Balance_Report.md.
- M10: m10-balance-results.json,72,000 actual Runs/240paths; signature ${read('artifacts/m10-balance-results.json').signature}. Use only this JSON's sourceFiles as its full matrix. m10-frozen-logs preserves earlier smoke/resume logs with their own labels.
- M11: m11-balance-results.json,54,000 actual Runs/180paths; signature ${data.signature}. Every referenced checkpoint has300 distinct actual battle/settlement rows. m11-frozen-logs includes historical superseded smoke/partial attempts; they are not added to54,000.
- M10 Form control comparison: m10-form-comparison.json,200 injected MAX-profile Runs; this is not a natural-purchase growth experiment.

## Current integration regressions

- m11-unit-final-current.txt:307 unit tests PASS,0fail/skip.
- m11-browser-qa-summary.json:24 actual20s Chrome pointer Runs,0console errors. M11 seven plus m11-regression/browser-verified M9 five/M7M8 six/M10 six. Controlled profiles are labeled in every source.
- m11-ui-browser-results.json: actual Phase/Reinforced pointer checks and injected Codex cosmetic display coverage. This does not prove naturally earned mastery.
- m11-regression/result.json: benchmark20, balance486, M5M6 1573, M7M8 smoke650(includes420effect comparisons), M9 smoke165, M10 smoke240. These are separate from completed growth datasets. Source files with -1.json.gz are smoke checkpoints.
- m11-regression/browser, browser-followup, browser-final: retained failed historical harness attempts (old19-node expectation and brittle wall-time assertion). browser-verified is the successful final regression set. Do not count failed attempts as extra passing Runs.

## Storage and performance

- storage-codec-browser-results.json: old20 complete records, lossless current encoding, pending once, corruption preservation and exact original export.
- storage-current32-results.json:20 distinct current MAX32s battle records, all events retained, actual private Chrome same-key storage and two reloads with full-history SHA-256 equality. Node combat fixture; not20 human/browser pointer battles.
- m11-performance.json / m10-performance.json: isolated=true final CPU workloads,90Runs each. Update CPU is not browser FPS. M11's Rank4 fixtures include3Signatures/2Evolutions/2Relics and19insights.
- m11-regression/m11-parity-precheck.json and m11-full-build-parity-precheck.json: earlier functional parity, isolated=false timings under growth workers; do not use their timing as final performance.
- m11-combination-results.json:60 actual combined MAX-profile Runs with exact combat/Codex/Elite FX ON/OFF parity.

## Historical preservation

m11-integration-source.zip / m11-integration.patch and old work logs preserve pre-integration progress and the resolved storage human gate. Actual production integration is in the repository source, not only that archive. Current status comes from the newest implementation reports and README. All automatic input/fixtures remain distinct from real human enjoyment/retention testing.
`,'utf8');
