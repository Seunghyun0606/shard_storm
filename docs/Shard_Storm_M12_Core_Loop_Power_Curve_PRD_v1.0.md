# Shard Storm M12 — Core Loop & Power Curve PRD v1.0

- 작성: 2026-10-16. 상태: 기획 완료 / 구현 미착수.
- 기준: feat/m9-m11-content-expansion, M11 schema8, 19 shape / 49 skill / 100 levels / 10 signature / 15 evolution forms / 6 relic / 6 elite.
- 목표: 기존 코어 루프와 기존 세이브를 보존하면서 물리 정확성·후반 파괴 공급·희귀도·가독성을 개선하고 M13 파괴 진화의 기술 기반을 구축한다.
- 반드시 읽기: M11 Implementation, M11 Balance, M9_M11 Human Playtest, Save Capacity Decision, Deferred VFX TODO.
- M12는 신규 도형/영구 스킬 추가, 월드, 메인 보스, 새로운 재화를 도입하지 않는다.

## 1. 문제 근거

| 현황 | M11 보고 근거 | 위험 |
|---|---|---|
| Fixed spawn 0.2초 × batch3 | 초당 약15개 공급; 자동 MAX20초 ≈300개·32초 ≈480개 | 강화를 더 해도 파괴 결과가 변화하지 않음 |
| 모든100레벨 구매 | Normal 최초 MAX 중앙값69 Run; 300Run Photon 중앙값238644, Catalyst6917 | 남는 재화 및 목표 소진 |
| Elite 적격 attempt당3% | M11 13,500 Run 중12,847개 Elite 등장(95.2%) | 희귀 특별 타깃 감각 약화 |
| tickIterations cap512 | M11 13,500 Run 중916 Run에서 cap 도달, 남은 시뮬레이션 slice 누락 가능 | 결과 정확성·후속 대규모 연쇄 위험 |
| Codex tech 접근성 불균형 | Pentagon 성공 중앙값0/300Run; Prism Lens 성공 중앙값3 | 설명 부족·희귀한 실패 원인 |
| 960×540 논리·CSS 확대 | DPR/Focus는 M9.0에서 구현 | 확대와 world 크기 변경 혼동 주의 |

위 지표는 자동 전투의 관찰이며 플레이어의 재미와 실제 소요시간을 대표하지 않는다.

## 2. 목표와 비목표

P0 — 512 반복 제한에 닿더라도 게임 시뮬레이션 시간을 버리거나 전투 원인을 누락하지 않는다.
P0 — 후반 빠른 파괴 빌드에 실제로 의미 있는 새 목표가 공급되지만 도형이 지나치게 많아져 타깃을 가리지 않는다.
P0 — Elite는 적격 Run 기준 정책으로 변경 여부를 비교하고 기존 소개/해금/보상 한 번 규칙과 분리한다.
P1 — Codex 고유 행동의 진행·실패 이유가 결과 및 적절한 UX에 노출된다.
P1 — 개발자 실험에서 고강화 Crusher/Cascade/Reactor가 생성 병목인지 다른 병목인지 계측한다.

금지: 전체 스킬 비용 일괄 인상, 현금/새 화폐/무한 prestige, 기존 Photon·Catalyst 삭제, base Run duration 변경, 과도한 visual rework, 강제 신규 gameplay RNG 소비, M13 이상의 시스템 조기 추가.

## 3. Workstream A: Event Scheduler 정확성

### 3.1 현재 문제

Game.update 내부 이벤트 처리에서 C.caps.tickIterations=512 한도 초과 시 remaining slice의 elapsed를 종료 시점으로 당겨 기록하면서 잔여 물리를 건너뛸 가능성이 있다. 단순 max=4096 상향은 성능 실패를 감추므로 금지.

### 3.2 설계

- 이벤트 시간(tEvent), 남은 fixed-step 구간(stepEnd), 도형·파편 상태를 분리하여 step budget 초과 시 *처리할 시뮬레이션 구간과 사건을 보존*한다.
- 권장 선택지 A: 내부 micro-step 또는 deferred simulation debt queue에 남은 step과 이벤트를 기록, 다음 simulation iteration에서 순서대로 처리. debt는 사용자에게 다음 프레임 표시 전에 안전하게 catch-up; 실시간 프레임 저하와 물리 누락을 분리해 계측.
- 권장 선택지 B: 동일 시각 사건을 order key(timestamp, priority, eventId)로 묶어 batch 처리하되 firstContact/point-in-time semantics가 달라지지 않는 범위만 병합. 정확성을 증명하지 못한 사건은 coalesce 금지.
- 게임 시간 20/32초와 실제 이벤트 처리 시간은 구분한다. 남은 물리 및 pending events를 처리하기 전 정산/클리어를 확정하지 않는다. duration 밖 event는 기존 정책대로 효과 적용하지 않는다.
- chain source/skill/contract/codex/elite/ore/catalyst 기록은 발생한 actual event만 카운트; 이벤트 분할·재개로 2회 적용 금지.
- caps.shards150, waves64, scheduled1024, events400, depth10은 무단 증가 금지. 실제 cap 도달은 기존 룰대로 제한하되 정확성 debt 경고와 별도 기록.
- 일시정지/탭 숨김/리로드 중 save pending exactly-once, perFrame event debt max/latency/error logs 포함.
- cosmetic RNG/render frame 횟수가 simulation queue의 정렬이나 시드를 바꾸지 않음.

