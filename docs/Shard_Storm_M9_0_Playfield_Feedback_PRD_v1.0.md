# Shard Storm — M9.0 Playfield & Hit Feedback PRD v1.0

- 작성: 2026-10-15
- 기준 코드: origin/feat/m7-m8-relic-contract-anomaly (M7/M8 완료)
- 문서 브랜치: docs/m9-m11-content-expansion
- 순서: M9.0 → M9 → M10 → M11. M9.0은 콘텐츠 추가 전 **크기·조작감·가독성** 개선.
- 저장 키 shard-storm-v1, 현행 schema5 유지(옵션은 안전 병합). 스폰/경제/정산/도형 피해 수치 변경 금지.

## 0. 확인된 M8 코드·문제

- index.html canvas width960 height540, config.js C.width960/C.height540 및 C.arena left32 right928 top78 bottom512.
- style.css main max-width1064px·padding30px, .arena-wrap aspect-ratio960/540. 큰 모니터에서도 전투가 작게 표시됨.
- renderer.js HUD/월드 한 Canvas 렌더. Combo 배너 문자열 y107, 전투 도형은 y78부터 생성되어 서로 겹침.
- visuals.js ClickVFXPool 링(hit life .12s / miss .07s), 기존 flash/recoil, C.spawnGrace .15s 동안 scale-in은 이미 있음. 새 이펙트 시스템 전체 재작성 불필요.
- app.js requestAnimationFrame+fixed step1/60; game.js elapsed/remaining/event queue는 물리·보상·정산과 결합. 게임 시계에 속도 조작 금지.
- M8 고강화 플레이에서는 기본 0.2초마다 3개 보충량이 병목. M9.0에서 world 좌표/논리 아레나/생성량 변경 금지.

## 1. 완료 기준

1. Desktop에서 최대1440 CSS px까지 게임 가로폭 확대, Focus Mode에서 가시 브라우저 영역 최대 활용, 작은 화면의 START/RESULT/Replay 접근성 확보.
2. 빈공간 클릭 / 유효 명중 / 최종 파괴 / 특수 핵심 파괴의 피드백을 구별. 공격/충돌 판정이나 마우스 좌표는 불변.
3. Chain HUD·계약/Anomaly 텍스트가 전투 대상 도형을 가리지 않음.
4. 도형 생성 시 150ms alpha+scale 등장. 시각 노출/취약 유예의 일관성.
5. Chain10/20, Reactor/Ancient final, Field Cleared에 짧은 시각 강조. **물리 슬로모션 대신 cosmetic-only pseudo slow**.
6. 효과 OFF/Reduced Motion에서 동일 입력·seed의 HP/파괴/Raw/Photon/Contract/Anomaly 결과 정확히 동일.

## 2. 게임 화면 확대·비율

### 2.1 CSS 기본·Focus

- 기본 main 최대1440px(기존1064), 좌우 gutter clamp(12px,2vw,30px); game-shell width100%.
- 전투 중 arena-wrap은 16:9. 논리 좌표는 960×540 그대로, C.arena 32..928/78..512도 보존. **CSS 표시 크기 확대이지 논리 전투 영역 확대가 아님**.
- Focus ON: header/legend/긴 설명/footer 최소화 또는 숨김; game-shell을 min(available viewport width, available viewport height×16/9)에 맞추고 항상 Focus OFF 버튼 노출. fullscreen API 사용은 선택/실패시 CSS Focus로 폴백.
- Focus OFF: 기존 페이지 레이아웃과 키보드 접근성 보존. title/result/meta 리릭·계약·스킬 트리는 scroll 가능, 결과의 PLAY AGAIN은 항상 접근 가능.
- 360×800 / 620×800 / 1024×768 / 1280×720 / 1920×1080 / 2560×1440 viewports 검사. 작은 화면은 전체 아레나가 잘리지 않는 우선 정책(터치 전용 UI는 TODO).
- DPR 1/2: Canvas CSS dimensions×dpr로 backing resolution 설정(상한2), ctx transform으로 world logical 960×540 draw, logicalPoint는 getBoundingClientRect 기반 CSS client 좌표→960×540 사용. ResizeObserver/탭 복귀 시 올바르게 다시 보정.
- 만약 외부 테스트가 canvas.width=960을 직접 전제한다면 backing pixel과 world coordinate의 차이를 명시하고 그 테스트만 올바른 계약으로 조정. 경제·도형 QA의 결과값 변경 금지.
- shake/zoom은 시각 world 레이어만 움직여 실제 hit-world mapping을 어긋나게 하면 안 됨.

