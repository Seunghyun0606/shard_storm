# Shard Storm — M11 Collection & Advanced Shapes PRD v1.0

- 작성: 2026-10-15
- 기준 M10 완료: 기존7 + M9 6 = Shape13종, 기존 M8 Modifier3 + M9 secondary trait4, Skill49노드/100Lv, Signature10(활성3), Evolution5Family×3(활성2), Relic6(장착2), Contracts10, Anomaly6.
- 본 단계 목표: **고급 Shape 6종을 추가해 총19종**, secondary Trait4종 추가(신규8종), **Shape Codex 19종×4단계=76 discovery objectives**, Elite Encounter 6가지 프리셋, 지속적인 장기 목표·체험 및 QA.
- 기본20~32초 직접 공격·파편·순차파동·Refinery 및 기존 화면 혼합 spawn 유지. 별도 보스전/Stage/일일 숙제/유료 랜덤은 금지.
- M9.0의 저비용 FX 재사용. 최종 19도형별 전용 조립 애니메이션·Shader·고급 사운드는 TODO.

## 0. 콘텐츠와 경제의 역할

M8 300Run 자동실험에서는 19스킬·6Relic·기존 Contracts30단계가 다수 경로에서 고갈되는 문제, 후반 Photon/Catalyst 잉여가 관측됐다. M10 49노드를 모두 구매해도 플레이 다양성을 보장하지 않는다. M11은 도형 발견·상황별 조준·특이한 파괴 조합이 장기 목표를 담당한다.

- Codex는 보상 파밍이 아닌 **발견·행동과제**이며 무한 Photon 지급기가 아니다.
- 신규 도형은 각자 다른 결정(포털 활용, 피해 공유, 취약 타이밍, 특수 콤보, 움직이는 조준, 파동 굴절)을 요구한다.
- Elite는 독립 전투 화면/체력바 보스가 아니라 기존 Arena에 혼합 출현하는 **높은 가치의 복합타깃**이다.
- 기존 Rank0~4와 Run Tier0/15/45/100/200/400/750, ore/drift caps 유지. 나머지 M9 신생/원래 특수 도형은 그대로 존재.

## 1. 고급 Shape 6종 명세

추가 후 19종 목록:
Triangle/Square/Pentagon/Star/Hex/Reactor/Ancient(7) + Splitter/FuseBomb/Conductor/Mirror/GravityWell/RepairNode(6) + 아래6.

| key | 이름 | Rank/Run Tier | HP·native Raw·반경 | eligible chance/alive cap | 고유 기능 |
|---|---|---|---|---|---|
| portalGate | Portal Pair | R2/Tier2(45킬) | 각 Gate HP6/Bonus16/반경22 | Pair1.2% / pair≤1 | 2개 linked portal gate를 안전 장소에 생성, main shard 입구→출구를 1회 순간 전이 |
| parasiteLink | Parasite Link | R2/Tier3(100킬) | 8/22/25 | 2.0% / 2 | 연결된 일반 도형 최대2에게 실제 피해의 일부를 한번만 공유 |
| phaseCrystal | Phase Crystal | R3/Tier3 | 9/30/26 | 1.5% / 2 | 1.4s 주기 취약.9s/보호.5s, 보호 중 직접0·파동 최소1 |
| chainBeacon | Chain Beacon | R3/Tier3 | 10/32/28 | 1.2% / 2 | 동일 Chain10+ 달성 후 완전파괴하면 반경130/피해2 파동 |
| shifter | Shifter | R3/Tier4(200킬) | 7/24/24 | 1.7% / 2 | 1.3초마다 안전한 지점으로 25~35px 이동(0.2초 예고) |
| prismLens | Prism Lens | R4/Tier4 | 9/40/28 | 0.9% / 1 | native Square/Star wave 접촉 시 두 개의 지향성 보조 파동(120px/피해1)으로 굴절 |

