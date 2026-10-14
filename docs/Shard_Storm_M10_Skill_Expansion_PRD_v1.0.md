# Shard Storm — M10 Skill Expansion, Signature & Evolution PRD v1.0

- 기준: M9 완료(Schema6, 13 Shape, 신규 modifier4), M8 기존 19 Skills/50Lv·6Relics·10Contracts·6Anomalies 유지
- 추가: **30 Skill nodes = 일반20×2Lv + Signature10×1Lv; 총 49 Skill nodes / 100 구매레벨**, 별도 Evolution5계열×3선택지/활성2칸.
- 중요: M11의 Portal/Phase/Prism 도형 출시 전에도 M10의 신규30노드가 모두 실제 발동할 수 있어야 함. 기존 M9 Mirror/Gravity/Fuse/Conductor를 기반으로 기본 효과를 제공한다.
- M9.0 UI/성능/Visual TODO 원칙 유지. 기존 20~32초 직접 클릭/홀드/드래그·순차 chain·Refinery·정산 보전.

## 0. 필요성 및 가격 원칙

M8 전체50Lv MAX는 Extra Time 활용 자동 경로에서 약30~34 Run에 도달. 늘어난 Contract Photon으로 더 빨라지기도 한다. M10은 단순 가격 인상이 아니라 전투 방식·선택형 빌드를 추가한다. 영구적으로 49개를 구매하더라도 동시에 활성화하는 Signature·Evolution은 제한해 선택을 남긴다.

- 기존19개의 Max/구매 비용/선행/Rank/효과는 변경하지 않는다.
- 아래 일반(P) node max2, Signature(S) max1. 최초 Photon은 표에 기재, 다음 일반 레벨 비용 ceil(basePhoton×1.6). Catalyst 일반 최초=C, 두 번째=2C, Signature=C. Rank/선행/Photon/Catalyst 동시에 충족해야만 RESULT settled 상태에서 구매 가능.
- 일반 Lv1 효과는 Lv2의 절반/표기 첫 숫자, Lv2는 두 번째 숫자. 정수 손익이나 확률이 어긋나는 경우 각각 1/2레벨의 효과를 구현/테스트.
- 신규 30 모두 CONFIG 선언형 ID, branch, prereq, rank, baseCost, catalyst, max, type, effect model, causal cap 지정. 기존 event queue/shard caps 재사용.

## 1. 신규 스킬 30개 상세 테이블

### 1.1 Direct 공격(5)

| ID / 이름 | 타입 | Rank·선행 | Photon/C | Lv1 → Lv2 효과 |
|---|---|---|---|---|
| weakpointScanner / Weakpoint Scanner | P | R1 crushPower2 | 300/1 | HP≤50% 대상 최초 직접 적중 피해+1→+2(대상당1회) |
| armorShatter / Armor Shatter | P | R1 crushPower2 | 340/1 | Reinforced/Hex 장갑에 최초 직접 피해 방어관통+1→+2(장갑 외 효과X) |
| markedTarget / Marked Target | P | R2 precisionFracture1 | 480/2 | 직접 hit 후 대상1.5초 표식; 다음 일반 파동 적중 피해+1→+2, 1회 소비 |
| chainStarter / Chain Starter | **S** | R2 impactPulse1 | 900/6 | 직접 최종 파괴에 보조 파편1(피해1/65px), Chain≤3/Run≤12회 |
| executionPulse / Execution Pulse | P | R3 crushPower3 | 700/4 | 특수 Shape 직접 최종 파괴 시 .04s 지연파동(반경60→75, 피해1), Run≤2→3 |

### 1.2 Shard(5)

| ID / 이름 | 타입 | Rank·선행 | Photon/C | Lv1 → Lv2 효과 |
|---|---|---|---|---|
| piercingShard / Piercing Shard | **S** | R2 shardPower3 | 950/6 | Main shard 1회 추가 관통/두 번째 타깃 가능, 비행거리 -30%, 한 타깃 중복 hit 불가 |
| angularSplit / Angular Split | P | R2 shardBloom1 | 450/3 | Main shard 최종타 때 auxiliary 1→2개(피해1/60px), Chain 발동≤3 |
| mirrorReturn / Mirror Return | P | R2 shardRange2 | 520/3 | Mirror 반사 이후 해당 shard가 kill할 때 wave 반경45→60/피해1, Run≤2→4 |
| ricochetBloom / Ricochet Bloom | **S** | R3 ricochetPlus1 | 850/6 | main shard 첫 실제 벽 반사 때 auxiliary2개(피해1/80px), Chain≤2(거울 반사는 제외) |
| portalMomentum / Portal Momentum | P | R3 kineticReach1 | 640/4 | Mirror/벽 반사 main shard 남은 사거리+25→50px(파편당1회); M11 Portal 통과도 추가 인식 |

