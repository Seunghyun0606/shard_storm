# Shard Storm M13 — Destruction Evolution PRD v1.0

- 날짜: 2026-10-16. 상태: 기획 / 미구현. 선행: M12 Event Scheduler 정확성 + Spawn Director v2.
- 핵심: '새로운 스킬을 많이 사는 게임'이 아니라 '기존 능력으로 점점 더 큰 파괴를 설계하는 게임'.
- 기준: 기존 19 Shape/49 Skill/100 Lv, Signature10 중 ACTIVE3, Evolution15 중 Family2, Relic2, Run 기본20초(ExtraTime20~32), World 960×540 logical. M14 World Tier는 별개.
- 레퍼런스 추상 원리: Nodebuster — 점진적 공격 능력 변화; A Game About Feeding A Black Hole — 파괴 대상과 규모의 가시적 확장. UI/이미지/수치의 직접 복제 금지.

## 1. 코어 경험

초반: 1개를 클릭하면 작은 파편이 2~4개를 추가 제거한다.
중반: 한 도형의 폭발로 한 군집을 제거하고 플레이어가 다음 핵심 도형을 선택한다.
후반: 파편이 Mirror/Gravity/Portal을 거쳐 서로 먼 군집을 잇고, 강한 연쇄에서 새 군집이 도착해 연결 기회가 열린다.
최상위: 한 번의 체인과 연속적인 조준으로 여러 군집·핵심 타깃을 붕괴시킨다.

파괴 단계의 본질은 연쇄의 *공간적 범위*와 *원인 관계*가 발전하는 것이다. 자동으로 화면을 비우거나 플레이어 클릭 없이 보상을 지급하는 시스템은 도입하지 않는다.

## 2. Destruction Stage 4개

Stage는 '계정의 현재 구매 레벨·실제 활성 성장'에 따른 환경 프리셋이며 신규 Currency/Skill 구매 노드가 아니다.

| Stage | ID | 최초 적용 가이드(전체 구매 Lv) | 실제 플레이 환경 | 특수 지원 |
|---|---|---|---|---|
| I Shatter | shatter | 0+ | 기본 20초, M11 standard spawn | 단일 도형과 작은 군집·기존 Chain5 cue |
| II Cascade | cascade | 15+ | 중간 군집 + Conductor/Fuse 경로 가독성 강화 | Chain10 Storm Response 후보 |
| III Overload | overload | 40+ | 떨어진2군집과 전도·반사형 연결 전술 | Chain10 + Chain20 연결 Formation 후보 |
| IV Storm | storm | 75+ | 2~3개 군집의 조합과 M12 고성장 공급 프로파일 | Chain10/20 반응형 군집과 높은 난도 optional |

- 15/40/75는 초기 실험 해금값. 기존M11 계정100레벨이면 Stage IV 즉시 인식하고, 원래 얻은 스킬이나 World Tier를 초기화하지 않는다.
- Rank 또는 stage만 높다고 실제 특별 스킬을 장착하지 않아도 해당 도형의 기본 룰은 동작한다. 장착한 Signature/Relic/Evolution의 스킬 이벤트만 유효.
- stage는 세이브의 derived value로 우선 계산하고, Run 시작 시 currentPurchasedLevels에서 snapshot. Run 중 구매/계정 복구로 stage가 임의 변경되면 안 됨.
- M14의 World Tier I~V는 '플레이 장소·보스 해금', M13의 Destruction Stage I~IV는 '공격 스케일 환경'이므로 동일 개념으로 구현하지 않는다. World×Stage intersection은 world form의 rank/type eligibility보다 우선하지 않음.

## 3. Storm Response: Chain 기반 반응형 배치

### 3.1 새로운 핵심 기작

