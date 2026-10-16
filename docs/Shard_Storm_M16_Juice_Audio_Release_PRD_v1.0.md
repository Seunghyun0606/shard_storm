# Shard Storm M16 — Juice, Audio, Ending & Release PRD v1.0

- 작성: 2026-10-16 / 기획 / 미구현. 선행: M12~M15 gameplay & 5 World/Boss campaigns 완료.
- 목표: 파괴감·성장감·엔딩을 플레이어가 이해하고 느낄 수 있도록 개선하며 웹 배포 및 QA 안정화.
- 근거: M9.0 기본 click/miss/hit/fieldClear/fade/pseudo slow/reduced motion 이미 구현. M11까지 Shader/정식 Slow Motion/도형별 edge tracing/전용 Audio/논리 월드 확대가 TODO로 남아 있음.
- 비범위: 성능/가독성 증거 없는 VFX 전면 재작성, 새로운 메인 화폐, AI NPC, 서버 필수 로그인, 멀티플레이, 무작위 가격 인상.

## 1. 감각 디자인 원칙

1. 모든 전투 액션에 번쩍임을 주는 방식 금지. 유효 direct hit, final kill, chain milestone, Storm Response, Boss latch, Boss core break의 우선순위를 명확히.
2. '맞았는가', '죽었는가', '왜 다른 군집까지 연결되었는가', '구조물이 열렸는가'를 색+형상+소리의 조합으로 전달. 색상 단독 판별 금지.
3. 기존 canvas pointer world hitboxes·gameplay RNG·20~32sec game clock·정산·코드 저장 규칙은 시각/청각 설정과 완전히 분리.
4. M9.0의 약한 hit/miss/150ms fade/아주 작은 shake를 보존하고 중요 순간만 고급화. Reduced Motion/Shake OFF/FX OFF는 전투 난도/경제를 바꾸지 않음.

## 2. 타격감 계층

| 시각/청각 이벤트 | 최소 효과 | 강도·기간 초기 예산 | 장애물 |
|---|---|---|---|
| Miss | 1 click point + 작은 희미한 ring | 약70ms, 무shake | 의미 없는 큰 폭발X |
| Direct Hit | 도형의 피격 edge flash/recoil + 짧은 sharp transient | 90~120ms, 보통 no shake | 홀드 spamming throttle |
| Ordinary Kill | 같은 색상 debris + 1번 snap note | 100~160ms | particles cap |
| Chain5 | 차분한 stereo-ish ping + HUD pulse | 120ms | 입력 방해X |
| Chain10 / StormResponse | time-bounded outline flow과 소리 상승 단계 | 120~200ms | world animation은 실제 신규 군집 causal cue와 일치 |
| Chain20 / Storm Formation | 다음 군집까지 이어지는 0.2~0.3s trail + 짧은 저음 | max2CSSpx shake, cooldown | HUD/후처리 과잉 금지 |
| Boss Shield Unlock | shield segment crack animation + 단계 톤 | max240ms | boss phase damage gate 진짜 이벤트와 동기화 |
| Boss final core death | 여러 단계로 부서지는 구조물 + 강조 사운드 | 0.6~1.2s *visual only* | final settlement/20초 clock 변경X |
| Campaign Ending | 짧은 6~12초 skip 가능한 reveal + 성장 비교 | PLAYING 종료·settled 이후만 | Run 종료 전 컷신 강제 금지 |

기본 효과 숫자는 전환/수용성 실험값; 실제 사용자 편안함과 브라우저 FPS에 맞추어 조정하되 시각값만 수정.

## 3. 도형 19종 등장 애니메이션

- M9.0 150ms alpha+scale 등장 구조를 foundation으로 사용. 19종 polygon geometry를 공통 trail/stroke Reveal Renderer에 연결.
- 도형 생성은 진짜 gameplay vulnerability(기존 spawnGrace)와 항상 일치, 150ms 이전 무적/공격 가능 여부가 불분명하게 표현X.
- Line-segment reveal: 각 edge가 순서대로 나타나되 geometry variance/rotation/drift/bounds 대응, polygon corner에서 깜박임·불연속 간격 없음.
- Sprite asset 제작을 전제하지 않는 Canvas2D 기반 MVP. Shape count 많을 때 batch/canvas cached path, reducedMotion 옵션에서는 기존 alpha+scale만.
- 아래 stage/world별 unique palette accent는 도형 타입 색상 정체성을 해치지 않는 범위.