### 1.3 Reaction(5)

| ID / 이름 | 타입 | Rank·선행 | Photon/C | Lv1 → Lv2 효과 |
|---|---|---|---|---|
| fuseAccelerator / Fuse Accelerator | P | R1 chainAmplifier1 | 380/2 | Fuse Bomb 점화시간 -.10→-.20초(최소 .30s) |
| conductiveSurge / Conductive Surge | P | R2 echoCatalyst1 | 520/4 | Conductor 전도 피해+1 → 피해+1/거리+15px, transmission Chain cap4 유지 |
| delayedEcho / Delayed Echo | **S** | R3 chainAmplifier2 | 1050/8 | Square/Star 고유파동 후 .12s 소형 wave 반경60/피해1, Run≤2 |
| resonanceBurst / Resonance Burst | P | R3 resonanceLayer1 | 760/5 | 대상1초 내 다른 고유파동2회 맞으면 반경60→80/피해1, 대상당1회·Run≤4 |
| chainOverdrive / Chain Overdrive | **S** | R4 chainAmplifier3 | 1450/12 | 해당 Run 첫 Chain15 돌파 시 지연 wave 반경100/피해2, Run≤1 |

### 1.4 Control(5)

| ID / 이름 | 타입 | Rank·선행 | Photon/C | Lv1 → Lv2 효과 |
|---|---|---|---|---|
| gravityBreak / Gravity Break | P | R2 shardRange2 | 500/3 | Gravity Well 사망 시 auxiliary1→2개 피해1/70px, Run≤4 |
| portalCalibration / Portal Calibration | **S** | R3 mirrorReturn1 | 950/7 | Mirror reflection 목표를 반경 내 현재HP 최대 타깃으로 전환, M11 Portal exit도 적용 |
| phaseDisruptor / Phase Disruptor | P | R2 crushSpeed1 | 540/3 | 움직이는 target 직접 hit 후 drift/rotation .8초간 -20→-35%, target당1회. M11 Phase 취약시간+.1→+.2s |
| magneticPolarity / Magnetic Polarity | **S** | R3 gravityBreak1 | 900/6 | Gravity Well 직접 kill에 반경80/피해1 wave, Run≤2; M11 Polarized 연결 해제 가능 |
| targetIntercept / Target Intercept | P | R2 weakpointScanner1 | 570/3 | 움직이는 Special Shape 직접 유효 첫 hit 피해+1→+2, Shape당1회·Run≤5 |

### 1.5 Economy(5)

| ID / 이름 | 타입 | Rank·선행 | Photon/C | Lv1 → Lv2 효과 |
|---|---|---|---|---|
| rareHarvest / Rare Harvest | P | R2 rareSeparator1 | 490/3 | Prism/Core/Void 완전 파괴 Raw+10→20, Run≤400Raw |
| catalystExtraction / Catalyst Extraction | P | R3 salvageScanner1 | 850/8 | Chain≥10인 Hex/Reactor 직접 kill 때 Catalyst+1, Run≤1→2 지급 |
| precisionSalvage / Precision Salvage | P | R2 precisionFracture1 | 420/3 | Special 직접 kill Raw+15→30, Run≤150Raw |
| contractScanner / Contract Scanner | **S** | R2 photonBoost1 | 760/4 | 첫3s 활성 Contract 적격 도형 표시 + 첫 qualifying kill Contract당 Raw25, Run≤75Raw |
| refineryCalibration / Refinery Calibration | P | R3 yieldStabilizer1 | 920/5 | 확정 Refinery Photon 추가 +3→6%(floor), Run 추가 ≤40Photon, 슬롯 재추첨X |

### 1.6 Specialist(5)

| ID / 이름 | 타입 | Rank·선행 | Photon/C | Lv1 → Lv2 효과 |
|---|---|---|---|---|
| splitterMastery / Splitter Mastery | P | R1 shardBloom1 | 480/4 | M9 Echo child 실제 죽음에 auxiliary1(피해1/65px), Run≤2→4, child ore/Rank 없음 |
| fuseSymphony / Fuse Symphony | **S** | R2 fuseAccelerator1 | 820/7 | 같은 Chain에서 Fuse 실제 폭발2회가1초 이내→반경90/피해2 wave, Run≤1 |
| shieldInversion / Shield Inversion | P | R2 impactPulse1 | 570/4 | Hex Ward 죽음 해제 때 반경60→70 피해1 wave, Run≤1→2, 기존 ward release 비피해 유지 |
| ancientBreaker / Ancient Breaker | P | R4 crushPower4 | 1300/9 | Ancient 단계 체력 문턱의 최초 직접 공격 +1→2, Ancient당≤3 적용 |
| prismaticCascade / Prismatic Cascade | **S** | R3 mirrorReturn1 | 1050/9 | Mirror에 굴절된 Main shard가 첫 kill 때 auxiliary1(피해1/80px), Run≤2; M11 Prism Lens에도 적용 |

