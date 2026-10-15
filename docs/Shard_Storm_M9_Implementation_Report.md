# M9 Shape Ecology 구현·검증 기록

상태: **M9 구현·자동 QA 완료**. M9.0은 `ab47fbc`, M9 핵심 기능은 `ce050d9`, 검증 보강은 `05b7dd4`입니다. 브랜치는 `feat/m9-m11-content-expansion`입니다. M10·M11은 미완료이며, [Catalyst Extraction 규칙 확인](Shard_Storm_M10_Rule_Decision.md) 후 계속 진행합니다. 전체 M9.0~M11 완료 보고가 아닙니다.

## 실제 구현

기존 7종에 Splitter/Fuse Bomb/Conductor/Mirror/Gravity Well/Repair Node를 추가했습니다. HP·BonusRaw·반경·Rank/Tier·확률·종별 cap은 PRD를 따릅니다. 기존 M6 특수 추첨을 보존하며 독립 ecology RNG, trait RNG, formation RNG를 사용합니다. 신규 특수 alive 상한은 7입니다.

- Splitter는 .06초 후 안전 좌표에 Echo 2개를 시도합니다. Run20/live6/전체 밀도 상한을 지키며 실패 시 겹쳐 생성하지 않습니다. Echo는 HP1·반경16, Raw0 정책입니다. 화면 콤보에는 기여하지만 일반 파괴·Run Tier·영구 파괴·광석·Catalyst·계약/Anomaly 조건에는 기여하지 않습니다. 자식이 살아 있는 동안 부모 Chain을 유지합니다.
- Fuse는 첫 양수 실제 피해에서 .70초 점화, 사망 시 .08초 조기 폭발을 예약합니다. 버전으로 오래된 타이머를 무효화하며 100px/피해2 파동은 도형당 1회입니다.
- Conductor는 생성 시 가장 가까운 일반 대상 2개를 고정합니다. 사망 .04초 뒤 현재 생존·115px 범위 내 대상에 피해2, Chain당 node 4개입니다. 사라진 대상을 새로 선택하지 않습니다.
- Mirror는 실제 main shard 접촉에서 일반 피해 후 같은 projectile을 최대70도로 전환합니다. 도형당2회, projectile-target 중복 적중을 막습니다. Gravity는 가장 가까운 생존 well 하나로 틱6도·파편 누적30도 제한을 적용하고 실제 짧은 swept segment로 충돌을 계산합니다. auxiliary는 제외합니다.
- Repair는 .85초마다 105px 내 손상 비율이 큰 일반 대상2개를 HP1씩 복구합니다. 대상당 Run2HP, maxHP를 지키고 게임 시간·일시정지를 따릅니다.

Reinforced/Volatile/Reflective/Hollow는 독립 secondary 슬롯 하나를 사용합니다. 기존 primary의 RNG·배타 규칙을 유지하고 금지 조합은 재추첨하지 않습니다. 외곽 아이콘·연결선·핵·Fuse 경고를 Canvas로 표시합니다. 생성 중 grace와 fade를 공유합니다.

Ring/Chain Corridor/Shield Fortress/Bomb Garden은 기존 배치와 공존합니다. 일반 적격 추첨은 기존80/신규20이며, 첫 소개는 기작에 맞는 배치를 우선합니다. 이상 좌표가 실패한 경우 실제 배치를 scattered로 기록합니다. 배치 예약도 기존 batch3와 안전 간격을 지킵니다.

소개 상태는 실제 안전 등장 후 정산에서만 확정합니다. 저장 키를 유지하며 schema1..5를 schema6으로 읽고 기존 재화·19개 스킬·Relic·Contract·Anomaly·미완료 정산을 보존합니다. 실험은 메모리 sandbox입니다. Adaptive .18/.16은 개발 실험에만 있으며 실제 기본 .20×3, 가격과 Refinery .06은 유지했습니다.

## 검증과 수정