- Chance는 각 적격 spawn attempt의 신규 type 선택 확률 가이드 초기값, rank+tier+cap 검사 선행. 기존 M9 6종의 발견률/동시 cap 훼손 금지.
- M9 intro director 재사용: 자격 충족 후 적격 Run3회 안에 각 신규 도형의 안전 소개 등장 시도. Rank 미충족/RunTier 미달이면 강제소환 금지.
- main world coords 960×540 논리 유지. 19종의 매우 큰 조합으로 공간이 부족할 때 safety-first fallback. 기본 보충율 수정X(별도 density experiment만).

### 1.1 Portal Pair

- 한 쌍의 Gate 2개를 **하나의 pairId, 서로 다른 shapeId**로 저장. 실제 생성은 모두 안전 조건을 통과한 후 원자적으로 commit; 하나라도 안전 배치 실패하면 둘 모두 취소, 정상 스폰으로 fallback.
- 두 입구 거리≥180px, world 영역 내, 포인터 hit radius와 graphics 일치. Pair당 alive2, concurrent pair≤1. 한 Gate 파괴되면 다른 Gate portal 능력 즉시 소거되지만 일반 도형으로 남아 파괴 가능.
- mainShard가 들어오는 쪽 Gate 경계에 실제 접촉하면 반대 Gate의 진행 방향을 보존한 안전 출구에서 계속 이동. 같은 shard pair당 순간이동 최대1회. exit 무적/자기 재귀 충돌0. 남은 거리·lifetime 보존, 다른 부가 파편/파동 전이X.
- 출구가 벽/Shape에 겹치면 전이 취소, 해당 Gate는 기존 피해 받을 수 있음. Gate별 Ore RNG는 첫 Gate만 eligible, 다른 한 쪽 common으로 고정하여 spawn attempt당 희귀 추첨 2배 exploit 방지. 두 Gate는 각각 native HP/Bonus 수익 정상 한 번.
- M10 Portal Momentum/Portal Calibration은 passage 후 remainingRange+25/50 또는 높은 HP 타깃 조준 조건으로 연동, 추가1회 제한.

### 1.2 Parasite Link

- 살아있는 주변 일반 도형(≤100px) 중2개를 링크. 직접/파편/파동 원래 target의 실제 양수피해가 적용될 때 **최대1HP**를 각 링크 대상으로 0.04초 뒤 복사(추가 피해 총2), source=parasiteCopied.
- copied damage는 다시 Parasite/전도/복사 트리거를 발동하지 않음, 원본 shapeId·attack eventId 귀속. 링크 파괴/거리 이탈/대상 사망 시 안전 해제.
- Parasite 도형 자체도 정상 타격·파괴 가능. Link visual은 UI/마우스 영역을 가리면 안 됨.

### 1.3 Phase Crystal

- spawnTime+seed별 phase offset. 1.4s cycle: vulnerable.9s / guarded.5s. guarded 중 direct damage0, wave/shard damage 최대1. true invulnerability와 partial wave resistance를 tooltip에 분명히.
- phase는 게임 elapsed 기준; OS tab hidden/pause 중 phase가 진행하지 않음. 피격 시점 실제 simulationTime에 취약 판정을 적용; 시각 pulse와 판정 동기화.
- M10 Phase Disruptor Lv1/2는 target 최초 실제 direct hit 이후 현재 취약 창+.1/.2s(phase clock in-run only)이며 스킬 없는 신규 플레이도 제거 가능.

### 1.4 Chain Beacon

- chainId별 kills≥10을 실시간 확인; 해당 Chain에서 Beacon이 실제 최종 사망했을 때, 이미 threshold 달성됐다면 death+.05초 rad130/dmg2 충격파1회.
- Chain threshold가 달성되지 않은 상태의 사망은 native bonus 외 별도 wave 없음. 다른 체인의 Chain10 상태로 허위 인정X.
- chain11/20/30이라도 동일 Beacon 파동1회. death wave가 다시 Beacon의 파동을 유발할 수 있으나 chain recursion cap 및 source lineage는 보존.

### 1.5 Shifter

- 1.3초마다 주변 안전 앵커25~35px로 짧은 leap, 출발0.2초전 예고 outline. 목적 좌표가 점유 중이면 그대로 머물며 다음 시도 예약.
- 이동 순간 geometry/poseAt/swept collision·입력 hit 위치를 새 좌표로 재평가, **old target coordinates에 남은 ghost hit0**. teleport는 연속 선형 비행이 아니므로 순간이동 동안 해당 구간의 projectile collision을 허위 보간하지 않는다.
- Rank/Contract counters는 생성/이동 자체가 아닌 실제 사망 이벤트를 집계.