- Chain5: M9.0 기존 HUD 강조 + 짧은 world rim pulse만. 경제·스폰 효과 없음.
- Chain10: 자격 Stage II 이상에서 다음 생성 가능한 일반 예산 중 최대4개의 일반/특수 적격 도형을 묶은 추가 군집 Formation을 예약.
- Chain20: Stage III 이상에서 다음 생성 예산 중 최대6개를 'Bridge Formation'으로 예약. Mirror/Gravity/Conductor 등 현재 살아있는 기존 링크 가능한 앵커를 고려해 2개 군집 사이 약100~180px 거리의 안전한 연결 경로 시도.
- Stage IV: Chain20 이후 Run당 최초1회만 'Storm Formation' 2~3개의 포켓 형태(총 정상 Spawn 최대8개)를 다음 정규 공급 스케줄과 통합. 목표 타깃 1개 이상은 생존 형태가 달라 실제 조준 판단이 필요.
- chainId별 Chain10/20 milestone은 단 한번, Run당 StormResponse trigger 총3회(10-trigger2회 +20-trigger1회 또는 10-trigger1회 +20-trigger1회 +IV-final1회 등 우선순위) 초기 cap. 정확한 단계별 카운터는 공통 budget counter로 적용.
- 총 responseSpawnCount/Run≤18, active response formations≤1, 1개 새 formation completion 이전 다른 반응 배치 강제 실패 또는 다음 quota로 shift.
- Reactivation 조건: 이전 formation 제거 후 같은 Run에서 새 Chain 시작; 같은 Chain의 10→20 진행은 우선권에 따라 차등 배치하되 1Run 총3 제한.
- Respawn 대상은 실제 죽은 도형이 아니고 신규 스폰. Echo/child/Debug에 의한 false Chain 증가가 보상 조건을 부풀리지 않는지 기존 M9 규칙과 일치시킬 것. 이펙트 발동/intro showcase와 gameplay trigger 혼동 금지.

### 3.2 공급량/보상 안전성

- Storm Formation은 별도 무료 도형 생성이 아닌 **M12 Spawn Director의 향후 정상 spawn budget을 예약해 재배치**하는 방식. 모든 도형은 정상 HP/native Raw/Ore/Rank·Tier 자격과 실제 kill 1회 규칙을 지킨다.
- 한번에 더 많이 생성한다는 이유로 원래 target budget·special cap·singleRun cap·alive cap 초과 불가.
- 원래 .2×3에서 M12 탄력 공급으로 상승한 양 외 별도 hidden income multiplier 금지. Response는 배치 기회의 변화이며 기본 화폐 지급 버튼이 아님.
- 예약 formation을 조합할 수 없으면 자격 있는 vanilla shapes의 평범한 안전 spawn으로 fallback, 예약 budget을 영구 유실하지 않도록 하되 double spend 금지.
- Run 0초 전이나 PLAYING 종료 후 생긴 예약/여분 spawn은 피해·계약·Codex·보상에 반영되지 않음.
- Cosmetic FX OFF에서도 response effect는 gameplay mechanic으로 정상 적용; spawn response toggle OFF에서는 M12 Director의 동일 seed/시작조건 파괴 결과 baseline parity.
- gameplay RNG stream은 Stage/Spawn/formation 선별 전용. visual-only effects로 격리.

## 4. 새 Formation 3종 (기존 M9 4종과 별개)

| ID | 구성 | 조건 | 유저 선택 |
|---|---|---|---|
| linkPocket | 중심에 Conductor/Hex/Fuse 계열1 + 주위 normal3 | Stage II+ · shape Rank/Tier 적격 | 먼저 중심 파괴 vs 주변 제거 |
| bridgeCorridor | 분리된 두 도형 군집을 Mirror/Gravity/Conductor의 접근 경로로 연결 | Stage III+ · 안전한 기하 좌표 | 파편 방향 정렬 |
| stormCrown | 연결된 포켓 2~3개, 총 최대8 Shapes | Stage IV+ · Run당1회 | 첫 타깃/지연 폭발 순서 |

- 기하학은 기존 M9 Ring/Chain Corridor/Shield Fortress/Bomb Garden과 중복되지 않도록 군집의 상대적 거리·연결 기회에 초점을 맞춘다.
- 월드의 물리 bounds는 그대로 유지, safePoint+motion swept route+spawnGap를 만족하지 못하면 fallback.
- 전용 스프라이트·Bloom은 M16 deferred. 기존 19Shape palette/line/outline만 활용.

## 5. 파괴 능력 성장: 기존 4빌드의 '서로 다른 연쇄 결과'