- 재시작 후 `npm test`: **179 PASS / 0 FAIL**, 기존153개 유지. 로그: `artifacts/m9-unit-final.txt`. Mirror+Ricochet Coil의 같은 projectile 반사·벽 bounce 보존 및 auxiliary→Echo의 보상/재분열 차단을 추가 검증했습니다.
- Chrome155.0.8059.79 단독 실제20초 포인터5Run, 콘솔/page 오류0. Rank0 자연 프로필과 Rank1..3/복합 기작 fixture를 구분합니다. `artifacts/m9-browser-results.json`, `artifacts/m9-fixture-six-shapes.png`, `artifacts/m9-browser-isolated.txt`. 화면 촬영·스크롤로 홀드가 해제될 때 실제 포인터를 다시 눌러 입력을 이어 주며 일반 Run별 실제 공격70회 이상을 단언합니다. 실게임의 이탈·포커스 상실 홀드 중지는 보존했습니다. 진단 snapshot에 held/클릭 횟수만 추가했습니다.
- `npm run benchmark`:60초720/13625Raw·844/15291Raw,20초164/163Photon·193/174Photon 골든 유지. `benchmark:balance`486Run PASS, `benchmark:m5-m6`1573Run PASS, `M7_RUNS=1 benchmark:m7-m8`650Run PASS(230성장 smoke+420효과 비교; 과거69,420회로 보고하지 않음). 새 결과는 `artifacts/m9-regression`과 명령 로그에 보존하고 과거 원본 경로는 유지했습니다.
- `qa:m7-m8`:기존 Relic·Contract·Anomaly 실제20초6Run, 오류0 PASS. 로그 `artifacts/m9-m7-m8-browser-final.txt`, 원본 결과 `artifacts/m9-regression/m7-m8-browser-results.json.gz`. 해당 명령이 생성한 과거 이름의 이미지들은 과거 기준본으로 유지하며 최신 M9 화면은 m9-prefix PNG입니다.
- `benchmark:m9`:**38,250 실제 Run /165경로** PASS.5seed×3build×Fresh/LegacyMax×20/ExtraTime×M8/M9를300회씩, Adaptive/Anomaly 추가45경로50회씩 실행했습니다. 재시작 시15,160회 정상 checkpoint를 검증하고23,090회 완성 기록을 추가했습니다. [최종 밸런스](Shard_Storm_M9_Balance_Report.md), `artifacts/m9-balance-results.json`과165개 sourceFiles를 확인하세요. 해시 `f335fad554c688407f4c8d811c18748d457b17863c5778c1c01b4ecdafd11c4c`.
- `node tests/m9-performance.mjs`:단독90실제Run PASS. M8/현재 OFF는 kills·Raw·Photon 정확히 동일합니다. Rank4 tickP95 중앙값 M8 .151ms, M9 ON .158ms(업데이트 CPU만, Chrome FPS 아님).
- 신규 단위 검사는 각 기작의 양성·음성 조건, 타이머/사망/종료·상한, trait 호환, 안전 배치·fallback, 소개 정산1회, schema 보존, OFF 골든, cosmetic parity 및 도형 조합을 검증합니다.
- 발견해 수정한 오류: 생존 Echo의 Chain이 조기 제거됨, Echo 뒤 일반 사망에서 Chain 계약 조건이 잘못 충족될 수 있음, 마지막 Echo 사망의 FieldClear 누락, Shape/Projectile 숫자 ID가 같을 때 Gravity 후보 제외, 첫 소개 배치가 일반 확률 추첨에 가려짐, radial 장식의 HUD 침범. 각각 코드와 회귀 검사를 추가했습니다.
- 이전 소스로 실행한 중단 실험은 `artifacts/m9-pre-fix-checkpoints.zip`에 원본과 SHA manifest를 보존했습니다. 완료 근거에 합산하지 않습니다. 현재 성장 실험은 의존 파일 해시와 경로별 저장 상태를 확인하여 이어 실행합니다.

## 사람 검증과 후속 범위

기존 반복 처리512/tick 상한은 M8 1,222/18,000Run, M9 1,224/18,000Run에서 작동합니다. 잔여 slice의 물리가 생략될 수 있는 기존 기술적 제한을 보고서에 공개했습니다. 상한을 늘려 숨기지 않았습니다. 전체 실험의 접촉 오차는 약.000001px 이하, late contact0입니다. 정상 스폰 실패7,585회도 강제 겹침 대신 안전 fallback한 계측으로 남깁니다.

세 빌드의 Fixed20 Fresh는50Run에 기존50Lv MAX,300Run Photon bank 중앙값 약162,217~163,652입니다. 후기 성장 소진·잉여는 여전히 문제입니다. Normal/Adaptive 비교는 동일 seed·첫50Run끼리 맞추며 기본 생성·가격·변환율은 바꾸지 않습니다.

자동 조준과 Chrome 포인터 자동화는 사람의 재미 검증이 아닙니다. 사람 플레이에서는 Fuse/Conductor를 먼저 노리는 선택이 읽히는지, Mirror·Gravity의 파편 경로를 이해하는지, Repair 우선 처치가 유효한지, Echo와 실제 보상을 혼동하는지, 20초 안에 처음 본 기작을 파악하는지 확인해야 합니다.

정교한 재질·전용 사운드·도형별 복합 생성 애니메이션·실제 물리 slow motion·Shader는 [Deferred VFX](Shard_Storm_Deferred_VFX_TODO.md)에 남깁니다. M10의30개 스킬/Signature/Evolution과 M11의6개 도형/Codex/Elite는 별도 다음 단계로 계속 구현합니다.