### 2.2 HUD가 도형을 가리는 문제

- HUD의 TIME/DESTROYED/RAW/CHAIN(BEST)과 Contract/Anomaly 한 줄은 arena 위의 고정 header/y<78 전용 공간으로 옮긴다. viewport가 좁으면 축약 표시, text overflow ellipsis.
- 지금 renderer.js의 중앙 y107 콤보 문자열 제거; 콤보5/10/20은 상단 HUD 펄스·숫자 강조, 월드에는 비텍스트 원형 파동만 남김.
- 전투 중 장식 텍스트와 pointer-events가 타깃 도형 위에 오지 않도록 한다. 실제 hit validation은 렌더와 일치.
- Result/Start 오버레이는 여러 카드가 스크롤 가능하되 게임 중 HUD 가독성과 별도.

## 3. 공격 피드백 4단계

| 원인 | 간단한 연출 | 시간·캡 |
|---|---|---|
| 빈 공간 클릭 | 작은 점+얇은 링, alpha≤.25 | 70ms, 기존 pool 재사용 |
| 유효 명중 | 중심 flash, 작은 수축+확산 이중 링, 기존 recoil | 90~110ms, 링2개 이내 |
| 도형 사망 | 해당 도형 색 강조, 파편 4~6개, 짧은 별빛 | 120~160ms, 기존 particle cap 유지 |
| Reactor/Ancient 특별 사망 | 월드 외곽 highlight + 짧은 잔상 + 제한 camera shake | 120~180ms |

- click/down과 hold 반복 실제 attack result로 피드백 이벤트 생성. miss가 보상을 주거나 hit처럼 보이지 않음.
- hold의 시각 강화 spam 방지: hit ring 발동 최소120ms 사이. 다단계 특수 폭발에도 visuals/particles/shard/waves 기존 cap 준수.
- 사운드는 현재 Sound ON의 합성음과 연결할 수 있으나 샘플별 mixer/리마스터는 TODO. OFF는 침묵 유지.

## 4. 화면 흔들림·강조·의사 슬로우

- 추가 options(기존 schema5 안전 기본병합): combatFXEnabled=true, screenShakeEnabled=true, reducedMotionEnabled=false. OS prefers-reduced-motion은 줄임 동작 우선(명시적으로 설정되어도 강한 shake는 금지).
- normal hit/miss는 shake0. crushPower≥3의 큰 도형 직접 최종타는0.5~1 CSSpx / Chain10 또는 Reactor final 최대1.5px / Chain20 또는 Ancient final 최대2px. 기간100~160ms, 재발동 최소250ms, 동일 시간 중첩은 최댓값만.
- world render transform only; HUD/CSS overlay/pointer mapping/physics world coordinates 불변. cosmetic phase는 전용 RNG/결정함수, gameplay RNG 소비X.
- Combo 5 HUD glow100ms, Combo10 HUD+월드 얇은 아웃라인120ms, Combo20 HUD pulse+강한 시각 강조150ms, Reactor final 잔상150ms, Ancient final 시각 강조180ms.
- Pseudo slow: particles/trails/glow render curve만100~200ms 늘리거나 속도를 늦춰 보이게 할 것. **game.update dt, game.elapsed, remaining, physics trajectory, spawnClock, attackClock, scheduledTime은 완전히 동일**. 실제 timeScale, global hit-stop, physic pause를 구현하지 않는다.
- Field Cleared: PLAYING, 실제 도형 사망으로 alive count 1+→0이고 이번 Run totalDestroyed≥1일 때 1회 HUD FIELD CLEARED + 220ms 무텍스트 radial wave; 같은 empty 기간 중복X, 쿨다운3s; 초기화/스폰 지연/추가 Photon 없음. 다시 도형이 생성되어야 재무장.

## 5. 등장 Fade-in과 클릭

