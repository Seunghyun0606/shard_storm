# M12~M16 최종 구현·검증

브랜치 `feat/m12-m16-destruction-evolution`. M16 런타임 `5285fad258d859cdb12c250791bc758e808f3525`, 빌드 `6a4887cb09ad399665571fd9acd584a3853929b0042971d273c2f1e55186de4e`. 문서·증거 커밋은 같은 브랜치의 후속 HEAD에 포함된다.

| 단계 | 구현 완료 | 단계 커밋 | 단계 당시 단위 PASS |
|---|---|---|---:|
|M12|512 예산 잔여 물리 보존, 접촉 반복 복구, Spawn A/B, 승인 Elite20%+pity6, Codex 시도 설명, schema9|`7a5bc56`, `1d75822`|324|
|M13|4단계 파괴 환경, 실제 Chain10/20 Response3종, 정규 생성 예산·거리·군집 계측|`58ca72b`, `6888ef0`|332|
|M14|5 World·Survey·5 실제 복합 Boss·안전 예약 배치·정산·기본 엔딩, schema10|`5b37a3d`|345|
|M15|Protocol9목표·Depth3·독립 Draft5 Run/Perk9·Research6/기존 슬롯 공유, schema11|`2f71f4c`|371|
|M16|19종 윤곽선·실제 전투 피드백·제한된 Audio Bus·6초 엔딩·접근성·릴리스 manifest|`5285fad`|377|

전체 최신 단위·통합 **377 PASS / FAIL0**. 기존 테스트 삭제·완화 없이 최신 schema 기대값을 갱신하고 새 수락 테스트를 추가했다. 동일 저장 키, 전체20기록 LZ4/CRC32, 구버전1~11, 기존 재화·구매·장착·미완료 정산을 보존한다. 게임 엔진·19종·49노드/100레벨·기본20초와 Extra Time·입력 방식을 재작성하지 않았다.

주요 변경 묶음:

- `game.js`, `spawn-director.js`, `codex-attempts.js`: 물리 정확성·공급·Elite·기법 설명.
- `destruction-stage.js`, `response-director.js`, `response-patterns.js`: 단계·실제 연쇄 군집과 예산.
- `campaign/worlds.js`, `campaign/bosses.js`, `campaign/world-ui.js`: 월드·전술 보스·정산 UI.
- `modes.js`, `mode-combat.js`, `mode-ui.js`, `builds.js`, `build-ui.js`: 선택형 도전·가상 Draft·연구 효과·공유 장착 제한.
- `audio-bus.js`, `shape-outline.js`, `ending.js`, `renderer.js`, `presentation.js`, `app.js`, HTML/CSS: 표현·접근성·설정.
- `storage.js`, `progression.js`, `settlement-validation.js`, `config.js`: 호환 저장·동결된 정산 snapshot·한 번 지급.
- `tests/`, `artifacts/`, 단계별 보고서, README, `version.json`: 재현 가능한 검증과 근거.

최신 M16 검증은450조건×M15/ON/OFF=1,350 actual Run의 완전한 전투·경제 동등성, 기존6개 벤치마크 명령 재실행, 실제 Chrome15 Run(20초14+32초1), 실제32초20개 전체 기록의 동일 키 저장·reload2회·해시 일치, 손상·용량 실패·원본 Export·엔딩·옵션·키보드를 포함한다. 외부 배포·사용자 데이터 삭제·main 병합은 하지 않았다.

고정20초4,500 Run에서 Run50/100/200/300의 구매 레벨 중앙값 범위는67~69 /99~100 /100 /100, 잔고57~126 /919~1880 /47162~52427 /123396~131672다. 별도 Extra Time750 Run의 Run50은79~84레벨·잔고66~213·파괴508~519다. 고정시간 코호트의 초기 실험 라벨 오류는 실제 duration20에서 발견하여 명시하고 추가 코호트로 분리했다.

현재 가장 큰 문제는 스킬 완성 후 장기 잉여 재화와 Research의 비용 대비 상황적 이득이다. 자동 입력의 캠페인 최초 완료32~43 Run(고정20초),28~34 Run(Extra Time)을 사람의 목표 플레이 시간으로 해석하지 않는다. 가격 인상·초기화 없이 수치를 보고한다.

남은 사람 검증: 초반/후반 파괴 규모의 차이, 조사·보스 조건 이해, 스스로 택하는 공격 순서, 다음 Run의 동기, Research·Draft 선택의 만족도, 피로·멀미·접근성, 실제 완주 시간. 물리 time dilation·WebGL/bloom·논리 Arena 확대·고급 고유 분해·정식 음악은 후속 TODO다.

세부 구현·수치·제한은 각 단계 Implementation/Balance Report 및 [M16 Release QA](Shard_Storm_M16_Release_QA_Report.md), [Human Playtest](Shard_Storm_M16_Human_Playtest_Summary.md)를 참조한다. 대표 스크린샷은 `artifacts/m16-world-boss-w5-playing.png`, `artifacts/m16-ending-final-reveal.png`, `artifacts/m16-optional-draft-complete.png`, `artifacts/m16-reveal19-0.5.png`다.
