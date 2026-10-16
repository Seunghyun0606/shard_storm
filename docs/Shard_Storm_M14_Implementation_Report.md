# M14 — World Tiers & Milestone Bosses 구현

기준 코드: M13 `6888ef0`. 개발 브랜치: `feat/m12-m16-destruction-evolution`.

## 구현

- World5개와 독립 Survey5개. World/Destruction Stage/Run Tier는 별도 상태다. Normal PLAY는 한 번의 클릭으로 시작하며, WORLDS에서 선택한 Boss Challenge만 예약 부품을 사용한다.
- W2 Normal은 Rank1, Hex가 필요한 Boss는 Rank2. W4는 Rank3에서 Ancient 없이 클리어 가능하다. 기존 Rank4 세이브도 W1부터 시작하며 과거에 없던 클리어를 만들지 않는다.
- Fracture Warden: 실제 보호 부품2개 사망 후 코어 개방.
- Relay Citadel: 실제 Hex Ward 해제 후 Conductor 피해 전달. 순서가 맞지 않으면 코어는 보호된다.
- Rift Engine: 실제 주 파편 Mirror/Gravity/Portal 경로 이벤트로 코어 개방.
- Singularity Core: 실제 Reactor 단계 파동 실행 후 Phase 취약 창의 실제 양수 피해로 개방.
- Storm Heart: 보호 Anchor3개 사망과 동일 Chain의 일반 파괴15개·실제 군집2개 연결 후 코어 개방.
- 0.5초에 전체 구조물의 안전 배치 사전 검증. 실패 시 부분 생성하지 않는다. 부품의 기본 HP·고유 효과·Raw 규칙과 안전 상한을 유지한다. 일반 스포너는 예약 영역을 피한다.
- 실패 시 기본 정산 유지. Survey/World 해금/클리어는 RunId 정산 안에서 한 번 확정한다. W5 실제 코어 파괴의 정산 후 스킵·재생 가능한 엔딩과 Free Play를 제공한다. M16에서 감각 연출을 확장한다.
- schema10, 같은 저장 키와 LZ4/CRC32. schema1~9, 기존 미완료 정산과 자산 보존.

## 검증 근거

- `tests/m14.test.js`: 월드 접근, 구버전, 정산 복구, 모든 보스 양성·음성, 순서 거부, 원자 배치, Fresh W1 조사 및 저 Rank 클리어.
- `artifacts/m14-benchmark-results.json`: 5시드×3빌드×5월드×Normal/Boss×20/32초 = 300 Run. 고정 입력의 파편 도착 대기 수정 후 Boss150/150 실제 코어 파괴. 이 수치는 사람의 성공률이 아니다.
- `artifacts/m14-regression-results.json`: 실제30 Run. 기존 M13과 World OFF 결과 일치 및 Boss5개 FX ON/OFF 전투·정산·원인 기록 동일.
- `artifacts/m14-storage-current32-results.json`: 실제32초 전투20개, 전체 기록 보존. 12,415,393→3,439,437글자. Chrome 동일 키 저장, 새로고침2회, 전체 기록 해시 일치.
- Chrome 수락 결과는 `artifacts/m14-browser-results.json`, 화면은 `artifacts/m14-world-boss-*.png`에 기록한다. 초기 QA가 Node 전용 테스트 의존성을 브라우저로 import한 오류는 브라우저용 격리 저장 준비로 수정했다.

## 한계 및 사람 검증

자동 입력은 명시적인 전술과 MAX 계정 fixture를 사용한다. 자연 성장 중 조사 설명의 이해도, Rank2까지의 동기, 실제 사람의 Phase 조준과 Boss 피로도를 검증해야 한다. MAX가 쉬운 과거 보스를 빠르게 부수는 동작은 유지한다. 플레이타임 3~4시간 및 재미는 미검증이다.

Final validation: npm test345 PASS / FAIL0; npm run benchmark PASS; npm run benchmark:balance PASS. Chrome6 actual20s Runs PASS, all5 Boss cores destroyed through actual mouse input, console/page errors0, two reload checks per Run. Metadata phaseId/challengeSourceId was added after the six-Run combat QA without changing combat predicates.