### 1.6 Prism Lens

- Square/Star 고유 wave가 Lens에 실제 닿으면 원본 wave의 damage는 일반대로 적용하고, 0.04초 뒤 진행각 ±35° 방향의 폭120px 폭 좁은 sector wave 2개(피해1)를 한 번 생성.
- Lens당 native wave trigger 최대2/Run; 같은 wave ID로 재귀 발동X. Lens sector waves는 다시 Lens trigger되지 않고 source=prismRefraction, nativeWaveKills로 허위 분류X.
- 동적 motion segment first-contact/trigger ordering 보존. M10 Prismatic Cascade는 이 보조 경로가 생성한 main refraction projectile가 kill할 때만 발동(그냥 sector wave hit는 불충분)하며, spec 충돌이 있다면 Prism이 mainShard를 굴절시키는 별도 조건을 명시해 테스트. 기본 Lens wave refraction만 구현했다면 Prismatic Cascade와의 상호작용은 **추가되는 mainShard 정식 굴절 이벤트**를 필수로 추가하고 그 이벤트에서만 발동.
- 완전한 shader/렌즈 굴절 왜곡은 후속 TODO.

## 2. Modifier 추가4: 총 신규 Secondary Traits 8종

M9 신규 reinforced/volatile/reflective/hollow는 유지, M11 다음 4종 추가. 기존 Cracked/Charged/Enhanced는 원래 primary modifier로 유지. 한 도형은 primary≤1 + secondary≤1.

| Trait ID | Rank·eligible 확률 | 실제 효과 | 금지/제약 |
|---|---|---|---|
| polarized | R2+, 1.5% | 가장 가까운 동일 trait 대상1개와 polar link; 원래 거리≤105px일 때 mainShard 진행 방향 ±10° 바꾸는 static influence | Gravity Well/Portal Gate에 금지, samePair recursiveX |
| resonant | R3+, 2.0% | 같은 Chain에서 서로 다른 2회 wave hit가1초 안에 실제 발생하면 추가 wave 반경65/피해1(대상당1회) | Reactor/Ancient/Prism Lens에 금지, reflected aux는 wave 카운트X |
| timeLocked | R3+, 1.5% | 1.4s 주기로 취약1.0s/보호.4s; 보호중 첫 direct damage-1(최소0) | PhaseCrystal과 중복금지, spawn grace 추가 없음 |
| fragmented | R2+, 1.5% | 사망 시 auxiliary shard2개(피해1/65px), child 자체/자기 유발 보조 파편은 재발동X | Splitter/Echo/FuseBomb과 중복금지 |

- Spawn primary&secondary 서로 다른 gameplay RNG stream. 표 확률은 조건부 적격 attempt 당 weight; secondary4(M9 8%)+신규4(M11 6.5%) 전체 적격 최대14.5% (나머지 none). Rank·호환성 먼저 검증.
- 실제 동시에2 secondary trait 금지. visual-only modifier marks OFF는 보상과 공격 판정 불변, gameplay modifier toggle OFF는 다음 spawn에만 영향.
- 제외 매트릭스는 config 명시. 충돌된 trait는 RNG 재추첨하지 않고 none으로 fallback(시드 안정화).

## 3. Shape Codex 19종×4단계

### 3.1 보상 목적과 상태