## 4. Audio Event Bus

- 기존 SFX ON/OFF 보존, AudioContext 브라우저 클릭 후 초기화, autoplay 정책 준수.
- 카테고리: directAttack(hit/miss), shard, wave, chain5/10/20, special(Native Hex/Ancient/Reactor), StormResponse, BossPhase, BossClear, End.
- PerFrame/perSecond maximum concurrent voices와 source-based cooldown을 선언. 대형 연쇄에서 수백 개 폭발음을 동시에 재생X.
- Volume master/effects/music, mute, tabHidden mute/resume, input latency logging; user gesture 없는 autoplay 금지.
- SFX license/asset provenance 기록. 상용 라이선스 확인되지 않은 타인 게임 오디오 샘플 복사 금지. 외부 asset을 가져오지 않고 WebAudio synth로 시작 가능.
- 20초 동안 단계적 밀도를 음향으로 느끼게 하되 실제 Run remaining·bonus reward와 무관. World5·StormHeart는 전용 climax layer.
- reducedMotion은 오디오 자체 mute를 강제하지 않으나 연속 클릭 알림이 불편한 사람을 위해 효과 음량·고음/반복 제한 preset 제공.

## 5. Slow-motion: optional 별도 기술 게이트

- M12 이후 정확한 event scheduler여야만 고려. '0.2s stop'으로 실제 timer/physics 진행을 무작정 멈추면 20s Run과 Reward/Anomaly/Contract가 바뀌므로 금지.
- 우선 구현은 M9.0 cosmetic pseudo slow 개선. 실제 time dilation은 **별도 GameTime / PresentationTime 분리 PRD와 명시한 Run time semantics**가 있어야 한다.
- 실제 slow가 목표라면 simulationTime fixed-step을 정확하게 누적하고 realTime 변환, physics world event scheduling, active click cooldown, onHit live input의 입력/타이밍 동기화 정책을 완전히 정의.
- Fixed-seed deterministic A/B에서 actual run duration/kill count/refinery/Codex/Elite affected? 변한다면 그 정책을 공식 스펙으로 승인받지 않고 배포하지 않는다. 성능/QA 실패하면 visual-only fallback을 채택.
- 적어도 1초간 잦은 slow 연출이 플레이 조작 감각을 해치거나 reduceMotion과 충돌하면 출시에서 제외 가능. Deferred TODO를 출시 필수로 강제하지 않는다.

## 6. Camera / Glow / logical arena

- Camera shake≤2 CSS px world decoration only, logical hit mapping 변경X. 확대/줌·screen distortion은 심미 이득을 브라우저 포인터 좌표 테스트로 증명한 뒤.
- Canvas2D로 가독성 유지 가능한 효과는 WebGL 이식 이유가 없다. Bloom/postprocess는 성능·fallback 구현 근거 확보 후 선택.
- 논리 arena 960×540→1280×720은 독립 전투 A/B가 필요한 큰 기능. M16 기본 작업이 아니다. M9.0 CSS1440/Focus/DPR 확대를 우선 유지.
- GPU performance / CPU update / FPS / input responsiveness를 서로 별도 기록하고, Browser Chrome target 환경에서 부하 threshold를 실제 측정.

## 7. 캠페인 완결 경험