### 3.3 수락

- 5 seeds×3 builds×20/32sec×Rank0/4, M11 baseline와 M12 scheduler 결과를 비교. baseline에서 물리 생략이 없던 경로는 kills/Raw/catalyst/skills/codex/elite/targetIds 동일. baseline에서 cap 도달한 경로는 물리 결과 변경을 의도적 정확성 수정으로 diff 설명.
- cap hit 조건의 통제 fixture 1,000회 이상에서 discardedPhysicalSeconds=0, late contact=0, duplicate damage/payout=0.
- 브라우저 최악 밀도·FX ON/Reduced Motion에서 event debt runaway/무한 루프/입력 잠금 없이 유한 시간 내 처리하고 로그에 CPU tick P95/P99·catchUp 부담 기록.

## 4. Workstream B: Spawn Director v2 — 보이는 파괴 공급의 진화

### 4.1 정책

- 기본 Rank0 및 낮은 처리 능력에선 M11 normal spawn .20s×3을 그대로 유지.
- 고강화 상태는 캐릭터 레벨 하나만으로 조정하지 않고, 최근 게임 시간3~5s의 실파괴율, 시점 alive/target, 스폰 실패, activeSpecial 비중, 빈 화면 시간에 반응하는 *선언형 공급 프로파일* 사용.
- 공급 후보: 초당15/18/21/24/30개. 실제 구현은 interval과 batch를 선언형 프로파일로 정의하되 비교에서는 한 번에 한 변수만 변경. 모두 P95 실제 target count/viewport 밀집/스폰 안전 실패 상한을 지킬 것.
- low/high 사이 전환은 hysteresis(예: threshold 진입2초 지속/재진입 쿨다운3초)로 지나치게 떨리지 않도록 처리. 첫 시작0~3초와 tutorial/intro는 고정 공급 유지.
- alive object cap, Spawn safePoint(), cooldown, Ore odds, elite caps, special shape single-run caps, RunTier/Rank, actual waves/shards physics caps 보존.
- 절대 방치/무입력 상태의 auto-farming을 위해 생성 속도를 높이지 않는다. 최근 실제 플레이된 damage/kill events가 없으면 기본 cadence로 되돌림.
- 일반 반복 도형과 Special 조합 비중을 따로 제어. 중요 도형이 모두 작은 일반 도형에 가려지면 공급량 증가를 실패로 취급.
- high Rank라도 스폰 실패가 연속 누적되면 안전하게 fallback; overlap·arena 밖 강제 생성X.
- 실험 플래그: M11_fixed, M12_elastic15, M12_elastic18, M12_elastic21, M12_elastic24, M12_elastic30. 고성능 자동 프로파일 결과를 근거로 운영 하나 선택하거나 기본 유지.

### 4.2 관측 지표

- elapsed별 spawnAttempts/success/failure, alive perSecond 평균·최대, ordinary/special/elite ratios, emptyArenaDuration, killTotal, killingCause, chain initiation/peak/length.
- 성장 후 해당 tick에 목표가 없어 click이 허공으로 소모되는 시간, missedClicks, actualPointer Accuracy, player idle.
- visual clutter heuristic: 다른 도형과 시각 영역 overlap, 중요 도형 최초 발견까지 시간, HUD/UI 가림, input target reachability.
- 빌드별 power differentiability: max fresh 대비 max build에서 실제 파괴량·chain 전파·special event 변화. 숫자 개선만 있고 전술 선택이 없어지면 미채택.

### 4.3 수락

동일 Run·seed·장착·입력에서 고성장 프로파일들이 기본보다 평균 파괴 기회를 늘리는지 확인. 증가한 개수만으로 성공 선언하지 말고 UI에서 차이와 조준 가능성을 사람 Playtest로 검증. 프레임 시간 대비 안전 범위는 원기기 측정값과 별도 허용 한도 문서화.

## 5. Workstream C: Elite 빈도