검산: 6 Branch×5=30, Signature 정확히10(chainStarter, piercingShard, ricochetBloom, delayedEcho, chainOverdrive, portalCalibration, magneticPolarity, contractScanner, fuseSymphony, prismaticCascade), 일반20. 신규 MaxLevels=10×1+20×2=50. 기존50+신규50=**100 전체 레벨**. 모든 ID는 코드 네이밍에서 camelCase로 고정.

## 2. Signature 활성 규칙

- 모든10 Signature는 구매 영구 보존하되 동시 최대3개 ACTIVE. 0~3개 가능. 소유/활성 별개, 같은 ID 복수 슬롯X, 미구매 활성X.
- Run 생성 이전(TITLE/RESULT 정산 후) 변경, Run 중 변경 금지. Game 생성 때 Signature loadout deep immutable snapshot. Unselected Signature 효과는 절대 발동하지 않음.
- 활성/비활성 비용X, 구매 레벨과 선행조건 유지. 기존 Relic2 장착 슬롯과 별개이며 결합 테스트.
- UI에서 ACTIVE, OWNED BUT INACTIVE, LOCKED/MAX를 별도 스타일·문구로 구별. 손익/이벤트 제한/발동 타이밍 툴팁.
- 뒤늦게 모든 Signature를 사더라도 무엇을 3개 고르느냐에 따라 충돌·조준 전략이 바뀌어야 함. 작동하지 않는 선택지는 실패 콘텐츠로 보고.

## 3. Evolution: 5 family×3 형태, 최대2 Family 활성

Evolution은 별도 획득 선택지이며 **30 신규 Skill node에 포함하지 않는다**. 각 family 3개의 form을 모두 제작할 수 있으나 동시 활성 family 최대2개, family당 form 하나만 선택 가능. Relic2+Signature3과 별도다.

| Family | 해금 조건 | Form A (1600 Photon/Catalyst20) | Form B (2100/30) | Form C (2600/40) |
|---|---|---|---|---|
| Direct | Rank2·crushPower5 | Armor Bypass: 장갑 처음 직접 hit +2, Run≤6 | Mark Detonator: 표식 소비 시 rad65/dmg1 wave, Run≤3 | Focus Strike: direct damage+2, attack interval+.04s |
| Shard | Rank2·shardPower5 | Piercing: main shard 최초 정상 타깃1회 관통, 사거리-35px | Ricochet: 첫 벽 반사 이후 남은 사거리+50px, shard당1회 | Scatter: main shard 최초 kill 때 aux2개 피해1/65px, Chain≤2 |
| Shockwave | Rank3·chainAmplifier3 | Wide: Square/Star wave 반경+20, 피해-1(최소1) | Focused: 해당 native wave 반경-20, 피해+1 | Echo: native wave의 실제 kill 이후 .10s rad55/dmg1, Run≤2 |
| Reactor | Rank3·resonanceLayer2 | Quick: Stage delay-.02s(최소.01), damage-1(최소1) | Delayed: delay+.12s, damage+2 | Charge: 같은 Chain Reactor Stage 실제 실행2회에서 rad75/dmg1 wave, Run≤1 |
| Gravity | Rank3·gravityBreak2 | Pull: Main shard 휘어짐 cap+15°, 비행거리-30px | Push: Gravity 사망 시 rad70/dmg1 wave, Run≤2 | Orbit: Gravity 근방 main shard .08s 추가 회전, 추가 총각≤30°, shard당1회 |

- 최초 가공 시 Rank/prereq/Photon/Catalyst를 확인, 영구 보유 Form은 중복 구매 불가. 구매는 RESULT 정산 후, single persist. NONE이 디폴트, 해금 즉시 auto-equip하지 않음.
- Double penetration(Skill Signature+Evolution), double reflect(Relic+Signature+Form), double wave(Anomaly+Stage)는 의미 없는 중복 발동을 제한. 같은 target에 같은 projectile 연속 damage 중복X; 중복 지원 시 총 cap/lineage 반영.
- 필수 비교: A/B/C 효과가 모두 정상 Run에서 발동, 동일 직급 조합이 너무 강하거나 무용하지 않은지 근거 기록. Gravity curved path는 실제 collision/firstContact와 일치; 순수 시각 효과로 대체 금지.