- 기존 .15초 grace 동안 scale 기존 크기 변화는 유지; alpha 0.15→1을 합성. 등장 끝나면 base fill alpha/outline restored.
- 시각적 공격 가능 시점은 기존 vulnerableAt=spawnTime+grace와 일치해야 한다. 대기 중 작은 윤곽선으로 아직 준비중임을 알림. 애니메이션만 바꾸고 spawned timing/HP/grace 물리 변경 금지.
- 화면 흔들림/모션 토글과 렌더 alpha가 gameplay RNG·poseAt world 좌표를 바꾸면 안 된다.
- 선분 따라 그리기(stroke-dashoffset 등)는 19종 도형 완성 후 별도 TODO. 이 단계에서 다각형별 전용 mesh·새 그래픽 아트 불필요.

## 6. 구현 권장 구조

- style.css/index.html: desktop width, viewport Focus, HUD DOM 또는 Canvas 상단 안전영역, 모바일 축약.
- app.js: Focus toggle, DPI resize, 새 옵션 변경/복구, pointer mapping.
- renderer.js: HUD→월드 draw stack 분리, alpha fade/shake/visual-only highlights.
- visuals.js: ClickVFXPool 재활용, 생명/상한/이벤트 payload.
- game.js/combo.js: 기존 kill/hit/chain 이벤트를 cosmetic viewer에 dispatch; simulation에 cosmetic 객체가 feedback으로 침투 금지.
- storage.js: schema5 options boolean 기본값을 읽어 합산, 기존 정상 저장 파괴 금지.
- tests/m9-0-*.test.js, tests/m9-0-browser.mjs, docs/Shard_Storm_M9_0_Implementation_Report.md.

API 예시: emitCosmetic({kind:'hit'|'miss'|'death'|'combo'|'special'|'fieldClear',at,x,y,intensity}); render effect may never call award/settle/attack.

## 7. QA 수락 기준

- viewport 6규격, Focus/Normal, DPR1/2, resize mid-Run. START/RESULT/PLAY AGAIN/Skill Tree/Relic/Contract/Anomaly가 화면 밖 잘리지 않음.
- 동일 logical coordinate의 실제 page.mouse.click, hold, drag를 기존960 display vs 1440 display에서 실행하고 hit 대상/attack count 동일. Shake 도중에도 동일.
- Combo5/10/20 이벤트 fixture의 HUD는 전투 y≥78 영역 위 텍스트를 그리지 않음. 좁은 뷰에서도 가림 없음.
- 20초 실제 pointer Run 최소4개(일반/콤보/특수·FieldClear fixture/모션·DPR), Chrome console page error0. Fixture는 fixture로 명시.
- FX ON/OFF, shake ON/OFF, Reduced Motion ON/OFF × seeds [31415,1,7,42,99] 동일 Run kills/raw/refinery/catalyst/contract/Anomaly/Replay/physics P95/late contacts를 비교하고 실제 경제 수치 완전 일치.
- Pseudo slow는 0초 이후 추가 파괴/시간/지급X; tab-hidden, pause/reload/new run 테스트.
- 기존 npm test 및 npm run benchmark:m7-m8와 qa:m7-m8 통과. 새 npm run qa:m9-0 스크립트 추가.

## 8. TODO만 작성하고 이번에 구현 금지

1. 실제 물리 시간 배율·hit-stop과 Game Time / Visual Time의 정식 분리. Run timeout/리플레이 경제 영향을 분석한 후 별도 PRD.
2. 모든 Shape별 edge-by-edge line construction, 개별 스폰 스토리보드·공통 shader/material. M9+M11 형상 정의 완료 후.
3. WebGL/postprocess/bloom/screen distortion/high fidelity particles/Camera Zoom. 게임성 확보 후 VFX 교체.
4. 논리 world 960×540→1280×720 이상 확장, 새로운 spawn density/range/collision/economy benchmark. **표시 확대와 별개 과제**.
5. 특수 sound packs, mixer, adaptive music, 광과민성 안전 옵션 심화, 모바일 portrait 전용 인터페이스.

**M9.0 Done**: 가독성+공격 감각 개선, M8 전투와 정산 100% 회귀, 저비용 일시 연출만 실제 구현, 고비용 연출은 별도 TODO 문서에 이관.
