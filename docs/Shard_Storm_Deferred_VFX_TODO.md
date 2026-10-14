# Shard Storm — Deferred VFX / Presentation TODO (M9.0~M11)

- 2026-10-15 업데이트.
- **이 파일은 구현 완료가 아니라 보류 백로그**. M9.0은 기본 저비용 피드백 구현, M9/M10/M11은 새 콘텐츠 게임성 검증에 집중.
- 검증 근거: M8 canvas 960×540, 기존 click rings/shape-scale spawn, Combo banner y=107/arena top=78, fixed-step physics·20초 경제.

| ID | 보류 작업 | 보류 이유 | 선행조건 | 완료 판정/검증 |
|---|---|---|---|---|
| VFX-01 | 진짜 world hit-stop/slow-motion: simulation clock/effect clock 독립 | game.update fixed step/event schedule/20초 timer/Refinery reward를 바꿀 위험 | M9~M11 gameplay QA, GameTime 설계 | 0.3~0.5배 slow에서도 wall-clock UX, 실제20초 게임 타이머 정책 명시, 동일 보상 오작동X, queued events 정확 |
| VFX-02 | Shape19종 윤곽선 순차 드로잉(spawn line construction) | M9/M11 신규 Shape의 topology가 미확정, 두 번 제작 위험 | 총19 Shape 확정, Polygon variation 지원 | 각 shape 변형에서 선분 순서 정확, 첫 유효 클릭 타이밍과 가독성 일치 |
| VFX-03 | WebGL/Bloom/postprocess/잔상·빛 번짐 | 엔진 또는 renderer 구조 재작업 가능 | 도형/파편 연쇄별 중요 이벤트 UX 검증 | 모바일/데스크톱 GPU FHD-QHD 성능과 reducedMotion·OFF/ON 경제 패리티 |
| VFX-04 | 고급 Camera Zoom/Screen Distortion | world hit mapping 혼란 및 어지럼증 위험 | 레이아웃 Focus/Shake 개선 수동 QA | visual camera transform과 logicalPoint/physics 완전 일치, 필요시 OFF |
| VFX-05 | 각 Shape별 분해 VFX/스프라이트·미립자/material | 신규 Shape6+6 메커니즘 중시, 기획 변경 예상 | M11 Shapes와 Modifier 총계 확정 | 19 Shape 각각 시각 식별·클릭 우선 판단 개선, cap/FPS |
| VFX-06 | 고급 전용 샘플 사운드/믹서/적응형 음악 | 임시 합성음이 존재하고 효과 교체 예정 | 전투 메커니즘 이벤트 목록 안정화 | SFX OFF 무음, 동시 Voice 제한, 접근성 볼륨 설정, 오디오 지연 검증 |
| VFX-07 | 물리 arena logical resolution 960×540→1280×720+ | 단순 CSS 확대와 달리 spawn density/거리/속도/경제를 바꿔야 함 | M9.0 responsive 완료+M9~M11 balance baseline | 20초 동일 입력 경제 A/B, pointer scaling, 샤드/충돌/도형密도·개별 UX |
| VFX-08 | 모바일 portrait UI/Touch SFX/Haptics | PC web 우선, 좁은 게임 영역 touch 목표가 별도 문제 | Desktop 1440 Focus 및 620px QA | 터치타깃 크기, 스크롤/드래그 충돌, 자동 숨김 HUD |
| VFX-09 | 몰입 이벤트 전용 배경 이행/타이포·애니메이션 리디자인 | 현재 Gameplay feedback을 살리되 반복 UI 재작업 방지 | 상단 HUD/Chain/FieldClear 기본 피드백 확인 | 영상/스크린샷 사람 테스트, 타깃 가림0, 읽기 쉬움 |
| VFX-10 | 색각 다양성/광과민성/멀미 검증 및 세부 VFX preset | 효과 강도가 최종 미확정 | 초기 reducedMotion/screenShake/FX 토글 실장 | 민감 사용자 옵션과 반복광량/주파수 관리, 설정 저장 |
| VFX-11 | Advanced dynamic music reacting to Combo/Anomaly/Elite | 결합 콘텐츠 구성/타이밍 변경 가능 | M11 실제 이벤트 source/skill/evolution tagging 확정 | Combo 단계별 Audio feedback, latency, OS focus mute |

## 이번에 반드시 구현할 최소 대안 (보류와 구분)

- M9.0: 최대1440 CSS px/Focus Mode, HUD 비가림, DPR 선명도, hit/miss/death feedback, 작은 shake(≤2px), cosmetic pseudo slow, Field Clear, 150ms fade.
- M9: 단색/선/아이콘만으로 6 Shape/4 Trait/4 Formation의 메커니즘 구분 가능.
- M10: 49 Skill 노드 UI/Signature/Evolution 상태 명확, 고급 아트 자산 불필요.
- M11: 19 Codex silhouette/badge/Elite outline의 가독성 구현, 도형별 후처리 전부 필수 아님.

## TODO 구현 착수 규칙

1. 사람의 게임성 검증 또는 명확한 성능/가독성 근거를 확보하기 전 VFX-01~11를 임의로 M9~M11 scope에 넣지 말 것.
2. 착수한다면 별도 PRD·branch·성능 budget·fallback toggle을 정의.
3. 항상 원래 20초 진행/파편·파동·보상/Replay 동일성을 확인.
4. M9.0의 외형 기능이 충분히 구현되어도 여기에 기재된 고급 TODO를 Done으로 바꾸지 않는다.