## 4. Skill Tree UI

- 기존 19개 구매 경로 유지. 49node 그래프는 Direct/Shard/Reaction/Control/Economy/Specialist 6분기 탭 또는 미니맵, 검색·필터·Rank lock·prerequisite arrow 표시.
- 레벨 MAX/현재가격(Photon+Catalyst)/효과 발동조건·카운터·다음 Lv 차이, Signature ACTIVE 표시.
- RESULT/TITLE에서 Signature3 bar + Evolution2 bar + 기존 Relic2 summary, 저장/복원. Crusher/Cascade/Reactor 초기 sample presets3개 제공하되 소유하지 않는 아이템 자동장착 금지.
- 화면 확대 M9.0·Focus·620px narrow에서 graph scroll이 START/RESULT/PLAY AGAIN을 밀어내지 않고 DOM hit target가 일치.
- 고비용 애니메이션(신규30개 전용 빛/스프라이트)은 별도 Visual TODO.

## 5. Schema7/정산·신뢰성

- M9 schema6→M10 schema7; shard-storm-v1 유지, 모든 schema1~6 안전 로드. bank/catalyst/기존19 levels/M9 Shape intro/Relic6/Contract10/AnomalyOffer/Rank/lastRuns/pendingSettlement/lastSettlementId 보존.
- 신규30 levels 기본0, signatureLoadout [] 최대3, evolutionOwned family→forms, evolutionActive [] 최대2, buildPresets optional. 모르는 ID/중복/미소유만 신규 영역에서 정규화, 기존 정상 은행을 버리지 않음.
- 모든 신규 경제 효과는 Pending으로 한 번 확정: raw source + economic skill bonus + refinery original + calibration bonus + contract/anomaly payouts 분리. animation/Skip/Refresh/Back/Replay 동일.
- 결과 종료 후 0초 late wave/skill 효과 금지. Sandbox/Fresh Lab/Forced Shapes 실제 save 차단. Deep immutable Run snapshot(signature, evolution, relics, levels, anomaly, contract) 유지.
- causality events: sourceShape/sourceSkill/chainId/shardId/waveId/timestamp/target unique; perRun/perChain caps. 기존 shards150, depth10, events400, waves64, scheduled1024 변경 금지.
- 추가 Skill 발동 없이 능력을 소유만 했을 때 reward/collision 변화 없는지 회귀 테스트.

## 6. 단계별 구현/QA

1. M9 기준선 재실행/저장 → schema7/30 Skill declarative defs/49 nodes graph validation.
2. Direct+Shard10 능력 및 tests → Reaction+Control10 → Economy+Specialist10(Refinery/Settlement tests).
3. Signature3 slot runtime + UI/Save → Evolution5×3 form 실제 runtime + UI/Save.
4. 20초 실제 포인터 QA: Normal/Signature3/Evolution2/Relic2 결합/old-save migrations/620px/Focus. fixture와 자연성장 구분.
5. 5seeds [31415,1,7,42,99] × Crusher/Cascade/Reactor × Fresh/LegacyMax × M9-only/PermOnly/Signature3/Evolution2 × 20/32초. checkpoint1/5/10/20/30/50/100/200/300 Run. 구매 레벨·남은 노드·Photon/Catalyst surplus·Slot 선택·각30스킬 실제 발동 건수·다양성 측정.
6. Interactions: Piercing+Ricochet/Coil/Mirror; FuseAccel+Symphony; Conductor Surge; Weakpoint+Armor+Marked; ReactorGovernor+Quick/Delayed; AncientBreaker; Echo child Raw cap; Gravity Orbit ghost collision0; ContractScanner 조건; 0초 종료/초과 이벤트 cap.
7. 기존 npm test, npm run benchmark:m7-m8, benchmark:m9, qa:m9 + 신규 npm run benchmark:m10, npm run qa:m10 실행. 기존 테스트 삭제/약화 금지.
8. docs/Shard_Storm_M10_Implementation_Report.md, docs/Shard_Storm_M10_Balance_Report.md, artifacts/m10-*, README 갱신/단계별 commits/push.

**M10 Done:** 총49 스킬 노드·100레벨, 신규30종이 각자 실제 발동, Signature10/동시3, Evolution15forms/동시2 family, schema7 & 실제 QA. 비활성 Signature와 선택하지 않은 Evolution은 no-effect. M11 Shape(Portal/Phase/Prism)에 대한 추가 synergy는 M11에서.