- 기존 Eligible Rank/Insight/RunTier/소개 우선권/안전 배치 조건 유지.
- 자연 Elite 선택 정책의 단위를 'eligibility를 만족한 Run당 최대1회의 확률 결정'으로 A/B 비교하되, eligible Run은 tier가 4에 진입한 그 순간 이상으로 정의한다.
- 후보: chance .03 / .15 / .20 / .25. pity 후보는 6 consecutive eligible non-spawned Runs 이후 다음 eligible Run에서 반드시 '생성 시도'하도록 하는 정책. arena placement 실패는 성공 출현으로 취급하지 않고 failure reason 로그; pity state 소비 규칙을 명시해 테스트.
- 기존 최초 소개(해금) 생성은 자연 RNG/pity counters와 분리해서 기록; forced fixture와 서로 섞이지 않음. 한 Run Elite 1회 cap, primary kill Catalyst+3/Raw+50 payout은 exactly once.
- 같은 eligible Run 안에서 spawner가 100회 호출되어도 Elite likelihood는 한 번만 샘플링. UI에 처음 등장 확률을 표시하지 말고 알려진 상태를 설명.
- 운영안은 자동 수치뿐 아니라 사람 테스트에서 드물지만 찾을 수 있는 특별 타깃인지 확인 후 채택. 기본 검토 후보 .20+pity, 확정 아님.

## 6. Workstream D: Codex의 읽히는 목표

- 기존 19×4 단계를 보존, II/III/IV 정상 해금도 보존. 목표 총량 및 기존 카운트를 초기화하지 않음.
- UI에 현재 목표의 정확한 발동 조건과 시도 로그를 연결: 예) Pentagon mainShard origin kills3/5, 왜 5에 도달하지 못했는지(원인=wave/다른 shard, target 사망 등) 1~2개 대표 실패 메시지.
- 드문 조건(Fuse two, Prism Lens two-target sectors, Pentagon5)에 대해 **실제 실패 이유**를 표시하는 instrumentation을 추가. 타이밍·실제 combat source log가 없는 이벤트를 추정하지 않는다.
- 최대 pinned2 유지, HUD arena를 가리지 않는 result/post-run/expand-only UI. human test에서 목표가 어렵지만 이해 가능한지 검증; 목표 요구치 임의 하향 금지.

## 7. 저장/코드 경계

- storageKey shard-storm-v1, 현재 schema8/LZ4/full20record/CRC32/pending 복구 유지.
- saved Elite pity counter 또는 Spawn Director 계정 옵션 등 새 영속 필드 필요 시 schema9 사용; read schema1..8, 정산 이후 atomic update와 migration idempotence.
- 초기 실험의 Spawn Director는 계정 영구 마이그레이션 필요 없이 Run config snapshot만으로 재현 가능. 게임 엔진/코스메틱 분리.
- 예상 변경: config.js, game.js, ecology.js, elites.js, run-metrics.js, renderer.js, codex-ui.js, storage.js(조건부), tests/m12*.

## 8. 개발 순서

1. M11 HEAD & baseline, tests307 PASS, Chrome fixed20/ExtraTime, save stress.
2. Scheduler debt 정확성/이벤트 순서/중복 방지 (단독 feature flag).
3. Spawn Director v2 실험 프로파일/계측/브라우저 안전성.
4. Elite Run chance/pity 실험, 소개 분리, 통제 fixture.
5. Codex goal progress/failed-attempt feedback.
6. 5 seeds×3 builds×Fresh/Max×20/32sec×Normal/Anomaly A/B, M11 parity/기능 OFF, 보고서·스크린샷, README.
7. 별도 실제 사람 플레이 가이드·미확정 운영 수치 A/B 기록.

## 9. 최종 수락 및 산출물

- npm test + 기존 M11 회귀 전체 PASS (기존 307개 삭제/skip하지 말 것).
- 신규 npm run benchmark:m12, npm run qa:m12 실행 가능.
- tick skip seconds=0, incorrect terminal settlement=0, duplicate rewards=0.
- 새 spawner OFF에서는 baseline M11 replay 결과 완전 일치. ON의 차이는 안전한 spawn schedule 변화로 설명.
- Elite 자연 등장률은 운영 채택한 'Run당' 수치와 통계적으로 일치. 소개 우선·배치 실패 별도.
- 620/1280/1920 viewport, Focus ON/OFF, DPR1/2, 실제 포인터 20초6Run 이상 / console errors0.
- M12 Implementation Report, Balance Report, artifacts/m12-* 계측 및 새 file paths, 최종 commit/push.
- '사람이 더 재미있어졌다', '3~4시간 확보'는 사람 검증 근거 없으면 주장 금지.

M12 Done은 파괴 진화/월드/새 Boss 구현이 아니다. 상위 단계의 기반을 안정화하고 후반의 공급·연출 가능성을 실제로 입증한 상태이다.