- 별도 Result/Title의 Codex 탭, 모든19종 목록(미발견은 silhouette). 전투 화면에는 현재 추적 대상으로 pin한 최대2개의 한 줄 progress만 노출, pointer overlay 방해 금지.
- 한 Shape의 4단계: I=실제 정상 Run에서1회 완전 파괴하여 발견; II=실제 누적 파괴30회(Ancient는5회, Elite-special 미포함); III=고유 전술 Challenge 1회 달성; IV=일반 누적150회(Ancient20회)+고유 전술 Challenge 3회 누적.
- 발견과 카운트는 game.runRecord의 실제 사망 사건 + 고유 feat counter에서 **정산 성공 이후**만 반영. M9 Echo child/디버그 강제 생성/비실제 fixture는 live Codex 완료 불가.
- 보상: I 이름·정보 공개, II 고유 shape badge/아이콘, III 해당 Shape technique insight1 및 관련 Elite 시험 조건에 카운트, IV 작은 별칭·Codex 테두리(비게임플레이 코스메틱)만. **Photon/Catalyst 직접 보상 없음**, 우회 경제 성장을 막음.
- insight는 총19개까지 누적 유일 달성수로서 소비되지 않는다. 2/4/6/8/10/12 유일 technique 달성 시 서로 다른 Elite 프리셋 허용(아래). 별도 유료 점수/랜덤 강화 없음.
- Stage 건너뛰기 없음: II 미달일 때 III challenge가 먼저 발생했다면 진행 횟수를 로그에 저장하되 단계 완료는 순서대로 정산 때 표시. IV의3회는 Stage III 1회까지 포함되는지 명확히: **III 첫 회를 IV의3회 중1회로 인정**.

### 3.2 19개 고유 행동 Challenge 표

| Shape | Stage III 실제 행동(완료 카운터 기준) |
|---|---|
| Triangle | Triangle 원인 main shard chain에서 별개 Shape 5개 이상 사망 |
| Square | 동일 Square 고유 native wave 1회 발동이 실제로 Shape 3개 이상 사망시킴 |
| Pentagon | 하나의 Pentagon이 방출한 main shards 전체에서 합계5 킬 |
| Star | 동일 Star wave 1회로 고유 target 6개 이상 실제 접촉 |
| Hex | 하나의 Hex 죽음으로 Ward 대상 최소2개 실제 해제 |
| Reactor | 같은 Reactor의 HP6/사망 두 단계 wave가 전투 종료 전에 실제 발동 |
| Ancient | 하나의 Ancient HP22/15/7 세 단계 wave가 실제 발동하고 해당 Shape 완전파괴 |
| Splitter | 한 Splitter가 만든 Echo 2개가 같은 Chain 안에서 완전 파괴됨 |
| FuseBomb | Fuse 2개가 한 Chain에서1초 이내 실제 폭발 |
| Conductor | 한 Conductor 사망 전도에서 적격 일반 Shape 2개에 실제 피해 도달 |
| Mirror | 같은 Mirror에서 mainShard 실제 반사가 발생하고 이후 mainShard kill |
| GravityWell | 한 mainShard가 Gravity bend를 받아 다른 Shape를 실제 완전 파괴 |
| RepairNode | 한 RepairNode가 HP를 누적2 이상 실제 치유한 뒤 정상 파괴됨 |
| PortalGate | 1개 mainShard가 portalPair를 실제 통과한 후 다른 정상 Shape를 kill |
| ParasiteLink | 한 Parasite Link 복사피해가 2개 서로다른 대상에 실제 도달 |
| PhaseCrystal | 취약 phase에서 직접 최종타로 PhaseCrystal 파괴 |
| ChainBeacon | 동일 Chain10+ 중 ChainBeacon 최종파괴로 실제 special wave 발동 |
| Shifter | 목적지 이동이 적어도1회 성공한 Shifter를 1초 안에 직접 완전파괴 |
| PrismLens | 하나의 Lens에서 굴절 보조 파동2개가 서로 다른 두 정상 Shape에 실제 도달 |

- 모든 Challenge는 단순 피격횟수/렌더 연출로 미달 이벤트를 충족시키면 안 됨. 코덱스 카운터는 sourceId + chainId + simulationTime + targetId로 검증.
- Codex의 발견/킬 count는 M11 출시 이후만 증분 집계하되 M9에 기록한 정확한 Shape kills를 확인할 수 있다면 schema6 기록에서 안전한 idempotent import 가능. 과거 기록을 정확히 입증하지 못하면 0에서 시작하고 안내 표시. 임의 합산 금지.

## 4. Elite Encounter — 6 복합 프리셋

Elite는 새 Shape 종류를 증가시키지 않는다. 기존 도형+Trait+Formation 조합을 가지는 Run 중 드문 encounter. 우선순위 타깃을 만들고 전용 큰 보상을 제한적으로 제공.