- StormHeart actual clear + M14 settled/campaignComplete=true 이후 EndingFlow 시작(전투 스코어 계산 중 클립 강제 재생X).
- Ending contents: (1) 마지막 core 단계 붕괴(2) 이전 World1 수준 도형 수 vs 최종 chain spatial range 또는 kill count 비교 (3) 현재 총 보유 Skill/Signature/Evolution/World/Codex 개요 (4) '완주 / 자유 플레이 / 다시 도전' 선택.
- 'You became the Storm' 같은 톤은 간결한 분위기 제안이며 타사 게임 UI·텍스트 직접 복제 금지.
- 엔딩은 Skip 가능, replay 가능, 처음 정산 후 오직1회 최초 클리어 플래그, Skip/Reload 시 보상 중복 없음.
- Main ending은 Codex IV 19종, Signatures allOwned, Evolution allForms 구매를 강제하지 않는다. 완료 후 World replay / StormDepth / ChallengeProtocol / RogueDraft 그대로 지속.

## 8. UI·Accessibility

- PLAYING: game stage/world/chain2줄 이내, 19Shape readable, HUD safe region 유지.
- TITLE/RESULT: 1 primary Play CTA, secondary World/Boss/Challenge/Build/Codex로 분리. START가 다중 설정으로 스크롤 끝에 몰리지 않음.
- Color contrast, no-color-only differentiation, OS prefers-reduced-motion, UI keyboard focus/shortcuts(필요한 경우), tabindex/focus-visible, 620px narrow, pointer touch target 최소 등 별도 검사.
- 사용자가 선택한 MotionFX, Shake, Music/SFX, Focus 설정은 M11 기존 옵션을 마이그레이션하여 보존; 저장 실패와 손상된 원본 보존/Export UX를 해치지 않는다.

## 9. 출시 범위·QA

### QA baseline
- M11 307 PASS / Chrome20초28Run / 54,000 M11 growth 보고는 과거 참고자료이며 M16 최신 상태에서 새로 검증한 수치로 대체 기록해야 한다.
- M12~15 단위·브라우저·저장·기간 정확성·모든 World/Boss/modes/Evolution/Skill/Anomaly/Contract/Refinery/Codex 회귀 실행.
- seed [31415,1,7,42,99] ×3 builds×5World×5Boss×3Depth×FX OFF/ON(핵심 조합 우선), no duplicated settlement.
- 새 npm run qa:m16, benchmark:m16, smoke:release; RUN_DURATION20/ExtraTime32, 620×800,1280×720,1920×1080, DPR1/2/Focus ON/OFF, reload/pending/Corrupt save.
- Save key shard-storm-v1, latest schema read M11 schema1..8 (및 M12~15), full20 detailedRecords LZ4/CRC32 exact hash preservation. QuotaExceededError graceful warning + original preserved.
- Chrome console/pageErrors0, pointer hitbox alignment error0, no late event rewards, physics skipped simulation seconds0.
- 사람이 실제 fresh→final World5를 일정 코호트에서 플레이; median 플레이시간·실패 Boss 횟수·다음 Run 이유·포기 시점·타격감·광과민성/멀미를 수집. 3~4시간은 목표지 보장이 아니다.

### Release delivery
- README 첫 화면이 최신 M16을 설명하며 시작/옵션/Reset/Export/Recovery/Cloud 없는 로컬 세이브 한계 공지.
- Version manifest, build hash, release notes, reproducible install/build/start, deploy smoke, 20sec live browser game reachable, actual QA report links.
- Gameplay freeze 후 P0/P1 bug triage. 추가 shader/음악 등은 user playtest에서 효과가 명확하고 Regression PASS인 경우 채택.
- HTML5 Web 출시 우선. PC packaging/Steam/mobile은 승인받지 않은 확대 범위로 두고 별도 PRD.

## 10. 완료 조건

기본 타격·Chain/StormResponse·Boss 파괴의 효과가 직관적이고 과도하지 않음. 실제 World5 완료/엔딩/재방문, Normal/Optional mode, Save/Settings/Reduced Motion, 전투 물리 정확성·성능·브라우저 QA, 최종 출시 보고서·버전·커밋이 존재.

필수 산출물: docs/Shard_Storm_M16_Implementation_Report.md, docs/Shard_Storm_M16_Release_QA_Report.md, docs/Shard_Storm_M16_Human_Playtest_Summary.md, artifacts/m16-*, README/version log. 릴리스 실제 배포는 사용자 요청 또는 사전에 명시된 배포 정책에 따라서만 수행.
