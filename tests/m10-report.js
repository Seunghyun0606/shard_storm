import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const data=read('artifacts/m10-balance-results.json'),browser=read('artifacts/m10-browser-results.json'),forms=read('artifacts/m10-form-comparison.json');
assert.equal(data.passed,true);assert.equal(data.actualRuns,72000);assert.equal(data.sourceFiles.length,240);assert.equal(browser.passed,true);assert.equal(browser.runs.length,6);assert.equal(forms.actualRuns,200);
const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)],paths=data.sourceFiles.map(p=>JSON.parse(gunzipSync(readFileSync(p))));
assert.ok(paths.every(p=>p.rows.length===300&&p.spec.signature===data.signature));
const table=['|빌드|기능|Run|구매 레벨|남은 노드|Photon 잔고|Catalyst 잔고|그 Run 파괴|그 Run Photon|','|---|---|---:|---:|---:|---:|---:|---:|---:|'];
for(const row of data.summary.filter(r=>r.profile==='Fresh'&&r.time==='Fixed20'))for(const c of row.checkpoints.filter(c=>[5,20,50,100,200,300].includes(c.run)))table.push(`|${row.strategy}|${row.feature}|${c.run}|${c.levels}|${c.remainingNodes}|${c.bank}|${c.catalyst}|${c.kills}|${c.photon}|`);
const late=['|계정|시간|빌드|기능|300 Run 잔고|Catalyst|소유 Evolution 수|','|---|---|---|---|---:|---:|---:|'];
for(const profile of ['Fresh','LegacyMax'])for(const time of ['Fixed20','ExtraTime'])for(const strategy of ['Crusher','Cascade','Reactor']){
 const set=paths.filter(p=>p.spec.profile===profile&&p.spec.time===time&&p.spec.strategy===strategy&&p.spec.feature==='Evolution2');
 late.push(`|${profile}|${time}|${strategy}|Evolution2|${median(set.map(p=>p.rows[299].bank))}|${median(set.map(p=>p.rows[299].catalyst))}|${median(set.map(p=>Object.values(p.rows[299].evolutionOwned).reduce((n,a)=>n+a.length,0)))}|`);
}
const comparison=['|계열|형태|20초 파괴 중앙값|32초 파괴 중앙값|','|---|---|---:|---:|'];
for(const family of [...new Set(forms.rows.map(r=>r.family))])for(const form of [...new Set(forms.rows.filter(r=>r.family===family).map(r=>r.form))])comparison.push(`|${family}|${form||'NONE'}|${median(forms.rows.filter(r=>r.family===family&&r.form===form&&r.duration===20).map(r=>r.kills))}|${median(forms.rows.filter(r=>r.family===family&&r.form===form&&r.duration===32).map(r=>r.kills))}|`);
const capRuns=paths.reduce((n,p)=>n+p.rows.filter(r=>Object.keys(r.caps).length).length,0),allForms=paths.filter(p=>p.spec.feature==='Evolution2').flatMap(p=>p.rows.filter(r=>Object.values(r.evolutionOwned).reduce((n,a)=>n+a.length,0)===15).slice(0,1).map(r=>r.run));
writeFileSync('docs/Shard_Storm_M10_Balance_Report.md',`# M10 Skill Expansion — Balance Report

## 방법과 증거

총 **${data.actualRuns.toLocaleString()} 실제 전투·정산 Run / 240경로**. 5시드×3빌드×Fresh/LegacyMax×기본20초/Extra Time×M9/PermOnly/Signature3/Evolution2. 코드 서명 \`${data.signature}\`. 각 경로300회, 동일 Run번호는 동일 seed+Run×7919와 같은 자동 조준 정책을 사용했습니다. Fresh는 지급 없이 구매 가능 시에만 성장합니다. LegacyMax는 기존19스킬 MAX와 초기10000 Photon/200 Catalyst를 주입한 비교 계정입니다. 실제 사용자 저장은 사용하지 않았습니다.

Fixed20은 Extra Time 구매와 별개로 전투를20초에 고정합니다. ExtraTime 경로는 구매 레벨에 따라20~32초입니다. 결과는 시드5개 중앙값이며 자동 입력의 성능이지 사람의 재미가 아닙니다. 원본: [집계](../artifacts/m10-balance-results.json), sourceFiles의 gzip 체크포인트.

## Fresh / 20초 고정 성장

${table.join('\n')}

## 후반 경제와 Form 소유

${late.join('\n')}

Evolution 전15형태의 합계 비용은31500 Photon/450 Catalyst이며 각 형태를 소유해도 동시에2계열만 활성화합니다. 전15형태를 실제 구매한 경로의 최초 구매 완료 Run 중앙값: ${allForms.length?median(allForms):'300회 안에 완료한 경로 없음'} (완료 경로만의 통계). 기본 스킬 가격·기존 재화·Refinery 변환율은 일괄 변경하지 않았습니다. 자동 조준의 효율로 생긴 후반 잉여를 사람에게 동일하게 적용하지 않습니다.

## A/B/C Form 통제 비교

별도200Run: 5시드×20/32초×5계열×NONE/A/B/C. 같은 계열 내 동일3 Signature·Coil/Governor·49스킬 MAX fixture. 구매 비용이나 자연 성장 속도는 이 비교에서 추정하지 않습니다.

${comparison.join('\n')}

## 정확성·성능 한계

late contact ${data.lateContacts}, 최대 projectile contact error ${data.maxProjectileError}px, wave ${data.maxWaveError}px. 안전 상한을 실제로 만난 Run ${capRuns}/${data.actualRuns}; 종류별 합계 \`${JSON.stringify(data.caps)}\`. 기존150shards/10depth/400chainEvents/64waves/1024scheduled/512tickIterations는 유지했습니다. 병렬 성장 worker의 CPU 수치를 브라우저 FPS나 격리 성능으로 해석하지 않습니다. 기존512 iteration cap에 도달하면 남은 tick 구간이 생략되는 제한은 그대로 기록합니다.

## 조정 판단과 사람 검증

가격·변환율 일괄 인상이나 기존 자산 초기화는 하지 않았습니다. Catalyst Extraction만 사용자 승인 A안(직접 Hex/Reactor 처치로 시작한 동일 Chain의 이후 정상10킬)으로 확정했습니다. 가격850 Photon/8 Catalyst, Run 지급 상한1/2는 명세대로 유지합니다. 다른 Chain과 Echo는 포함하지 않습니다.

사람은 Signature3·Evolution2의 기회비용이 읽히는지, Focus Strike의 공격 간격 손해·Pull의 거리 손해·Quick의 피해 손해가 실제 선택을 만드는지, Form 미구매 상태가 성장을 부당하게 막는지, 후반 잉여가 생겨도 다른 빌드를 시험할 이유가 있는지 확인해야 합니다. M11의 행동 수집·Elite는 별도 검증하며 사람의 재미를 자동 입력으로 확정하지 않습니다.
`,'utf8');
writeFileSync('docs/Shard_Storm_M10_Implementation_Report.md',`# M10 Skill Expansion — Implementation Report

## 구현 상태

49개 노드/100개 구매 레벨(기존19+신규30), Signature10종 중 최대3개, Evolution5계열×3형태 중 최대2계열을 연결했습니다. 구매와 활성화는 별도이며 미소유 자동 장착은 없습니다. 기존 가격·스킬·세이브를 보존했습니다. schema1~6→7에서 신규 영역만 정규화하고 pending 정산은 재계산하지 않습니다.

## 핵심 변경 파일

- expansion-defs.js/builds.js/build-ui.js: 정의·가격·선행조건·소유·활성 슬롯·프리셋·UI.
- expansion.js/game.js/content.js/ecology.js/effects.js: 신규30 실제 전투·경제 발동, 벽 접촉 시점 분할, 정확한 lineage·실행 카운터·중복 방지,15 Form 합성.
- config.js/storage.js/progression.js/settlement-validation.js: schema7과 기존 pending 보존, Refinery Calibration 별도 가산·검증·1회 정산.
- app.js/index.html/renderer.js/skill-tree.js/style.css: 49노드 그래프, 검색·분기, 활성 표시, 레벨 전후 효과,620px/Focus UI.
- tests/m10*:30능력·15형태·저장·슬롯·정산·A안 테스트,240경로 성장,200Run Form 비교, 실제 Chrome QA.

## 검증

단위 **236 PASS / 0 FAIL / 삭제·skip 없음** ([로그](../artifacts/m10-unit-final.txt)). Chrome ${browser.browser} 실제20초6Run PASS, 콘솔 오류0 ([결과](../artifacts/m10-browser-results.json)). Fresh만 자연 계정이고 나머지 빌드는 명시된 격리 fixture입니다. 전체 성장72000Run과 Form 비교200Run PASS. 기존 benchmark(legacy18+short2), balance486Run, M5/M6 1573Run, M7/M8 650Run smoke와420효과 A/B, M9 165Run smoke PASS. 이전 마일스톤의 전체 장기 결과는 별도로 보존했습니다.

스크린샷: [49노드](../artifacts/m10-49-skill-tree.png), [검색](../artifacts/m10-skill-search.png), [빌드 슬롯](../artifacts/m10-signature-evolution-title.png), [좁은 결과 화면](../artifacts/m10-Signature3-narrow-result.png). 검색 결과가 그래프 아래에서 잘리던 문제를 compact 배치로 수정했습니다.

## 확인·수정한 문제

원래 Catalyst Extraction 조건은 매 클릭 새 Chain을 만드는 전투와 충돌했습니다. [사용자 승인 A안](Shard_Storm_M10_Rule_Decision.md)을 실제 Game.attack과 이후 Reactor 연쇄로 검증했습니다. 다른 Chain/Echo/기한 이후 지급은 없습니다. 사전 벽 미리보기로 Momentum을 너무 일찍 발동하지 않도록 실제 벽 접촉에서만 처리했습니다. 보조 proc의 native/stage 분류와 Relic 재귀 플래그, 방어 보너스의 공유 cause 잔존, Ancient 다중 문턱을 수정했습니다.

## 남은 범위

고비용 전용VFX·Shader·물리 slow motion은 Deferred TODO입니다. M11 Portal/Phase/Prism의 추가 연동·Codex·Elite는 M11 보고서에서 검증합니다. 자동 QA는 사람의 재미나 장기 유지 시간을 입증하지 않습니다. 브랜치 feat/m9-m11-content-expansion, 전투 통합 커밋2f75e4f. 경제 수치는 [Balance Report](Shard_Storm_M10_Balance_Report.md)를 참조하세요.
`,'utf8');
console.log('M10 full evidence reports written');