| Elite ID | 해금 Rank / unique technique insight | 핵심 조합 | 선택과 재미 |
|---|---|---|---|
| bombReactor | R3 / 2 | Reactor + FuseBomb + volatile-compatible normal | Fuse 발동 타이밍과 Reactor 단계 |
| mirrorGravity | R3 / 4 | Mirror + Gravity Well | mainShard 경로 변형 |
| shieldConductor | R3 / 6 | Hex + Conductor + protected normal | Ward 해제 후 전도 |
| phaseRepair | R3 / 8 | PhaseCrystal + RepairNode | 취약 창 안에서 우선 제거 |
| portalBeacon | R4 / 10 | PortalGate pair + ChainBeacon | 멀리 떨어진 군집 연결 |
| ancientPrism | R4 / 12 | Ancient + PrismLens + nearby normal | 단계 파동 굴절·긴 Chain |

- 정상 Run에서 조건 충족 후 Run Tier≥4(200킬)에 3% eligible encounter chance, **한 Run 최대1 Elite**. Encounter는 안전한 배치가 전부 확보돼야 commit, 아니면 normal fallback.
- Primary Elite 표시: 원래 shape HP×1.5(올림), native BonusRaw+50, 사망 시 Catalyst+3을 **정확히 한 번** pendingSettlement에서 반영. Secondary 도형은 기존 HP/bonus/ore 드롭. 임의 무한 재생성X.
- 동일 계정 Elite intro도 최초 eligible 3 Run 사이에 1회 안전 생성 시도. Rank 미달·insight 미달이면 preview만 보임.
- 이번 M11은 Elite contract/boss 별도 UI/새 화폐 없음. 보상은 인게임 통상 Photon/Raw/Catalyst 정산에 합산하고 record에서 따로 표시.
- M8 Anomaly 선택과 만나더라도 underlying spawn cap/Rank/Tier를 무시하지 않는다. Relic/Signature/Evolution과 파동/반사 결합 테스트.

## 5. 고난도/등장 비율·진행 설계

- M8 6 Anomaly 및 M9 adaptive spawn experiment에서 현재 기본 스폰 수입상한 분석. M11 고난도는 단순 모든 Spawn의 HP 상승이 아니라 links/timing/refraction/Elite 패턴 비율로 증가.
- Shape19/Secondary8/Formation8 이상이 한 화면에 혼합되지만 주요 메커니즘이 서로 간섭하지 않도록 screen clutter budget(예: 특수 연결선3개 이하, Phase pulse는 target 부근만)을 준수.
- 첫5/20/50/100/200/300 Run에서 유니크 Shape encounter, Codex I/II/III/IV, total insight, Elite attempts/success, 신규 제어 행동 사용 빈도, FX disabled parity 측정.
- Rank4 old account는 Rank gating 통과하되 Codex technique0으로 시작. 새로운 시스템이 모두 즉시 소진되지 않게 초반에도 신규 일반 도형/Phase 같은 시각 변화를 충분히 보게 함.
- 마스터리 19×4의 달성은 수집 목표이지 3~4시간 유지 보장 아님. 사람 플레이에서 실제 발견/우선 클릭률·진척 정체·재도전 의향 계측.

## 6. 세이브/정산 schema8

- storageKey shard-storm-v1 유지, M10 schema7→M11 schema8; schema1~7 읽고 기존 정상 save1회 마이그레이션.
- shapeCodex:{ shapeId:{ kills,techniques,stage,discovered,...} }, codexPinnedIds:[] (≤2), insightUnlocked[] (unique StageIII shape IDs), eliteHistory:{...}, advancedIntroFlags:{...}.
- 기존 bank/Catalyst, 49 levels, Signature, EvolutionOwned/Active, Relic6, Rank, Contract10/offer6, M9 intro, 20 최근기록/pending/lastSettlementId 모두 보존.
- M8 pending이 남았거나 M9/M10 pending이 남은 상태에서 새 Codex/Elite reward 소급계산 금지. 끝난 기존 Run은 현행 규칙대로 한 번 복구.
- Codex/Elite delta는 stageSettlement에 snapshot frozen, completeSettlement에서 exactly once. 새로고침·재시작·Skip/PlayAgain·pageshow 중복3 Catalyst/achievement 없음.
- invalid shape ID/malformed counter는 신규 shapeCodex 영역만 무시, 정상 은행/스킬 리셋X. Fresh Lab sandbox/fixture 강제 spawn은 live insight에 영향X.
- 처음 발견/마스터리 단계 배너도 정산 후1회. 이펙트 OFF여도 정확히 같은 unlock/보상.

