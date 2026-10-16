# M16 — Juice, Audio, Ending & Release

런타임 커밋: `5285fad258d859cdb12c250791bc758e808f3525`. 브랜치: `feat/m12-m16-destruction-evolution`. 버전: M16.0-prototype. 빌드 SHA-256: `6a4887cb09ad399665571fd9acd584a3853929b0042971d273c2f1e55186de4e`.

## 구현

- 실제 양수 직접 피해·미스·파편·파동·Chain5/10/20·Storm Response·Boss 개방·코어 파괴를 별도 피드백으로 연결했다. 보호된 코어는 명중음 대신 guard 신호를 사용한다.
- Boss 개방240ms, 최종 붕괴900ms, Response220ms의 시각 효과와 최대2 CSS px의 장식 흔들림. 도형의 논리 좌표·시간·보상·RNG를 바꾸지 않는다. 물리 슬로모션은 도입하지 않았다.
- 19종의 실제 회전·변형·손상 polygon geometry를 공유하는 순차 edge reveal과 로컬 윤곽 캐시. 기존150ms spawn grace와 맞추며 Reduced Motion/FX OFF에서는 기존 alpha·scale로 대체한다.
- WebAudio Event Bus: 입력 후에만 AudioContext를 생성한다. 전체8 voice, 일반6 voice, frame4회, 초당32회(일반24회), 이벤트별 cooldown. Master/Effects/Music·climax/Mute/Comfort, 탭 숨김 시 음소거·복귀, 입력 전달 지연 로그를 제공한다. 외부 샘플이나 새 에셋은 없다.
- 실제 Storm Heart 정산 후6초 reveal, 스킵·Escape·재생, 키보드 포커스 순환, Free Play/World1/Challenge Lab 연결. World1과 최종 전투의 실제 수치 및 보유 성장 개요를 표시한다. 과거에 수치가 없으면 생성하지 않고 미보유 기록으로 표시한다. 새 클리어의 첫 확인된 통계는 World 이력에 보존한다.
- 공개 OPTIONS에 접근성·사운드를 제공하고 Focus와 오디오 옵션을 저장한다. 실험을 종료하면 실제 옵션으로 복원한다.
- 동일 `shard-storm-v1`, schema11, LZ4/CRC32, 전체 최근20개 기록과 기존 구매·자산·미완료 정산 유지. M16은 호환 가능한 선택적 설정·통계 필드만 추가한다.
- `version.json` 런타임 파일 해시, `release:manifest`, `smoke:release`. 로컬 실행·검증만 수행했으며 외부 배포는 하지 않았다.

## 검증

- 최신 **377 PASS / 0 FAIL**. 기존 테스트를 삭제하지 않았다. M16 신규6건은 오디오 제한·옵션·19종 geometry·실제 보스 gate·엔딩·schema1~11·용량 초과 보존을 검증한다.
- `benchmark:m16`: 5시드×3빌드×5 World/Boss×3Depth×20/32초 =450조건. M15/현재ON/현재OFF의 **1,350 actual Run**에서 전투·경제·원인·월드·모드 결과 일치.
- `qa:m16`: 최신 Chrome 실제20초14 Run. 5보스 모두 실제 코어 파괴, Draft5 Run 전체 선택·재접속·정산, Protocol·Depth·Research. 별도32초 홀드·드래그1 Run에서 Signature3/Evolution2/Relic2를 확인했다. 모든 해당 Run의 skippedSeconds·discardedPhysicalSeconds·lateWaveContacts는0이다.
- 실제32초 전투20개 전체 기록: 12,417,952→3,441,325글자. Chrome 동일 키 저장·두 번 reload·전체 기록 SHA-256 일치.
- 손상 원본의 실제 다운로드 바이트 일치, QuotaExceededError 후 원래 저장 유지, 엔딩 재생·Skip·reload 무중복, 키보드 포커스 및 실험 옵션 복원까지 Chrome에서 검증했다.
- 기존 `benchmark`, `benchmark:balance`, `benchmark:m12`, `:m13`, `:m14`, `:m15` 재실행 PASS. 과거 artifact는 바이트 단위 복원하고 새 결과는 `artifacts/m16-regressions/`에 무손실 gzip으로 분리했다. 과거 M11의54,000 Run 전체 코호트는 새로 재실행한 것으로 보고하지 않는다.

## 관련 파일

주요 코드: `audio-bus.js`, `shape-outline.js`, `ending.js`, `presentation.js`, `renderer.js`, `game.js`, `app.js`, `campaign/bosses.js`, `campaign/worlds.js`, `storage.js`, `config.js`, `index.html`, `style.css`, `package.json`, `version.json`.

QA: `tests/m16*.mjs`, `tests/m16.test.js`, `tests/release-manifest.mjs`, `tests/release-smoke.mjs`. 상세 결과는 Release QA와 Balance Report, `artifacts/m16-*`를 참조한다.

## 한계

사람 코호트의 재미·멀미·광과민성·3~4시간 완주 목표는 미검증이다. 합성 오디오는 전용 음악 트랙이 아니며 acoustic hardware latency와 GPU 시간을 측정하지 않았다. 기존 visible-stall `skipAhead` API는 보존했다. 이번 정상 플레이 표본의 skip0과 모든 환경에서 절대 skip이 없다는 주장은 다르다. 진짜 time dilation, WebGL/bloom, 논리 Arena 확대, 고급 개별 분해 VFX는 Deferred TODO다.
