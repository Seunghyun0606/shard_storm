# M15 — 선택형 Challenges & Endgame

기준: M14 `5b37a3d`. 기본 PLAY와 Boss는 그대로 두고 TITLE/RESULT의 CHALLENGE LAB에서 명시적으로 진입한다.

## 구현 상태

- Protocol3종×3단계: Fuse 동일 Chain·1초 내 실제 폭발2회, Conductor의 서로 다른 실제 피해 대상2개, 일반 Chain20, 직접 최종타10, guarded direct0 없이 Phase 취약 창 직접 처치, 실제 등록된 보스 부품 직접 최종타, Mirror/Gravity/Portal 주 파편 처치. 실패 시 해당 단계 재시도, 정산 때만 진척·뱃지 확정. 디버그 Run은 영구 진척에서 제외한다.
- Depth1/2/3: 기본 월드 / 최대+10%p의 보호·전도 선택 및 실제 근접 포켓 / 별도 Anchor의 실제 양수 피해와 Chain5·실제 군집2개 연결 조건. 원래 코어 조건도 함께 유지한다. HP 배율·Elite 상한·생성 예산을 늘리지 않는다.
- Rogue Draft5 Run: 가상 기존19스킬 Crusher/Cascade/Reactor preset, Signature/Evolution/Relic/Research0, 각20초. 최초와 Run1~4 뒤에 고유 임시 Perk 3지선다, 중복 소유 금지. 도전 ID·seed·round별 후보 고정, 재접속·포기 지원.
- Perk9개 모두 실제 전투 효과와 손해를 구현했다. 서로 다른36개 조합이 가능하다. 추가 Mirror/Stage 효과는 그룹당 Run8회·Chain2회와 원래 파편·파동·깊이 상한 안에서 동작한다.
- Draft는 Photon/Catalyst0, Rank·영구 파괴·계약·Codex·World·Elite pity·Anomaly 후보를 갱신하지 않는다. 실제 전투 기록과 성적만 보존하며 완료 정산은 RunId당1회다. 가상 빌드가 영구 레벨과 장착품을 덮어쓰지 않는다.
- Research6개는 기존 Photon/Catalyst로 구매, World/Protocol 설계도 필요. Shard2변형은 서로 배타적이고, 나머지 Evolution 변형과 함께 기존2계열 슬롯을 공유한다. Relay Surge는 기존 Signature3개 예산 중1개를 사용한다. 기본 형태와 동시 활성화하지 않는다. 소유권은 유지하고 프리셋 선택은 Research 활성만 해제한다.
- schema11은 같은 저장 키와 LZ4/CRC32를 사용한다. schema1~10과 이전 미완료 정산을 유지한다.

## 검증

- 신규26개를 포함해 **371 PASS / FAIL0**. Protocol9개 각각 양성·음성, 모든3단계의 실제 정산, 재시도·중복 거부, Perk9개, Research6개, 슬롯 공유, schema 호환, 실제5 Run Draft 자산 불변을 검증했다.
- `artifacts/m15-benchmark-results.json`: 처음555 actual Run + 혼합 포켓 보강 후 관련150조건 재검증 =705. Depth225조건 모두 코어 파괴. Draft는5시드×3preset의5 Run을 동일 선택으로2회 실행하여 점수·선택·기록 일치. Normal과 Draft의 경제를 분리했다.
- `artifacts/m15-regression-results.json`: M14 기준 전투 및 FX 중립성30 actual Run.
- `artifacts/m15-browser-results.json`: Chrome 실제20초8 Run. Draft5 Run의 선택·reload·완주, Protocol 직접10단계 성공, Depth3 코어 파괴, Research 구매·장착·플레이. 콘솔/page 오류0. 혼합 포켓 최종 코드는 `m15-depth-browser-results.json`의 추가20초1 Run으로 검증했다.
- 화면: `artifacts/m15-draft-offer.png`, `m15-draft-complete.png`, `m15-depth-result.png`, `m15-protocol-result.png`, `m15-research.png`.

## 수정한 오류와 한계

Chain 객체가 전투 종료 전에 정리되면 Protocol Chain20의 성공 증거가 사라지던 문제를 실제20번째 처치 순간의 latch로 수정했다. 잠긴 코어를 자동 정책이 계속 치는 입력 문제도 타깃 제외로 수정했다. 원래 실패·음성 테스트는 유지한다.

사람의 전술 이해·Perk 선택의 재미·재도전 동기는 자동 입력으로 확인하지 않았다. Research6개는 항상 수익을 올리는 업그레이드가 아니며 보통 Run에서 순수 손해가 클 수 있다. Boss 전술상의 이득과 비용 만족도는 실제 사용자 검증이 필요하다.