## 7. 코드 구조 및 개발 순서

- M10 최종 baseline/schema7/RNG/caps·browser pointer QA 먼저 스냅샷.
- config.js/advanced-shapes.js: 고급6 Shape 정의·phase portal pairs/link/beacon/lens 규칙.
- game.js/effects.js/motion.js/content.js: 실제 event queue, portal collision/teleport, damage sharing without recursion, phase window, chain threshold, Shifter leap, Prism sector wave/primary shard interaction.
- traits.js/ecology.js: secondary 총8 속성, 금지 매트릭스/확률, 19 shape intro.
- codex.js: 19×4 counter/stage tracking, 19 technique predicates, completeSnapshot/zero duplicate.
- elites.js: 프리셋6, safe atomic spawn, budget, 1Run cap, settlement reward.
- storage.js/progression.js: schema8 and pending Codex/Elite.
- meta-ui.js/new codex-ui.js/index.html/style.css/renderer.js: 19도형 아이콘, CODEX panel, pinned HUD2, Elite outline, 반응형 Focus 보전.
- QA: tests/m11-*.test.js; tests/m11-benchmark.js; tests/m11-browser.mjs; docs/Shard_Storm_M11_Implementation_Report.md, docs/Shard_Storm_M11_Balance_Report.md, README/스크린샷.
- 순서: advanced6 actual behavior → Trait4 → all Codex19 techniques → Elite6 → persistence & combined economy → simulation & actual pointer QA → reports/commits/push.

## 8. 테스트/완료 조건

- Shape6 각각 Rank+RunTier+spawnChance/cap, 정확한 hit/collision/source, one-time death/settlement/0초 이후 no damage.
- Portal original mainShard trace/exit safety/recursion1 cap, Parasite 1HP×2 copied no recursive, Phase vulnerable cycle timestamp, Beacon chain10 correct chain, Shifter actual pose + ghost hit0, Lens two sector direction/firstContact and M10 Prismatic cascade extension.
- Trait4 simultaneous rule and existing4 compatibility; modifier ON/OFF/marks-only with no extraneous RNG shifts.
- Codex 19종 각각 Stage I/II/III/IV and technique condition true/false, incomplete/disconnected/M9 child/fixture exclusion, multi-Run pending once, 19 insight unique cap.
- Elite6 Rank/insight/Tier and arena safe atomic spawn, perRun cap1, rare reward one time, inactive variant zero, fail fallback.
- seed[31415,1,7,42,99] × 3Build × Normal/Adaptive/Anomaly × M8/M9/M10/M11 feature flags and checkpoints1/5/20/50/100/200/300Run; performance/blank-time/shard/wave cap & contact error.
- 브라우저 20초 최소6Run(new6전문 fixture 각1), 실제 mouse pointer, 1440/620 CSS focus/normal, saved reload, Codex/Elite UI screenshot. 비교 fixture는 사용자 실제 해금과 분리.
- 기존 npm test, npm run benchmark:m7-m8, benchmark:m9, benchmark:m10, qa:m10 + **npm run benchmark:m11, npm run qa:m11** 신규 명령 PASS.
- 후속 TODO: Shader/Bloom/고급 글로우/기존 Shape별 edge-draw spawn/진짜 물리 slowdown/logic arena expansion/전용 audio mix. 이는 M11 Done 조건이 아님.

**M11 Done**: 실제 도형19종, 신규 secondary traits8종 합계, 76-stage Shape Codex, Elite6, schema8, 회귀·성장·브라우저 QA, 전투감/수집 목표 검증 보고서. 3~4시간 재미·사람 선택 다양성은 사람 검증 없이는 달성 주장 금지.