- Crusher: 강한 첫 직접 사망→첫 Wave/Shard가 열린 방향으로 간다. 보상은 직접 피해 증폭이 아니라 고가치 anchor target을 직격했을 때 형성되는 Chain start geometry.
- Cascade: 1개 origin shard/ricochet이 여러 군집으로 전파. M11 Mirror/Portal에서 mainShard의 causal parent/source 보존.
- Reactor: 지연 Fuse/Stage wave가 다음 형성군을 이어서 정리. scheduled timing과 0초 이후 이벤트 제외 정확.
- Control: Gravity/Phase/Portal target order를 활용해 누적 체인 길이와 hit path를 바꾼다.
- Signature3, Evolution2, Relic2 선택을 Run 시작 전 스냅샷 동결. 스킬 발동 수/chain length/중첩 제한(샤드150·파동64·depth10 등)은 기본과 동일.
- 스킬 보유 수가 많아도 특정 Form·Signature가 실제 상위 배치에 대응할 수 있는 설계를 목표로 한다. 특정 조합만 모든 stage에 최적이면 배치/보상을 재조정(기존 스킬 일괄 nerf가 아니라 타깃 다양성)한다.

## 6. 플레이어 UX

- START: 4Stage 해금 progress, 현재 Stage와 다음 Stage까지 필요한 Lv 표시. World와 Stage는 별도 badge가 아닌 한 줄 status; 이해하기 쉬운 용어.
- PLAYING: 중요한 Storm Response 이벤트만 짧은 장식/비텍스트 line-guide로 표시. M9.0의 HUD 안전영역을 침범하지 않으며 도형을 가리는 대형 문구/무적 코팅 금지.
- RESULT: 이번 Run의 1) 최대 Chain 2) origin→종료 폭발 거리(진짜 인과경로) 3) Storm Formation 발동/파괴 수 4) Run 특수 조합을 작은 Summary로 표시.
- NEW stage unlock은 신규 자연 Run 시작 전 1회 안내, 강제로 긴 튜토리얼 중단하지 않음.
- Animation: 기존 flash/pseudo slow/light shake 사용, '연쇄가 커지는 핵심 이벤트'의 시각적 위계만 조정. Shader·물리 slow motion은 TODO.

## 7. 관측·검증 설계

파괴 크기는 단순 kill total 말고 다음으로 측정:
- Largest Chain kills (M11 metric),
- causal spread distance: 한 chain의 처음 사망 target과 마지막 또는 가장 멀리 사망한 target의 world Euclidean distance, shard/wave lineage verified,
- chain crosses distinct clusterId count(2+ 조건),
- response accepted/failed/activated/expired budget, response-triggered kill sources,
- direct input click count to generate a 10+/20+ chain,
- rare interaction actual activations: Mirror, Portal, Conductor, Fuse, Gravity, Reactor.

M11 seeds [31415,1,7,42,99] ×3 builds×Fresh/Max×fixed20/32×stage I/II/III/IV×Response ON/OFF; 단계별 stress fixture로 10/20 milestone을 실제 죽음 이벤트로 트리거.
- Stage unlock Lv14→15,39→40,74→75 boundaries and oldSave100→IV on load; stage/World cross-product eligibility.
- Per-run response cap3, spawn cap18, alive/special caps, formation reservation atomic, last0.1s scheduled spawn timeout, no duplicate Ore/Catalyst/Contract/Codex.
- baseline OFF deterministic replay exactly equals M12 shipped; ON 같은 seed+same input deterministic exactly reproducible.
- actual Chrome 20초 포인터6Run + Max/Rank4/Storm Response hit; 620px/1440px/Focus/Reduced Motion. FPS/tickP95 and physical cap reasons.
- 기존 M11/M12 regressions/307 tests preserved, 신규 benchmark:m13, qa:m13; growth 1/5/20/50/100/200 Run + 실제 사람 영상 A/B.

## 8. 중요 Scope Gate

다음은 M13에서 제외: World Tier5·Boss5·캠페인 엔딩(M14), RogueDraft/Contracts/Prestige(M15), physics hit-stop/고급 shader 전면 리디자인(M16). M13에서는 디버그 stage force를 sandbox에만 허용하고 live save를 조작하지 않음.

## 9. 산출물

- destruction-stage.js, response-director.js, response-patterns.js 등 신규 모듈; config/game/ui 최소 수정.
- schema migration이 실제 필요할 때만 new fields 추가. Live storage key/full20Records/pending exactly once 보존.
- tests/m13* + docs/Shard_Storm_M13_Implementation_Report.md + Balance_Report, A/B videos/screenshots/artifacts, README.
- 완료 기준: Stage4/Formation3/ChainResponse3 동작, 물리 시간 누락0, 후기 파괴 규모 증가·경로 변화가 로그 및 인간 영상에서 인식 가능, 신규 Run 전환·보상 중복X.
